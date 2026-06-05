<script>
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Editor from './lib/components/Editor.svelte';
  import Console from './lib/components/Console.svelte';
  import SchemaBrowser from './lib/components/SchemaBrowser.svelte';
  import Notebook from './lib/components/Notebook.svelte';
  import MentorBot from './lib/components/MentorBot.svelte';

  // Import stores
  import { 
    language, 
    pythonChallengeIndex, 
    sqlChallengeIndex, 
    userPythonCode, 
    userSqlCode, 
    completedChallenges, 
    completeChallenge,
    level,
    xp,
    inventory,
    checkVanguardIntegrity,
    checkDailyStreakOnLoad
  } from './lib/stores/dojo-store.js';
  import { get } from 'svelte/store';
  import { playSuccessChime, playLevelUpFanfare, playErrorBuzz } from './lib/utils/soundscapes.js';
  import { parseMarkdown } from './lib/utils/markdown.js';
  import { convertCsvToSql } from './lib/utils/csv-parser.js';
  import { getConceptBreakdown } from './lib/data/concept-breakdowns.js';

  // Import exercise data
  import { pythonExercises } from './lib/data/python-exercises.js';
  import { sqlDbSeed, sqlExercises } from './lib/data/sql-exercises.js';

  // Import runners
  import { runPythonCode, loadPyodideInstance } from './lib/runners/python-runner.js';
  import { runSqlQuery, exportDatabase } from './lib/runners/sql-runner.js';

  // Icons
  import { 
    ArrowLeft, 
    Play, 
    RotateCcw, 
    HelpCircle, 
    CheckCircle2, 
    Eye, 
    Database, 
    Compass, 
    Terminal,
    ChevronLeft,
    ChevronRight,
    Trophy,
    Code,
    Star,
    Shield,
    Flame,
    BookOpen,
    GraduationCap,
    FileText,
    ListTodo
  } from 'lucide-svelte';

  // State
  let activeView = $state('dashboard'); // 'dashboard' | 'playground'
  let activeLang = $derived($language);
  let isSandboxMode = $state(false);

  // Layout & Editor States
  let isLeftPanelCollapsed = $state(false);
  let isRightPanelCollapsed = $state(false);
  let editorFontSize = $state(14); // 12 | 14 | 16 | 18
  let editorWordWrap = $state(true);

  // Active exercises
  let activePyIdx = $derived($pythonChallengeIndex);
  let activeSqlIdx = $derived($sqlChallengeIndex);

  let activePyChallenge = $derived(pythonExercises[activePyIdx]);
  let activeSqlChallenge = $derived(sqlExercises[activeSqlIdx]);

  let currentChallenge = $derived(
    isSandboxMode
      ? {
          id: "sandbox",
          title: "Free Sandbox Playground",
          prompt: activeLang === 'python' 
            ? "Experiment with your Python code here. You have full access to standard output, variables assignment, and preloaded libraries like NumPy, Pandas, Scikit-Learn, and matplotlib." 
            : "Write and execute arbitrary SQL queries against the SQLite database. Use the Schema Browser or Browse Tables on the right to examine tables like employees, departments, customers, orders, products, and order_items.",
          starterCode: activeLang === 'python'
            ? "# Write Python code here\nprint('Hello from the Python Dojo!')\n"
            : "-- Write SQL queries here\nSELECT * FROM products;\n",
          checks: [],
          hint: "Use standard Python print statements or variable assignment (e.g. result = ...). For SQL, highlight multiple tables using JOIN queries.",
          solution: activeLang === 'python'
            ? "# Example: \nimport numpy as np\narr = np.array([1, 2, 3])\nprint(arr * 2)"
            : "-- Example:\nSELECT c.customer_name, SUM(o.total_amount) \nFROM orders o \nINNER JOIN customers c ON o.customer_id = c.customer_id \nGROUP BY c.customer_name;",
          difficulty: "sandbox"
        }
      : (activeLang === 'python' ? activePyChallenge : activeSqlChallenge)
  );

  // Bind code inputs to stores
  let code = $state('');

  // Quiz state variables
  let selectedOption = $state(null);
  let quizAnswered = $state(false);
  let quizCorrect = $state(false);
  let completedQuizzes = $state([]);
  let systemToast = $state(null);
  let systemToastTimeout;

  // Watch for challenge/language updates and update code state
  $effect(() => {
    if (isSandboxMode) {
      code = localStorage.getItem(`dojo_sandbox_code_${activeLang}`) || currentChallenge.starterCode;
    } else if (activeLang === 'python') {
      code = $userPythonCode[activePyChallenge.id] || activePyChallenge.starterCode;
    } else {
      code = $userSqlCode[activeSqlChallenge.id] || activeSqlChallenge.starterCode;
    }
  });

  // Runner state
  let isRunning = $state(false);
  let hasRun = $state(false);
  let pyResult = $state({ success: false, stdout: '', error: '', checksPassed: false, checksResults: [], executionTime: null, executedCode: '' });
  let sqlResult = $state({ success: false, result: null, error: '', schema: {}, dbState: {}, checksPassed: false, checksResults: [], executionTime: null, executedCode: '' });
  let showCheatSheet = $state(false);
  let notebookInsertedSnippet = $state('');

  // UI state
  let activeTabLeft = $state('task'); // 'task' | 'concept' | 'cheats'
  let showHint = $state(false);
  let showSolution = $state(false);
  let activeTabRight = $state('console'); // 'console' | 'schema'
  let showConfetti = $state(false);

  // Sandbox Custom Seeding and Data Importer States
  let customDdlSeed = $state(localStorage.getItem('dojo_custom_sandbox_seed') || '');
  let showDdlPanel = $state(false);
  let showCsvPanel = $state(false);
  let showHistoryPanel = $state(false);
  let csvTableName = $state('');
  let csvDataInput = $state('');

  // Helper to safely parse sandbox history values from localstorage
  function loadHistory(lang) {
    try {
      const val = localStorage.getItem(`dojo_sandbox_history_${lang}`);
      if (!val) return [];
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  let sandboxHistoryPy = $state(loadHistory('python'));
  let sandboxHistorySql = $state(loadHistory('sql'));

  // Level Up and Achievement Toast notifications
  let showLevelUpModal = $state(false);
  let levelUpVal = $state(1);
  let activeBadgeUnlock = $state(null);

  // Watch for challenge/language/sandbox updates and reset console/results/tab views
  $effect(() => {
    const id = currentChallenge.id;
    const lang = activeLang;
    
    hasRun = false;
    showHint = false;
    showSolution = false;
    activeTabLeft = 'task';
    
    // Reset quiz state when challenge changes
    selectedOption = null;
    quizAnswered = false;
    quizCorrect = false;
    
    pyResult = { success: false, stdout: '', error: '', checksPassed: false, checksResults: [], executionTime: null, executedCode: '' };
    sqlResult = { success: false, result: null, error: '', schema: {}, dbState: {}, checksPassed: false, checksResults: [], executionTime: null, executedCode: '' };

    if (lang === 'python') {
      activeTabRight = 'console';
    } else if (lang === 'sql') {
      activeTabRight = 'schema';
    }

    // Auto-initialize SQL schema so the browser/schema isn't empty on load
    if (lang === 'sql') {
      const seedToUse = (isSandboxMode && customDdlSeed.trim()) ? customDdlSeed : sqlDbSeed;
      runSqlQuery(seedToUse, "").then(outcome => {
        if (outcome.success) {
          sqlResult.schema = outcome.schema;
          sqlResult.dbState = outcome.dbState;
        }
      });
    }
  });

  // Automated Backup Reminder when XP balance increments by 300
  $effect(() => {
    const currentXp = $xp;
    const lastBackupXp = Number(localStorage.getItem('dojo_last_backup_xp') || '0');
    if (currentXp - lastBackupXp >= 300) {
      alert(`🛡️ Dojo Reminder: You have gained ${currentXp - lastBackupXp} XP since your last backup! Don't forget to export your progress file under Settings in the Dashboard.`);
      localStorage.setItem('dojo_last_backup_xp', String(currentXp));
    }
  });

  // Triggered when clicking "Train" from Dashboard
  $effect(() => {
    // If the challenge index changes, switch to playground
    if (activePyIdx !== undefined || activeSqlIdx !== undefined) {
      // Avoid switching immediately on boot
      if (localStorage.getItem('dojo_python_challenge_index') !== null || localStorage.getItem('dojo_sql_challenge_index') !== null) {
        activeView = 'playground';
        isSandboxMode = false;
        showHint = false;
        showSolution = false;
        hasRun = false;
        activeTabRight = activeLang === 'sql' ? 'schema' : 'console';
      }
    }
  });

  // Handle editor updates
  function handleCodeChange(newCode) {
    if (isSandboxMode) {
      localStorage.setItem(`dojo_sandbox_code_${activeLang}`, newCode);
      code = newCode;
    } else if (activeLang === 'python') {
      userPythonCode.update(val => {
        val[activePyChallenge.id] = newCode;
        return val;
      });
    } else {
      userSqlCode.update(val => {
        val[activeSqlChallenge.id] = newCode;
        return val;
      });
    }
  }

  // Pre-load Pyodide on mount to make Python run fast later
  onMount(() => {
    // Run security and streak validation checks safely inside browser mount
    checkVanguardIntegrity();
    checkDailyStreakOnLoad();

    // Load completed concept quizzes
    try {
      const saved = localStorage.getItem('dojo_completed_quizzes');
      if (saved) {
        completedQuizzes = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error loading completed quizzes: ", e);
    }

    loadPyodideInstance().catch(err => console.error("Error pre-loading Pyodide: ", err));
  });

  // Reset current challenge code
  function resetCode() {
    if (confirm("Reset editor to original starter code?")) {
      handleCodeChange(currentChallenge.starterCode);
    }
  }

  // Pure JS simple Confetti explosion
  function triggerConfetti() {
    showConfetti = true;
    setTimeout(() => {
      showConfetti = false;
    }, 3000);
  }

  // Sandbox History tracking helpers
  function recordSandboxRun(lang, codeStr) {
    if (!codeStr || !codeStr.trim()) return;
    let history = lang === 'python' ? sandboxHistoryPy : sandboxHistorySql;
    
    // Remove if already exists to place at front
    history = history.filter(item => item !== codeStr);
    history.unshift(codeStr);
    
    // Cap at 5
    if (history.length > 5) history = history.slice(0, 5);
    
    if (lang === 'python') {
      sandboxHistoryPy = history;
      localStorage.setItem('dojo_sandbox_history_python', JSON.stringify(history));
    } else {
      sandboxHistorySql = history;
      localStorage.setItem('dojo_sandbox_history_sql', JSON.stringify(history));
    }
  }

  function restoreHistoryItem(itemCode) {
    if (confirm("Replace your current editor code with this version from run history?")) {
      handleCodeChange(itemCode);
    }
  }

  // Download active script file (Item 124)
  function downloadActiveCode() {
    const ext = activeLang === 'python' ? 'py' : 'sql';
    const filename = isSandboxMode 
      ? `dojo_sandbox.${ext}` 
      : `${currentChallenge.id}.${ext}`;
    
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export Sandbox Database as SQLite Binary File (Dojo Sandbox Export)
  async function downloadSqliteDb() {
    try {
      const seedToUse = customDdlSeed || sqlDbSeed;
      const binary = await exportDatabase(seedToUse, activeLang === 'sql' ? code : '');
      const blob = new Blob([binary], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dojo_sandbox_database.sqlite';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export SQLite database: " + e.message);
    }
  }

  // Custom DB Seed application
  async function applyCustomDdl() {
    localStorage.setItem('dojo_custom_sandbox_seed', customDdlSeed);
    alert("Custom DDL schema seed saved! Refreshing database schema browser...");
    const outcome = await runSqlQuery(customDdlSeed || sqlDbSeed, "SELECT 1;");
    if (outcome.success) {
      sqlResult.schema = outcome.schema;
      sqlResult.dbState = outcome.dbState;
      activeTabRight = 'schema';
    } else {
      alert("Error executing DDL seed: " + outcome.error);
    }
  }

  function resetDdlToDefault() {
    if (confirm("Restore standard SQLite database schema? This will clear your custom seeds and tables.")) {
      customDdlSeed = "";
      localStorage.removeItem('dojo_custom_sandbox_seed');
      runSqlQuery(sqlDbSeed, "SELECT 1;").then(outcome => {
        if (outcome.success) {
          sqlResult.schema = outcome.schema;
          sqlResult.dbState = outcome.dbState;
        }
      });
      alert("Standard SQL schema restored!");
    }
  }

  // CSV Data parsing
  function importCsvTable() {
    if (!csvTableName.trim() || !csvDataInput.trim()) {
      alert("Please specify a table name and enter some CSV data.");
      return;
    }
    const sqlStatements = convertCsvToSql(csvTableName, csvDataInput);
    if (!sqlStatements) {
      alert("Failed to parse CSV! Check columns and formatting.");
      return;
    }
    
    // Append to existing custom DDL (or initialize it)
    const currentSeed = customDdlSeed.trim() ? customDdlSeed : sqlDbSeed;
    customDdlSeed = currentSeed + "\n\n" + sqlStatements;
    localStorage.setItem('dojo_custom_sandbox_seed', customDdlSeed);
    
    // Reset inputs
    csvTableName = "";
    csvDataInput = "";
    
    // Execute
    applyCustomDdl();
  }

  // Workspace States (Notebook, Mentor Drawer)
  let workspaceMode = $state('editor'); // 'editor' | 'notebook'
  let showMentorDrawer = $state(false);

  // Directly execute queries (explain query plan, table editor edits, DDL seeds)
  async function runQueryDirectly(queryText) {
    const seedToUse = (isSandboxMode && customDdlSeed.trim()) ? customDdlSeed : sqlDbSeed;
    const outcome = await runSqlQuery(seedToUse, queryText);
    if (outcome.success) {
      sqlResult.dbState = outcome.dbState;
      sqlResult.schema = outcome.schema;
    }
    return outcome;
  }

  // Inject formatted code callback
  function applyFormattedCode(formatted) {
    handleCodeChange(formatted);
  }

  // Show Toast badge unlocked
  function showBadgeUnlockNotification(badgeIds) {
    const id = badgeIds[0];
    const badgeMap = {
      'first-blood': { name: 'First Blood', desc: 'Complete your first challenge in the Dojo.', color: '#f59e0b' },
      'pythonista': { name: 'Pythonista', desc: 'Complete at least 10 Python challenges.', color: '#3b82f6' },
      'sql-maestro': { name: 'SQL Maestro', desc: 'Complete at least 10 SQL challenges.', color: '#10b981' },
      'ml-pioneer': { name: 'ML Pioneer', desc: 'Complete at least 5 NumPy/Pandas challenges.', color: '#8b5cf6' },
      'svm-champion': { name: 'SVM Champion', desc: 'Complete the SVM model training challenge.', color: '#ec4899' },
      'dedicated-scholar': { name: 'Dedicated Scholar', desc: 'Maintain a daily streak of 3 days or more.', color: '#f97316' },
      'level-5-mastery': { name: 'Level 5 Mastery', desc: 'Reach Mastery Level 5 or higher.', color: '#eab308' }
    };
    const details = badgeMap[id];
    if (details) {
      activeBadgeUnlock = { id, ...details };
      setTimeout(() => {
        activeBadgeUnlock = null;
      }, 5000);
    }
  }

  // SQL check enrichment helper
  function enrichSqlCheckResult(check, result) {
    let has_expected = false;
    let expected = "";
    let has_actual = false;
    let actual = "";
    
    if (!result || result.length === 0) {
      return {
        has_expected: true,
        expected: "Valid query result rows",
        has_actual: true,
        actual: "No rows returned (empty result)"
      };
    }
    
    const cols = result[0].columns || [];
    const rows = result[0].values || [];
    const msg = (check.msg || "").toLowerCase();
    
    if (msg.includes("columns") || msg.includes("column")) {
      has_expected = true;
      const matches = check.msg.match(/'([^']+)'/g);
      if (matches) {
        expected = matches.join(", ");
      } else {
        expected = "Specific columns";
      }
      has_actual = true;
      actual = `[${cols.join(", ")}]`;
    } else if (msg.includes("rows") || msg.includes("row count") || msg.includes("exactly") || msg.includes("return")) {
      has_expected = true;
      const matches = check.msg.match(/\d+/);
      if (matches) {
        expected = `${matches[0]} rows`;
      } else {
        expected = "Specific row count";
      }
      has_actual = true;
      actual = `${rows.length} rows`;
    } else {
      has_expected = true;
      expected = "Fulfill check constraint";
      has_actual = true;
      actual = rows.length > 0 ? `Returned ${rows.length} rows. First row: [${rows[0].join(", ")}]` : "0 rows";
    }
    
    return { has_expected, expected, has_actual, actual };
  }

  // Execute active task
  async function runCode() {
    isRunning = true;
    hasRun = true;
    const startTime = performance.now();

    if (isSandboxMode) {
      recordSandboxRun(activeLang, code);
    }

    if (activeLang === 'python') {
      const oldLevel = get(level);
      const outcome = await runPythonCode(currentChallenge.prelude, code, currentChallenge.checks);
      const endTime = performance.now();
      pyResult = { ...outcome, executionTime: endTime - startTime, executedCode: code };

      if (!isSandboxMode && outcome.success && outcome.checksPassed) {
        const newlyUnlocked = completeChallenge(currentChallenge.id, currentChallenge.difficulty);
        if (newlyUnlocked && newlyUnlocked.length > 0) {
          showBadgeUnlockNotification(newlyUnlocked);
        }
        const newLevel = get(level);
        if (newLevel > oldLevel) {
          playLevelUpFanfare();
          levelUpVal = newLevel;
          showLevelUpModal = true;
        } else if (!newlyUnlocked || newlyUnlocked.length === 0) {
          playSuccessChime();
        }
        triggerConfetti();
      } else if (!isSandboxMode && (!outcome.success || !outcome.checksPassed)) {
        playErrorBuzz();
      } else if (isSandboxMode) {
        if (outcome.success) {
          playSuccessChime();
        } else {
          playErrorBuzz();
        }
      }
    } else {
      const seedToUse = (isSandboxMode && customDdlSeed.trim()) ? customDdlSeed : sqlDbSeed;
      const outcome = await runSqlQuery(seedToUse, code);
      const endTime = performance.now();

      // Evaluate the custom SQL checks array
      let allChecksPassed = true;
      const checksResults = [];
      
      if (outcome.success) {
        for (const check of currentChallenge.checks) {
          let passed = false;
          try {
            passed = check.rule(outcome.result);
          } catch (e) {
            passed = false;
          }
          
          let enrichment = {};
          if (!passed) {
            enrichment = enrichSqlCheckResult(check, outcome.result);
          }
          checksResults.push({ passed, msg: check.msg, ...enrichment });
          if (!passed) allChecksPassed = false;
        }
      } else {
        allChecksPassed = false;
        checksResults.push({ passed: false, msg: "Database query execution failed." });
      }

      sqlResult = { 
        ...outcome, 
        executionTime: endTime - startTime, 
        executedCode: code,
        checksPassed: allChecksPassed, 
        checksResults: checksResults 
      };

      if (!isSandboxMode && allChecksPassed) {
        const oldLevel = get(level);
        const newlyUnlocked = completeChallenge(currentChallenge.id, currentChallenge.difficulty);
        if (newlyUnlocked && newlyUnlocked.length > 0) {
          showBadgeUnlockNotification(newlyUnlocked);
        }
        const newLevel = get(level);
        if (newLevel > oldLevel) {
          playLevelUpFanfare();
          levelUpVal = newLevel;
          showLevelUpModal = true;
        } else if (!newlyUnlocked || newlyUnlocked.length === 0) {
          playSuccessChime();
        }
        triggerConfetti();
      } else if (!isSandboxMode && !allChecksPassed) {
        playErrorBuzz();
      } else if (isSandboxMode) {
        if (outcome.success) {
          playSuccessChime();
        } else {
          playErrorBuzz();
        }
      }
    }

    isRunning = false;
    activeTabRight = 'console';
  }

  // System notification toast helper
  function showSystemToast(message, type = 'info') {
    if (systemToastTimeout) clearTimeout(systemToastTimeout);
    systemToast = { message, type };
    systemToastTimeout = setTimeout(() => {
      systemToast = null;
    }, 4000);
  }

  // Submit quiz answer and update XP
  function submitQuizAnswer(optionIdx, correctIdx, topicName) {
    if (quizAnswered) return;
    selectedOption = optionIdx;
    quizAnswered = true;
    
    if (optionIdx === correctIdx) {
      quizCorrect = true;
      playSuccessChime();
      
      if (!completedQuizzes.includes(topicName)) {
        completedQuizzes = [...completedQuizzes, topicName];
        localStorage.setItem('dojo_completed_quizzes', JSON.stringify(completedQuizzes));
        xp.update(val => val + 10);
        showSystemToast("🎯 Correct! +10 XP earned!", "success");
      } else {
        showSystemToast("🎯 Correct!", "success");
      }
    } else {
      quizCorrect = false;
      playErrorBuzz();
      showSystemToast("❌ Incorrect. Review key takeaways!", "error");
    }
  }

  // Auto-evaluation of task steps based on active code content
  function checkStepCompletion(step, currentCode) {
    if (!currentCode) return false;
    const normalizedCode = currentCode.replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Check based on step titles and content
    if (step.title.includes("Function Signature") || step.title.includes("Define the Function")) {
      return currentCode.includes("def ") && currentCode.includes(":");
    }
    if (step.title.includes("Return the Output") || step.title.includes("Ensure the function returns")) {
      return currentCode.includes("return ");
    }
    if (step.title.includes("result") || step.title.includes("Assign")) {
      return currentCode.includes("result =") || currentCode.includes("result=");
    }
    if (step.title.includes("Select Projection") || step.title.includes("SELECT")) {
      return normalizedCode.includes("select ");
    }
    if (step.title.includes("Join") || step.title.includes("JOIN")) {
      return normalizedCode.includes("join ");
    }
    if (step.title.includes("Filter Row") || step.title.includes("WHERE")) {
      return normalizedCode.includes("where ");
    }
    if (step.title.includes("Aggregate") || step.title.includes("GROUP BY")) {
      return normalizedCode.includes("group by ");
    }
    if (step.title.includes("Sort") || step.title.includes("ORDER BY")) {
      return normalizedCode.includes("order by ");
    }
    if (step.title.includes("Terminate") || step.title.includes(";")) {
      return normalizedCode.includes(";");
    }
    
    // Default fallback check
    return false;
  }

  // Generate learning step-by-step breakdown chunks dynamically for any Python/SQL task
  function getChallengeSteps(challenge) {
    if (!challenge) return [];
    if (challenge.steps && challenge.steps.length > 0) {
      return challenge.steps;
    }
    
    const steps = [];
    const prompt = challenge.prompt || "";
    const isPython = !challenge.id.startsWith('sql-');
    
    if (isPython) {
      if (prompt.toLowerCase().includes("function")) {
        steps.push({
          id: 1,
          title: "1. Define the Function Signature",
          desc: "Declare the function using the `def` keyword with the correct parameters and a colon.",
          code: challenge.starterCode.split('\n')[0] || "def function_name(params):"
        });
        steps.push({
          id: 2,
          title: "2. Implement Core Logic",
          desc: "Write calculations or operations inside the function block to compute results.",
          code: challenge.solution ? "# Implement logic here" : ""
        });
        steps.push({
          id: 3,
          title: "3. Return the Output",
          desc: "Make sure the function returns the correct evaluation using the `return` statement.",
          code: "return output_val"
        });
        steps.push({
          id: 4,
          title: "4. Assign Reference to result",
          desc: "Point the variable `result` to your function name so the tests can call it.",
          code: "result = " + (challenge.starterCode.match(/result\s*=\s*([a-zA-Z0-9_]+)/)?.[1] || "function_name")
        });
      } else {
        steps.push({
          id: 1,
          title: "1. Inspect Scope Variables",
          desc: "Observe variables preloaded in the prelude (like dictionary input or list values).",
          code: challenge.prelude || "# Review variables in prompt"
        });
        steps.push({
          id: 2,
          title: "2. Perform Logic / Arithmetic",
          desc: "Apply operators, array operations, or lists functions to calculate the solution.",
          code: "# Perform calculation"
        });
        steps.push({
          id: 3,
          title: "3. Assign Output to result",
          desc: "Bind the computed value directly to the variable named `result`.",
          code: "result = ..."
        });
      }
    } else {
      steps.push({
        id: 1,
        title: "1. Define Select Columns",
        desc: "Build the query base select projection specifying column names or aggregations.",
        code: "SELECT columns"
      });
      if (prompt.toLowerCase().includes("join")) {
        steps.push({
          id: 2,
          title: "2. Join Relational Tables",
          desc: "Specify JOIN relationships using tables and column keys (primary & foreign).",
          code: "FROM t1 JOIN t2 ON t1.id = t2.t1_id"
        });
      }
      if (prompt.toLowerCase().includes("where") || prompt.toLowerCase().includes("filter") || prompt.toLowerCase().includes(">") || prompt.toLowerCase().includes("salary")) {
        steps.push({
          id: steps.length + 1,
          title: `${steps.length + 1}. Filter Rows (WHERE)`,
          desc: "Introduce a WHERE clause to filter entries based on parameters.",
          code: "WHERE filter_condition"
        });
      }
      if (prompt.toLowerCase().includes("group by") || prompt.toLowerCase().includes("count") || prompt.toLowerCase().includes("average")) {
        steps.push({
          id: steps.length + 1,
          title: `${steps.length + 1}. Partition & Aggregate (GROUP BY)`,
          desc: "Add a GROUP BY block, using summary functions (AVG, COUNT, SUM).",
          code: "GROUP BY grouping_column"
        });
      }
      if (prompt.toLowerCase().includes("order by") || prompt.toLowerCase().includes("sort") || prompt.toLowerCase().includes("highest")) {
        steps.push({
          id: steps.length + 1,
          title: `${steps.length + 1}. Sort Result Rows (ORDER BY)`,
          desc: "Sort column rows ascending or descending, filtering counts.",
          code: "ORDER BY col DESC"
        });
      }
      steps.push({
        id: steps.length + 1,
        title: `${steps.length + 1}. Terminate Query`,
        desc: "Close the query block with a semicolon.",
        code: ";"
      });
    }
    return steps;
  }

  // Insert code snippet at the end of the user's workspace, copying to clipboard & giving notifications
  function insertSnippet(snippet) {
    try {
      navigator.clipboard.writeText(snippet).catch(() => {});
    } catch (e) {}

    if (workspaceMode === 'notebook') {
      notebookInsertedSnippet = snippet;
      showSystemToast("📋 Snippet inserted into active notebook cell!", "success");
    } else {
      let newCode = code;
      if (newCode.endsWith('\n') || newCode === '') {
        newCode = newCode + snippet;
      } else {
        newCode = newCode + '\n' + snippet;
      }
      code = newCode;
      handleCodeChange(newCode); // Update the stores!
      showSystemToast("📋 Snippet inserted into editor!", "success");
    }
  }

  // Global keyboard shortcut listener
  function handleKeyDown(event) {
    // Ctrl+Enter or Cmd+Enter to execute code
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isRunning) {
        runCode();
      }
    }
    // Ctrl+Alt+R to reset workspace code
    if (event.ctrlKey && event.altKey && event.key === 'r') {
      event.preventDefault();
      resetCode();
    }
  }
</script>

<!-- Listen to global window keyboard shortcuts -->
<svelte:window onkeydown={handleKeyDown} />

<!-- Confetti Canvas Particle Overlay -->
{#if showConfetti}
  <div class="confetti-container">
    {#each Array(80) as _, i}
      <div 
        class="confetti-particle" 
        style="
          --x: {Math.random() * 100}vw;
          --delay: {Math.random() * 0.5}s;
          --color: {['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5]};
          --rotation: {Math.random() * 360}deg;
          --drift: {Math.random() * 40 - 20}vw;
        "
      ></div>
    {/each}
  </div>
{/if}

<div class="dojo-layout">
  <Header />

  {#if activeView === 'dashboard'}
    <main class="main-content">
      <Dashboard onOpenSandbox={() => { isSandboxMode = true; activeView = 'playground'; hasRun = false; showHint = false; showSolution = false; }} />
    </main>
  {:else}
    <!-- Playground View -->
    <main class="playground-layout">
      <!-- Top Action Bar -->
      <div class="play-action-bar">
        <button class="back-btn" onclick={() => { activeView = 'dashboard'; isSandboxMode = false; }}>
          <ArrowLeft size={16} />
          <span>Back to Syllabus</span>
        </button>

        <div class="challenge-title-row">
          <span class="diff-badge {currentChallenge.difficulty}">{currentChallenge.difficulty}</span>
          <span class="topic-tag">{currentChallenge.topic}</span>
          <h1 class="challenge-head">{currentChallenge.title}</h1>
        </div>

        <div class="run-actions">
          <button class="action-btn secondary-act" onclick={resetCode} title="Reset starter code">
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <button class="action-btn primary-act" onclick={runCode} disabled={isRunning}>
            {#if isRunning}
              <span class="loader-spinner"></span>
              <span>Running...</span>
            {:else}
              <Play size={14} fill="currentColor" />
              <span>Run Code</span>
            {/if}
          </button>
        </div>
      </div>

      <!-- Main Panels Workspace split -->
      <div 
        class="workspace-grid" 
        style="grid-template-columns: {isLeftPanelCollapsed ? '48px' : '320px'} 1fr {isRightPanelCollapsed ? '48px' : '1fr'};"
      >
        <!-- Panel 1: Prompt details -->
        {#if isLeftPanelCollapsed}
          <section class="workspace-panel panel-left collapsed">
            <button class="panel-toggle-btn expand-btn" onclick={() => isLeftPanelCollapsed = false} title="Expand Instructions">
              <ChevronRight size={16} />
            </button>
          </section>
        {:else}
          <section class="workspace-panel panel-left">
            <div class="panel-header-row left-tabs-header">
              <div class="left-panel-tabs">
                <button 
                  class="left-tab-btn" 
                  class:active={activeTabLeft === 'task'} 
                  onclick={() => activeTabLeft = 'task'}
                  title="View task description"
                >
                  <FileText size={11} />
                  <span>Task</span>
                </button>
                <button 
                  class="left-tab-btn" 
                  class:active={activeTabLeft === 'breakdown'} 
                  onclick={() => activeTabLeft = 'breakdown'}
                  title="View step-by-step task breakdown"
                >
                  <ListTodo size={11} />
                  <span>Breakdown</span>
                </button>
                <button 
                  class="left-tab-btn" 
                  class:active={activeTabLeft === 'concept'} 
                  onclick={() => activeTabLeft = 'concept'}
                  title="View concept explanation"
                >
                  <GraduationCap size={11} />
                  <span>Concept</span>
                </button>
                <button 
                  class="left-tab-btn" 
                  class:active={activeTabLeft === 'cheats'} 
                  onclick={() => activeTabLeft = 'cheats'}
                  title="View interactive cheat sheet"
                >
                  <BookOpen size={11} />
                  <span>Cheats</span>
                </button>
              </div>
              <button class="panel-toggle-btn" onclick={() => isLeftPanelCollapsed = true} title="Collapse Instructions">
                <ChevronLeft size={14} />
              </button>
            </div>
            
            <div class="panel-section padding-box scrollable-left-content">
              {#if activeTabLeft === 'task'}
                {#if isSandboxMode}
                  <div style="margin-bottom: 12px; display: flex; justify-content: center;">
                    <span class="sandbox-glow-badge">SANDBOX PLAYGROUND ACTIVE</span>
                  </div>
                {/if}
                
                <div class="prompt-text">
                  <p>{@html parseMarkdown(currentChallenge.prompt)}</p>
                </div>

                <!-- Hint Section -->
                {#if currentChallenge.hint}
                  <div class="expansion-block">
                    <button 
                      class="expansion-header" 
                      onclick={() => showHint = !showHint}
                    >
                      <HelpCircle size={14} class="header-icon" />
                      <span>Need a Hint?</span>
                      <span class="caret" class:open={showHint}>▼</span>
                    </button>
                    {#if showHint}
                      <div class="expansion-content">
                        <p>{@html parseMarkdown(currentChallenge.hint)}</p>
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Solution Section -->
                {#if currentChallenge.solution}
                  <div class="expansion-block solution-block">
                    <button 
                      class="expansion-header" 
                      onclick={() => showSolution = !showSolution}
                    >
                      <Eye size={14} class="header-icon" />
                      <span>Show Solution</span>
                      <span class="caret" class:open={showSolution}>▼</span>
                    </button>
                    {#if showSolution}
                      <div class="expansion-content solution-content">
                        <pre class="solution-code"><code>{currentChallenge.solution}</code></pre>
                      </div>
                    {/if}
                  </div>
                {/if}
              {:else if activeTabLeft === 'breakdown'}
                {@const steps = getChallengeSteps(currentChallenge)}
                <div class="steps-breakdown-wrapper">
                  <div class="concept-header-pill" style="border-color: var(--color-primary); color: var(--color-primary); background: var(--color-accent-glow);">
                    <ListTodo size={12} style="margin-right: 4px;" />
                    <span>STEP-BY-STEP LEARNING</span>
                  </div>
                  <h3 class="concept-title">Task Breakdown</h3>
                  <p class="concept-desc" style="margin-bottom: 12px;">
                    We've divided this task into smaller chunks to help you build the solution incrementally. Review each step below:
                  </p>

                  <div class="steps-list">
                    {#each steps as step, idx}
                      {@const isStepDone = checkStepCompletion(step, code)}
                      <div class="step-card" class:completed={isStepDone}>
                        <div class="step-card-header">
                          <span class="step-card-title">{step.title}</span>
                          <span class="step-status-badge" class:completed={isStepDone}>
                            {isStepDone ? '✓ Completed' : 'Pending'}
                          </span>
                        </div>
                        <p class="step-card-desc">{step.desc}</p>
                        {#if step.code}
                          <div class="step-code-box">
                            <pre class="step-code"><code>{step.code}</code></pre>
                            <button 
                              class="step-use-btn" 
                              onclick={() => insertSnippet(step.code + '\n')} 
                              title="Insert helper code at cursor"
                            >
                              Insert Snippet
                            </button>
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {:else if activeTabLeft === 'concept'}
                {@const breakdown = getConceptBreakdown(currentChallenge.topic, currentChallenge.id)}
                <div class="concept-breakdown-wrapper">
                  <div class="concept-header-pill">
                    <GraduationCap size={12} style="margin-right: 4px;" />
                    <span>{currentChallenge.topic.toUpperCase()}</span>
                  </div>
                  <h3 class="concept-title">{breakdown.title}</h3>
                  <p class="concept-desc">{breakdown.desc}</p>
                  
                  {#if breakdown.diagram}
                    <div class="concept-diagram-container">
                      <div class="diagram-header-tag">VISUAL BLOCK FLOW</div>
                      <pre class="concept-diagram"><code>{breakdown.diagram}</code></pre>
                    </div>
                  {/if}
                  
                  <div class="concept-keypoints-box">
                    <div class="keypoints-header-tag">KEY TAKEAWAYS</div>
                    <ul class="concept-keypoints">
                      {#each breakdown.keyPoints as pt}
                        <li>{pt}</li>
                      {/each}
                    </ul>
                  </div>

                  {#if breakdown.example}
                    <div class="concept-example-box">
                      <div class="example-header-tag">SYNTAX EXAMPLE</div>
                      <pre class="concept-example-code"><code>{breakdown.example}</code></pre>
                      <button class="concept-use-btn" onclick={() => insertSnippet(breakdown.example + '\n')} title="Insert this code example into editor">
                        Insert into Editor
                      </button>
                    </div>
                  {/if}

                  <!-- Interactive Concept Check Quiz -->
                  {#if breakdown.quiz}
                    <div class="concept-quiz-card" class:completed={completedQuizzes.includes(currentChallenge.topic)}>
                      <div class="quiz-header">
                        <span class="quiz-title-tag">💡 CONCEPT CHECK</span>
                        {#if completedQuizzes.includes(currentChallenge.topic)}
                          <span class="quiz-badge success">✓ COMPLETED (+10 XP)</span>
                        {:else}
                          <span class="quiz-badge reward">+10 XP REWARD</span>
                        {/if}
                      </div>
                      <p class="quiz-question">{breakdown.quiz.question}</p>
                      
                      <div class="quiz-options">
                        {#each breakdown.quiz.options as opt, idx}
                          <button 
                            class="quiz-option-btn"
                            class:selected={selectedOption === idx}
                            class:correct={quizAnswered && idx === breakdown.quiz.answer}
                            class:wrong={quizAnswered && selectedOption === idx && idx !== breakdown.quiz.answer}
                            disabled={quizAnswered}
                            onclick={() => submitQuizAnswer(idx, breakdown.quiz.answer, currentChallenge.topic)}
                          >
                            <span class="option-letter">{['A', 'B', 'C', 'D'][idx]}</span>
                            <span class="option-text">{opt}</span>
                          </button>
                        {/each}
                      </div>

                      {#if quizAnswered}
                        <div class="quiz-explanation-box" class:correct={quizCorrect}>
                          <p class="explanation-status">
                            {quizCorrect ? '🎉 Correct!' : '❌ Incorrect'}
                          </p>
                          <p class="explanation-text">{breakdown.quiz.explanation}</p>
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {:else if activeTabLeft === 'cheats'}
                <!-- Cheatsheet Section -->
                <div class="snippets-grid-tab">
                  <p style="font-size: 11px; color: var(--color-muted); margin-bottom: 12px; line-height: 1.4;">
                    Click any helper syntax snippet block below to insert it at your cursor in the editor workspace.
                  </p>
                  <div class="snippets-grid-compact">
                    {#if activeLang === 'python'}
                      <button class="snippet-item" onclick={() => insertSnippet('import numpy as np\n')}>
                        <code>import numpy as np</code>
                        <span>Import NumPy</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('import pandas as pd\n')}>
                        <code>import pandas as pd</code>
                        <span>Import Pandas</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('for i in range(10):\n    print(i)\n')}>
                        <code>for i in range(10)</code>
                        <span>For Loop</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('[x for x in items if x > 0]')}>
                        <code>[x for x in list]</code>
                        <span>List Comprehension</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('np.mean(arr)')}>
                        <code>np.mean(arr)</code>
                        <span>Mean calculation</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('df.groupby(\'col\').mean()')}>
                        <code>df.groupby()</code>
                        <span>Pandas GroupBy</span>
                      </button>

                      <!-- Advanced Python snippets -->
                      {#if $inventory.advancedCheatsUnlocked}
                        <button class="snippet-item premium" onclick={() => insertSnippet('import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n%matplotlib inline\n')}>
                          <code>plt.plot() + inline</code>
                          <span>ML Plot Setup</span>
                        </button>
                        <button class="snippet-item premium" onclick={() => insertSnippet('df.drop_duplicates(inplace=True)\ndf.fillna(df.mean(), inplace=True)\n')}>
                          <code>df.fillna()</code>
                          <span>Pandas Cleanse</span>
                        </button>
                        <button class="snippet-item premium" onclick={() => insertSnippet('from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=101)\n')}>
                          <code>train_test_split</code>
                          <span>Scikit Train Split</span>
                        </button>
                        <button class="snippet-item premium" onclick={() => insertSnippet('from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler()\nscaled_X = scaler.fit_transform(X_train)\n')}>
                          <code>StandardScaler</code>
                          <span>Scale Features</span>
                        </button>
                      {:else}
                        <div class="snippet-locked-banner" title="Unlock in Dojo Shop">
                          <span>🔒 Locked: Purchase "Advanced Cheats Pack" in Dojo Shop to unlock premium ML snippets.</span>
                        </div>
                      {/if}
                    {:else}
                      <button class="snippet-item" onclick={() => insertSnippet('SELECT * FROM table;\n')}>
                        <code>SELECT * FROM...</code>
                        <span>Select All</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('SELECT * FROM table\nWHERE condition;\n')}>
                        <code>WHERE ...</code>
                        <span>Filter rows</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('SELECT * FROM t1\nJOIN t2 ON t1.id = t2.t1_id;\n')}>
                        <code>INNER JOIN ...</code>
                        <span>Join tables</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('SELECT col, COUNT(*)\nFROM table\nGROUP BY col;\n')}>
                        <code>GROUP BY ...</code>
                        <span>Aggregation</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('SELECT col, ROW_NUMBER() OVER (PARTITION BY col2 ORDER BY col3) as rnk\nFROM table;\n')}>
                        <code>ROW_NUMBER() OVER...</code>
                        <span>Window Function</span>
                      </button>
                      <button class="snippet-item" onclick={() => insertSnippet('WITH cte AS (\n  SELECT * FROM table\n)\nSELECT * FROM cte;\n')}>
                        <code>WITH cte AS (...)</code>
                        <span>Common Table Exp.</span>
                      </button>

                      <!-- Advanced SQL snippets -->
                      {#if $inventory.advancedCheatsUnlocked}
                        <button class="snippet-item premium" onclick={() => insertSnippet('SELECT col, \n       AVG(col) OVER (ORDER BY date_col ROWS BETWEEN 3 PRECEDING AND CURRENT ROW) as moving_avg\nFROM table;\n')}>
                          <code>ROWS BETWEEN...</code>
                          <span>Moving Average</span>
                        </button>
                        <button class="snippet-item premium" onclick={() => insertSnippet('SELECT col,\n       CASE WHEN score >= 90 THEN \'A\'\n            WHEN score >= 80 THEN \'B\'\n            ELSE \'C\' END as grade\nFROM table;\n')}>
                          <code>CASE WHEN...</code>
                          <span>Conditional Logic</span>
                        </button>
                        <button class="snippet-item premium" onclick={() => insertSnippet('SELECT t1.col,\n       (SELECT COUNT(*) FROM t2 WHERE t2.t1_id = t1.id) as child_count\nFROM t1;\n')}>
                          <code>Correlated Subquery</code>
                          <span>Correlated Count</span>
                        </button>
                        <button class="snippet-item premium" onclick={() => insertSnippet('CREATE INDEX idx_tbl_col ON tbl (col);\n')}>
                          <code>CREATE INDEX ...</code>
                          <span>Optimize Lookup</span>
                        </button>
                      {:else}
                        <div class="snippet-locked-banner" title="Unlock in Dojo Shop">
                          <span>🔒 Locked: Purchase "Advanced Cheats Pack" in Dojo Shop to unlock premium SQL window and index snippets.</span>
                        </div>
                      {/if}
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- Sandbox Control Panels -->
              {#if isSandboxMode}
                <!-- Sandbox DDL Seeding (SQL only) -->
                {#if activeLang === 'sql'}
                  <div class="expansion-block">
                    <button class="expansion-header" onclick={() => showDdlPanel = !showDdlPanel}>
                      <Database size={14} class="header-icon" />
                      <span>Custom Seed DDL</span>
                      <span class="caret" class:open={showDdlPanel}>▼</span>
                    </button>
                    {#if showDdlPanel}
                      <div class="expansion-content">
                        <p style="font-size: 11px; margin-bottom: 8px; color: #64748b;">
                          Write custom SQLite DDL schema statements to seed your Sandbox DB.
                        </p>
                        <textarea 
                          class="sandbox-textarea DDL-textarea"
                          bind:value={customDdlSeed}
                          placeholder="CREATE TABLE my_table (id INT, name TEXT);"
                        ></textarea>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                          <button class="sandbox-btn primary" onclick={applyCustomDdl}>Apply Seed</button>
                          <button class="sandbox-btn secondary" onclick={resetDdlToDefault}>Reset Default</button>
                        </div>
                      </div>
                    {/if}
                  </div>

                  <!-- CSV Data Importer (SQL only) -->
                  <div class="expansion-block">
                    <button class="expansion-header" onclick={() => showCsvPanel = !showCsvPanel}>
                      <Database size={14} class="header-icon" />
                      <span>Import CSV Table</span>
                      <span class="caret" class:open={showCsvPanel}>▼</span>
                    </button>
                    {#if showCsvPanel}
                      <div class="expansion-content">
                        <p style="font-size: 11px; margin-bottom: 8px; color: #64748b;">
                          Convert raw comma-separated text into a SQLite table automatically.
                        </p>
                        <input 
                          type="text" 
                          class="sandbox-input" 
                          bind:value={csvTableName} 
                          placeholder="Table name (e.g. sales)" 
                        />
                        <textarea 
                          class="sandbox-textarea csv-textarea"
                          bind:value={csvDataInput}
                          placeholder="id,name,amount&#10;1,Alice,250.50&#10;2,Bob,120.00"
                        ></textarea>
                        <button class="sandbox-btn primary" style="margin-top: 8px; width: 100%;" onclick={importCsvTable}>
                          Import as SQL Table
                        </button>
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Sandbox Run History -->
                <div class="expansion-block">
                  <button class="expansion-header" onclick={() => showHistoryPanel = !showHistoryPanel}>
                    <Terminal size={14} class="header-icon" />
                    <span>Recent Run History</span>
                    <span class="caret" class:open={showHistoryPanel}>▼</span>
                  </button>
                  {#if showHistoryPanel}
                    {@const history = activeLang === 'python' ? sandboxHistoryPy : sandboxHistorySql}
                    <div class="expansion-content">
                      {#if history.length === 0}
                        <p style="font-size: 11px; color: #64748b; margin: 0;">No sandbox runs recorded yet.</p>
                      {:else}
                        <div class="history-list">
                          {#each history as item, idx}
                            <button class="history-item" onclick={() => restoreHistoryItem(item)} title="Restore this code">
                              <span class="history-num">#{idx + 1}</span>
                              <span class="history-code-preview">{item.trim().slice(0, 45)}{item.trim().length > 45 ? '...' : ''}</span>
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </section>
        {/if}

        <!-- Panel 2: Code Editor -->
        <section class="workspace-panel panel-center">
          <div class="editor-header-bar">
            <span class="editor-title">Editor Workspace</span>
            <div class="editor-controls">
              <!-- Font Sizing -->
              <div class="font-controls">
                <button class="editor-ctrl-btn" onclick={() => editorFontSize = Math.max(12, editorFontSize - 2)} title="Decrease font size">-</button>
                <span class="font-size-val">{editorFontSize}px</span>
                <button class="editor-ctrl-btn" onclick={() => editorFontSize = Math.min(18, editorFontSize + 2)} title="Increase font size">+</button>
              </div>
              
              <!-- Wrap toggle -->
              <button 
                class="editor-ctrl-btn wrap-btn" 
                class:active={editorWordWrap} 
                onclick={() => editorWordWrap = !editorWordWrap} 
                title="Toggle line wrapping"
              >
                Wrap
              </button>

              <!-- Notebook Toggle (Item 126) -->
              <button 
                class="editor-ctrl-btn mode-toggle-btn" 
                class:active={workspaceMode === 'notebook'} 
                onclick={() => workspaceMode = workspaceMode === 'editor' ? 'notebook' : 'editor'} 
                title="Toggle Jupyter Notebook mode"
              >
                {workspaceMode === 'editor' ? 'Notebook' : 'Editor'}
              </button>

              <!-- Download code button -->
              <button 
                class="editor-ctrl-btn download-code-btn" 
                onclick={downloadActiveCode} 
                title="Download code as script file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span style="vertical-align: middle;">Download</span>
              </button>

              <!-- Export DB button (SQL Sandbox only) -->
              {#if activeLang === 'sql' && isSandboxMode}
                <button 
                  class="editor-ctrl-btn export-db-btn" 
                  onclick={downloadSqliteDb} 
                  title="Export SQLite database as binary .sqlite file"
                >
                  <Database size={11} style="margin-right: 3px; vertical-align: middle;" />
                  <span style="vertical-align: middle;">Export DB</span>
                </button>
              {/if}
            </div>
          </div>
          
          <div class="editor-container-wrap">
            {#if workspaceMode === 'editor'}
              <Editor 
                bind:value={code} 
                language={activeLang} 
                onChange={handleCodeChange}
                fontSize={editorFontSize}
                wordWrap={editorWordWrap}
              />
            {:else}
              <Notebook 
                challengeId={currentChallenge.id} 
                language={activeLang} 
                starterCode={currentChallenge.starterCode}
                bind:insertedSnippet={notebookInsertedSnippet}
                onNotebookCodeChange={applyFormattedCode}
              />
            {/if}
          </div>
        </section>

        <!-- Panel 3: Terminal Console and DB Schema tabbed -->
        {#if isRightPanelCollapsed}
          <section class="workspace-panel panel-right collapsed">
            <button class="panel-toggle-btn expand-btn" onclick={() => isRightPanelCollapsed = false} title="Expand Console">
              <ChevronLeft size={16} />
            </button>
          </section>
        {:else}
          <section class="workspace-panel panel-right">
            <div class="panel-right-tabs">
              <button 
                class="right-tab" 
                class:active={activeTabRight === 'console'}
                onclick={() => activeTabRight = 'console'}
              >
                <Terminal size={14} />
                <span>Console</span>
              </button>

              {#if activeLang === 'sql'}
                <button 
                  class="right-tab" 
                  class:active={activeTabRight === 'schema'}
                  onclick={() => activeTabRight = 'schema'}
                >
                  <Database size={14} />
                  <span>Database Schema</span>
                </button>
              {/if}

              <!-- Collapse trigger at far right of tabs -->
              <button class="panel-toggle-btn right-collapse-btn" onclick={() => isRightPanelCollapsed = true} title="Collapse Console">
                <ChevronRight size={14} />
              </button>
            </div>

            <div class="panel-right-content">
              {#if activeTabRight === 'console'}
                <Console 
                  type={activeLang}
                  stdout={pyResult.stdout}
                  error={activeLang === 'python' ? pyResult.error : sqlResult.error}
                  checksPassed={activeLang === 'python' ? pyResult.checksPassed : sqlResult.checksPassed}
                  checksResults={activeLang === 'python' ? pyResult.checksResults : sqlResult.checksResults}
                  queryResult={sqlResult.result}
                  dbState={sqlResult.dbState}
                  hasRun={hasRun}
                  isRunning={isRunning}
                  executionTime={activeLang === 'python' ? pyResult.executionTime : sqlResult.executionTime}
                  onExecuteQuery={runQueryDirectly}
                  rawQuery={activeLang === 'python' ? pyResult.executedCode : sqlResult.executedCode}
                  executedCode={activeLang === 'python' ? pyResult.executedCode : sqlResult.executedCode}
                />
              {:else}
                <SchemaBrowser schema={sqlResult.schema || {}} dbState={sqlResult.dbState || {}} />
              {/if}
            </div>
          </section>
        {/if}
      </div>
    </main>
  {/if}
</div>

<!-- Level Up Ascend Modal (Item 55) -->
{#if showLevelUpModal}
  <div class="level-modal-overlay">
    <div class="level-modal-card">
      <div class="cyber-bracket left"></div>
      <div class="cyber-bracket right"></div>
      
      <div class="level-glow-circle">
        <Trophy size={48} class="level-modal-icon" />
        <span class="level-num">{levelUpVal}</span>
      </div>
      
      <h2 class="level-title">LEVEL ASCENDED!</h2>
      <p class="level-subtitle">You have achieved Mastery Level {levelUpVal}</p>
      <p class="level-desc">Keep code flowing. The binary gates await your command.</p>
      
      <button class="level-close-btn" onclick={() => showLevelUpModal = false}>
        CONTINUE TRAINING
      </button>
    </div>
  </div>
{/if}

<!-- Badge Unlock Notification Toast (Item 85) -->
{#if activeBadgeUnlock}
  <div class="badge-toast-container">
    <div class="badge-toast" style="border-color: {activeBadgeUnlock.color}; box-shadow: 0 0 15px {activeBadgeUnlock.color}25;">
      <div class="badge-toast-glow" style="background: {activeBadgeUnlock.color}10;"></div>
      <div class="badge-toast-icon-wrap" style="color: {activeBadgeUnlock.color}; border-color: {activeBadgeUnlock.color}40;">
        {#if activeBadgeUnlock.id === 'first-blood' || activeBadgeUnlock.id === 'level-5-mastery'}
          <Trophy size={20} />
        {:else if activeBadgeUnlock.id === 'pythonista'}
          <Code size={20} />
        {:else if activeBadgeUnlock.id === 'sql-maestro'}
          <Database size={20} />
        {:else if activeBadgeUnlock.id === 'ml-pioneer'}
          <Star size={20} />
        {:else if activeBadgeUnlock.id === 'svm-champion'}
          <Shield size={20} />
        {:else}
          <Flame size={20} />
        {/if}
      </div>
      <div class="badge-toast-content">
        <span class="badge-toast-tag" style="color: {activeBadgeUnlock.color};">ACHIEVEMENT UNLOCKED!</span>
        <h3 class="badge-toast-title">{activeBadgeUnlock.name}</h3>
        <p class="badge-toast-desc">{activeBadgeUnlock.desc}</p>
      </div>
    </div>
  </div>
{/if}

<!-- System Toast Message (Item 86) -->
{#if systemToast}
  <div class="system-toast {systemToast.type}">
    <span class="toast-icon">
      {#if systemToast.type === 'success'}🎯
      {:else if systemToast.type === 'error'}❌
      {:else}ℹ️
      {/if}
    </span>
    <span class="toast-message">{systemToast.message}</span>
  </div>
{/if}

<!-- Floating AI Mentor button (Item 166) -->
<button 
  class="floating-mentor-btn" 
  onclick={() => showMentorDrawer = !showMentorDrawer} 
  title="Ask AI Mentor for assistance"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
</button>

{#if showMentorDrawer}
  <div class="mentor-drawer-overlay">
    <div class="mentor-drawer-card">
      <div class="drawer-header">
        <span>AI Dojo Mentor</span>
        <button class="close-drawer-btn" onclick={() => showMentorDrawer = false}>✕</button>
      </div>
      <div class="drawer-body-wrap">
        <MentorBot 
          challengeId={currentChallenge.id}
          language={activeLang}
          currentCode={code}
          lastError={activeLang === 'python' ? pyResult.error : sqlResult.error}
          onApplyFormattedCode={applyFormattedCode}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .dojo-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-canvas);
    color: var(--color-ink);
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
  }

  /* Confetti Animation */
  .confetti-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 999;
    overflow: hidden;
  }

  .confetti-particle {
    position: absolute;
    width: 8px;
    height: 14px;
    background: var(--color);
    top: -20px;
    left: var(--x);
    opacity: 0.85;
    border-radius: 2px;
    transform: rotate(var(--rotation));
    animation: fall 2.5s linear var(--delay) forwards;
  }

  @keyframes fall {
    0% {
      top: -20px;
      transform: translateX(0) rotate(var(--rotation));
      opacity: 1;
    }
    100% {
      top: 105vh;
      transform: translateX(var(--drift)) rotate(calc(var(--rotation) + 360deg));
      opacity: 0;
    }
  }

  /* Playground View layout */
  .playground-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .play-action-bar {
    background: var(--color-header-bg);
    border-bottom: 1px solid var(--color-hairline);
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    flex-shrink: 0;
  }

  .back-btn {
    background: transparent;
    border: none;
    color: var(--color-muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: var(--color-ink);
  }

  .challenge-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .diff-badge {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
  }

  .diff-badge.easy { background: var(--color-success-bg); color: var(--color-success); }
  .diff-badge.medium { background: var(--color-warning-bg); color: var(--color-warning); }
  .diff-badge.hard { background: var(--color-error-bg); color: var(--color-error); }
  .diff-badge.sandbox { background: rgba(139, 92, 246, 0.08); color: #c084fc; }

  .topic-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .challenge-head {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-ink);
    margin: 0;
  }

  .run-actions {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    height: 36px;
    padding: 0 16px;
    border-radius: var(--radius-xs);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .secondary-act {
    background: transparent;
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
  }

  .secondary-act:hover {
    color: var(--color-ink);
    border-color: var(--color-card-border);
    background: var(--color-tab-inactive);
  }

  .primary-act {
    background: var(--color-primary);
    border: 1px solid var(--color-primary);
    color: var(--color-canvas);
    box-shadow: 0 4px 12px var(--color-accent-glow);
  }

  .primary-act:hover {
    opacity: 0.9;
    box-shadow: 0 4px 16px var(--color-accent-glow);
  }

  .primary-act:disabled {
    background: var(--color-tab-inactive);
    border-color: var(--color-hairline);
    color: var(--color-muted);
    cursor: not-allowed;
    box-shadow: none;
  }

  .loader-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-muted);
    border-top: 2px solid var(--color-ink);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Workspace Panels split */
  .workspace-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 320px 1fr 1fr;
    overflow: hidden;
    background: var(--color-canvas);
  }

  .workspace-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-left {
    border-right: 1px solid var(--color-hairline);
    background: var(--color-panel-left-bg);
  }

  .panel-center {
    border-right: 1px solid var(--color-hairline);
    padding: 16px;
  }

  .panel-right {
    background: var(--color-canvas);
    display: flex;
    flex-direction: column;
  }

  .panel-right-tabs {
    display: flex;
    height: 42px;
    border-bottom: 1px solid var(--color-hairline);
    background: var(--color-header-bg);
  }

  .right-tab {
    flex: 1;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-muted);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .right-tab:hover {
    color: var(--color-ink);
  }

  .right-tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    background: var(--color-accent-glow);
  }

  .panel-right-content {
    flex: 1;
    overflow: hidden;
    padding: 16px;
  }

  .padding-box {
    padding: 24px;
    overflow-y: auto;
    height: 100%;
  }

  .subhead {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 12px 0;
  }

  .prompt-text p {
    font-size: 15px;
    line-height: 1.6;
    color: var(--color-ink);
    margin: 0 0 24px 0;
  }

  /* Accordion boxes */
  .expansion-block {
    background: var(--color-editor-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
    overflow: hidden;
  }

  .expansion-header {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--color-muted);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .expansion-header:hover {
    color: var(--color-ink);
    background: var(--color-tab-inactive);
  }

  .header-icon {
    margin-right: 8px;
    color: var(--color-primary);
  }

  .caret {
    font-size: 9px;
    transition: transform 0.2s;
  }

  .caret.open {
    transform: rotate(180deg);
  }

  .expansion-content {
    padding: 12px 16px;
    border-top: 1px solid var(--color-card-border);
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-muted);
    background: var(--color-editor-bg);
  }

  .solution-block {
    border-color: var(--color-success-border);
  }

  .solution-content {
    padding: 0;
    background: var(--color-editor-bg);
  }

  .solution-code {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-success);
  }

  /* Collapsible panels and sidebar style overrides */
  .workspace-panel.collapsed {
    background: var(--color-card-bg);
    border-right: 1px solid var(--color-hairline);
    border-left: 1px solid var(--color-hairline);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 12px 0;
  }

  .panel-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--color-tab-inactive);
    border-bottom: 1px solid var(--color-hairline);
    width: 100%;
  }

  .panel-header-row.left-tabs-header {
    padding: 0 10px 0 16px;
    height: 42px;
  }

  /* Left Panel Tabs Navigation */
  .left-panel-tabs {
    display: flex;
    align-items: stretch;
    height: 100%;
    gap: 16px;
  }

  .left-tab-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-muted);
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 4px;
    height: 42px;
    transition: all 0.2s;
  }

  .left-tab-btn:hover {
    color: var(--color-ink);
  }

  .left-tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  /* Scrollable Left content */
  .scrollable-left-content {
    flex: 1;
    overflow-y: auto;
  }

  /* Concept Breakdown View */
  .concept-breakdown-wrapper {
    display: flex;
    flex-direction: column;
    color: var(--color-ink);
  }

  .concept-header-pill {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    background: var(--color-accent-glow);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
    margin-bottom: 12px;
    letter-spacing: 0.05em;
  }

  .concept-title {
    font-size: 14px;
    font-weight: 800;
    margin: 0 0 8px 0;
    color: var(--color-ink);
  }

  .concept-desc {
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-muted);
    margin: 0 0 16px 0;
  }

  .concept-diagram-container,
  .concept-keypoints-box,
  .concept-example-box {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 12px;
    margin-bottom: 14px;
  }

  .diagram-header-tag,
  .keypoints-header-tag,
  .example-header-tag {
    font-family: var(--font-body);
    font-size: 9px;
    font-weight: 800;
    color: var(--color-muted);
    letter-spacing: 0.08em;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--color-hairline);
    padding-bottom: 4px;
  }

  .concept-diagram {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.4;
    color: var(--color-ink);
    overflow-x: auto;
    white-space: pre;
    background: var(--color-canvas);
    padding: 8px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--color-hairline);
  }

  .concept-keypoints {
    margin: 0;
    padding-left: 16px;
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--color-muted);
  }

  .concept-keypoints li {
    margin-bottom: 6px;
  }

  .concept-keypoints li::marker {
    color: var(--color-primary);
  }

  .concept-example-code {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-success);
    background: var(--color-canvas);
    padding: 8px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--color-hairline);
    overflow-x: auto;
  }

  .concept-use-btn {
    margin-top: 10px;
    background: var(--color-accent-glow);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-family: var(--font-body);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 12px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.2s;
  }

  .concept-use-btn:hover {
    background: var(--color-primary);
    color: var(--color-canvas);
  }

  /* Snippets tab compact grid styles */
  .snippets-grid-tab {
    display: flex;
    flex-direction: column;
  }

  .snippets-grid-compact {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .panel-toggle-btn {
    background: transparent;
    border: 1px solid transparent;
    color: var(--color-muted);
    width: 24px;
    height: 24px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .panel-toggle-btn:hover {
    background: var(--color-tab-inactive);
    color: var(--color-ink);
    border-color: var(--color-hairline);
  }

  .panel-toggle-btn.expand-btn {
    width: 32px;
    height: 32px;
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    color: var(--color-primary);
    border-radius: var(--radius-sm);
    box-shadow: 0 0 10px var(--color-accent-glow);
  }

  .panel-toggle-btn.expand-btn:hover {
    background: var(--color-primary);
    color: var(--color-canvas);
    box-shadow: 0 0 15px var(--color-accent-glow);
  }

  .right-collapse-btn {
    margin-left: auto;
    margin-right: 8px;
  }

  /* Editor Header bar and scaling styles */
  .editor-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 16px;
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-bottom: none;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  }

  .editor-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .editor-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .font-controls {
    display: flex;
    align-items: center;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 2px;
  }

  .editor-ctrl-btn {
    background: transparent;
    border: none;
    color: var(--color-ink);
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    transition: all 0.2s;
  }

  .editor-ctrl-btn:hover {
    background: var(--color-tab-inactive);
    color: var(--color-ink);
  }

  .font-size-val {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-muted);
    padding: 0 6px;
    min-width: 32px;
    text-align: center;
  }

  .editor-ctrl-btn.wrap-btn,
  .editor-ctrl-btn.mode-toggle-btn,
  .editor-ctrl-btn.download-code-btn,
  .editor-ctrl-btn.export-db-btn {
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
    padding: 4px 10px;
    width: auto;
    height: auto;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-radius: var(--radius-xs);
  }

  .editor-ctrl-btn.wrap-btn.active {
    border-color: var(--color-success-border);
    background: var(--color-success-bg);
    color: var(--color-primary);
  }

  .editor-ctrl-btn.mode-toggle-btn {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: transparent;
  }

  .editor-ctrl-btn.mode-toggle-btn.active {
    background: var(--color-accent-glow);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .editor-ctrl-btn.download-code-btn,
  .editor-ctrl-btn.export-db-btn {
    color: var(--color-muted);
  }

  .editor-ctrl-btn.download-code-btn:hover,
  .editor-ctrl-btn.export-db-btn:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: var(--color-accent-glow);
  }

  .editor-container-wrap {
    flex: 1;
    overflow: hidden;
  }

  /* Sandbox badge glow tags */
  .sandbox-glow-badge {
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid #8b5cf6;
    color: #c084fc;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
    text-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  /* Sandbox UI Sidebar Controls */
  .sandbox-textarea {
    width: 100%;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    color: var(--color-success-text);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 8px;
    resize: vertical;
    margin-top: 6px;
    outline: none;
    box-sizing: border-box;
  }
  .sandbox-textarea:focus {
    border-color: var(--color-primary);
  }
  .DDL-textarea {
    height: 90px;
    color: #c084fc;
  }
  .csv-textarea {
    height: 80px;
    color: #3b82f6;
  }
  .sandbox-input {
    width: 100%;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    color: var(--color-ink);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 6px 8px;
    outline: none;
    box-sizing: border-box;
  }
  .sandbox-input:focus {
    border-color: var(--color-primary);
  }
  .sandbox-btn {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.2s;
  }
  .sandbox-btn.primary {
    background: var(--color-primary);
    border: 1px solid var(--color-primary);
    color: var(--color-canvas);
  }
  .sandbox-btn.primary:hover {
    opacity: 0.9;
  }
  .sandbox-btn.secondary {
    background: transparent;
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
  }
  .sandbox-btn.secondary:hover {
    color: var(--color-ink);
    border-color: var(--color-card-border);
  }

  /* History list styles */
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
  }
  .history-item {
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--radius-xs);
    padding: 8px;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    width: 100%;
    box-sizing: border-box;
  }
  .history-item:hover {
    border-color: var(--color-primary);
    background: var(--color-accent-glow);
  }
  .history-num {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--color-primary);
  }
  .history-code-preview {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  /* Level Up Modal Styles */
  .level-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(4, 4, 6, 0.9);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.4s ease-out;
  }

  .level-modal-card {
    background: #0d0d12;
    border: 1px solid #eab308;
    border-radius: var(--radius-lg);
    width: 420px;
    padding: 40px;
    text-align: center;
    position: relative;
    box-shadow: 0 0 40px rgba(234, 179, 8, 0.25);
    animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .cyber-bracket {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid #eab308;
  }
  .cyber-bracket.left {
    top: 15px;
    left: 15px;
    border-right: none;
    border-bottom: none;
  }
  .cyber-bracket.right {
    bottom: 15px;
    right: 15px;
    border-left: none;
    border-top: none;
  }

  .level-glow-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(234, 179, 8, 0.05);
    border: 2px dashed #eab308;
    margin: 0 auto 24px auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 20px rgba(234, 179, 8, 0.15);
  }

  :global(.level-modal-icon) {
    color: #eab308;
    margin-bottom: 2px;
  }

  .level-num {
    font-family: var(--font-mono);
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
  }

  .level-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 800;
    color: #eab308;
    margin: 0 0 8px 0;
    letter-spacing: 0.15em;
    text-shadow: 0 0 10px rgba(234, 179, 8, 0.4);
  }

  .level-subtitle {
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 12px 0;
  }

  .level-desc {
    font-size: 13px;
    color: #64748b;
    margin: 0 0 32px 0;
    line-height: 1.5;
  }

  .level-close-btn {
    width: 100%;
    height: 46px;
    background: #eab308;
    border: none;
    border-radius: var(--radius-xs);
    color: #000000;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(234, 179, 8, 0.2);
  }

  .level-close-btn:hover {
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
  }

  /* Badge Toast Notification */
  .badge-toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1100;
    animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .badge-toast {
    background: #0d0d12;
    border: 1px solid #10b981;
    border-radius: var(--radius-md);
    width: 320px;
    padding: 16px;
    display: flex;
    gap: 16px;
    position: relative;
    overflow: hidden;
  }

  .badge-toast-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .badge-toast-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(16, 185, 129, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 2;
    background: rgba(0, 0, 0, 0.2);
  }

  .badge-toast-content {
    display: flex;
    flex-direction: column;
    z-index: 2;
  }

  .badge-toast-tag {
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin-bottom: 2px;
  }

  .badge-toast-title {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 4px 0;
  }

  .badge-toast-desc {
    font-size: 11px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
  }

  /* Markdown specific styling overrides */
  :global(.md-inline-code) {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: rgba(16, 185, 129, 0.08);
    color: #10b981;
    padding: 2px 5px;
    border-radius: 3px;
    border: 1px solid rgba(16, 185, 129, 0.15);
  }
  :global(.md-code-block) {
    font-family: var(--font-mono);
    font-size: 11px;
    background: #08080b;
    border: 1px solid #1a1a24;
    padding: 10px;
    border-radius: var(--radius-sm);
    overflow-x: auto;
  }
  :global(.md-link) {
    color: #3b82f6;
    text-decoration: none;
    border-bottom: 1px dotted #3b82f6;
  }
  :global(.md-link:hover) {
    color: #60a5fa;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleUp {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(120%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Cheat Sheet / Snippets Styles */
  .snippets-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 4px;
  }

  .snippet-item {
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .snippet-item:hover {
    border-color: var(--color-primary);
    background: var(--color-accent-glow);
    transform: translateY(-1px);
  }

  .snippet-item code {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-primary);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 100%;
    text-align: left;
  }

  .snippet-item span {
    font-size: 10px;
    color: var(--color-muted);
    font-weight: 500;
  }

  .snippet-item.premium {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(139, 92, 246, 0.02);
  }

  .snippet-item.premium:hover {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.08);
  }

  .snippet-locked-banner {
    grid-column: 1 / -1;
    background: #101015;
    border: 1px dashed #232334;
    border-radius: var(--radius-xs);
    padding: 14px;
    font-size: 11px;
    color: var(--color-muted);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .snippet-locked-banner:hover {
    border-color: #8b5cf6;
    color: #a855f7;
    background: rgba(139, 92, 246, 0.04);
  }

  @media (max-width: 320px) {
    .snippets-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Floating AI Mentor Button & Drawer (Item 166) */
  .floating-mentor-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--color-primary);
    border: none;
    color: var(--color-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 15px var(--color-accent-glow);
    z-index: 999;
    transition: all 0.2s ease-in-out;
  }

  .floating-mentor-btn:hover {
    transform: scale(1.1) rotate(5deg);
  }

  .mentor-drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
  }

  .mentor-drawer-card {
    width: 380px;
    height: 100%;
    background: var(--color-card-bg);
    border-left: 1px solid var(--color-hairline);
    display: flex;
    flex-direction: column;
    box-shadow: -5px 0 25px rgba(0,0,0,0.3);
    animation: slide-in 0.25s ease-out forwards;
  }

  @keyframes slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .drawer-header {
    background: var(--color-tab-inactive);
    border-bottom: 1px solid var(--color-hairline);
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
  }

  .close-drawer-btn {
    background: transparent;
    border: none;
    color: var(--color-muted);
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s;
  }

  .close-drawer-btn:hover {
    color: var(--color-ink);
  }

  .drawer-body-wrap {
    flex: 1;
    overflow: hidden;
  }

  /* Steps Breakdown View CSS */
  .steps-breakdown-wrapper {
    display: flex;
    flex-direction: column;
    color: var(--color-ink);
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }

  .step-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 12px;
    transition: all 0.25s ease;
  }

  .step-card.completed {
    border-color: rgba(16, 185, 129, 0.35);
    background: rgba(16, 185, 129, 0.02);
  }

  .step-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .step-card-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-ink);
  }

  .step-status-badge {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
  }

  .step-status-badge.completed {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  .step-card-desc {
    font-size: 11px;
    line-height: 1.45;
    color: var(--color-muted);
    margin: 0 0 8px 0;
  }

  .step-code-box {
    margin-top: 8px;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .step-code {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--color-primary);
    overflow-x: auto;
  }

  .step-use-btn {
    align-self: flex-end;
    background: var(--color-accent-glow);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-family: var(--font-body);
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 3px 8px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.2s;
  }

  .step-use-btn:hover {
    background: var(--color-primary);
    color: var(--color-canvas);
  }

  /* Concept Check Quiz CSS */
  .concept-quiz-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 14px;
    margin-top: 14px;
    margin-bottom: 20px;
    transition: border-color 0.3s, box-shadow 0.3s;
  }

  .concept-quiz-card.completed {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.05);
  }

  .quiz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--color-hairline);
    padding-bottom: 6px;
  }

  .quiz-title-tag {
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 800;
    color: var(--color-muted);
    letter-spacing: 0.08em;
  }

  .quiz-badge {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .quiz-badge.reward {
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .quiz-badge.success {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .quiz-question {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;
    color: var(--color-ink);
    margin: 0 0 14px 0;
  }

  .quiz-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .quiz-option-btn {
    display: flex;
    align-items: center;
    text-align: left;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 10px 12px;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 11.5px;
    color: var(--color-ink);
    transition: all 0.2s;
  }

  .quiz-option-btn:hover:not(:disabled) {
    background: var(--color-tab-inactive);
    border-color: var(--color-primary);
  }

  .quiz-option-btn.selected {
    border-color: var(--color-primary);
    background: var(--color-accent-glow);
  }

  .quiz-option-btn.correct {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10b981;
    color: #10b981;
  }

  .quiz-option-btn.wrong {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }

  .quiz-option-btn:disabled {
    cursor: not-allowed;
  }

  .option-letter {
    font-family: var(--font-mono);
    font-weight: 800;
    font-size: 10px;
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    flex-shrink: 0;
  }

  .quiz-option-btn.correct .option-letter {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .quiz-option-btn.wrong .option-letter {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .quiz-explanation-box {
    margin-top: 14px;
    padding: 12px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--color-hairline);
    background: var(--color-canvas);
  }

  .quiz-explanation-box.correct {
    border-left: 3px solid #10b981;
  }

  .quiz-explanation-box:not(.correct) {
    border-left: 3px solid #ef4444;
  }

  .explanation-status {
    font-size: 11px;
    font-weight: 800;
    margin: 0 0 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .quiz-explanation-box.correct .explanation-status {
    color: #10b981;
  }

  .quiz-explanation-box:not(.correct) .explanation-status {
    color: #ef4444;
  }

  .explanation-text {
    font-size: 11px;
    line-height: 1.45;
    color: var(--color-muted);
    margin: 0;
  }

  /* System Toast Notification Styles */
  .system-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    border-radius: var(--radius-sm);
    background: rgba(16, 16, 20, 0.95);
    border: 1px solid var(--color-hairline);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    color: #fff;
    font-family: var(--font-body);
    font-size: 12.5px;
    font-weight: 600;
    animation: toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .system-toast.success {
    border-left: 4px solid #10b981;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
  }

  .system-toast.error {
    border-left: 4px solid #ef4444;
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
  }

  .system-toast.info {
    border-left: 4px solid var(--color-primary);
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);
  }

  .toast-icon {
    font-size: 14px;
  }

  .toast-message {
    color: #ffffff;
  }

  @keyframes toast-slide-in {
    from {
      transform: translateY(100px) scale(0.9);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
</style>
