<script>
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Editor from './lib/components/Editor.svelte';
  import Console from './lib/components/Console.svelte';
  import SchemaBrowser from './lib/components/SchemaBrowser.svelte';

  // Import stores
  import { 
    language, 
    pythonChallengeIndex, 
    sqlChallengeIndex, 
    userPythonCode, 
    userSqlCode, 
    completedChallenges, 
    completeChallenge 
  } from './lib/stores/dojo-store.js';

  // Import exercise data
  import { pythonExercises } from './lib/data/python-exercises.js';
  import { sqlDbSeed, sqlExercises } from './lib/data/sql-exercises.js';

  // Import runners
  import { runPythonCode, loadPyodideInstance } from './lib/runners/python-runner.js';
  import { runSqlQuery } from './lib/runners/sql-runner.js';

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
    Terminal 
  } from 'lucide-svelte';

  // State
  let activeView = $state('dashboard'); // 'dashboard' | 'playground'
  let activeLang = $derived($language);

  // Active exercises
  let activePyIdx = $derived($pythonChallengeIndex);
  let activeSqlIdx = $derived($sqlChallengeIndex);

  let activePyChallenge = $derived(pythonExercises[activePyIdx]);
  let activeSqlChallenge = $derived(sqlExercises[activeSqlIdx]);

  let currentChallenge = $derived(activeLang === 'python' ? activePyChallenge : activeSqlChallenge);

  // Bind code inputs to stores
  let code = $state('');

  // Watch for challenge/language updates and update code state
  $effect(() => {
    if (activeLang === 'python') {
      code = $userPythonCode[activePyChallenge.id] || activePyChallenge.starterCode;
    } else {
      code = $userSqlCode[activeSqlChallenge.id] || activeSqlChallenge.starterCode;
    }
  });

  // Runner state
  let isRunning = $state(false);
  let hasRun = $state(false);
  let pyResult = $state({ success: false, stdout: '', error: '', checksPassed: false, checkError: '' });
  let sqlResult = $state({ success: false, result: null, error: '', schema: {}, dbState: {} });

  // UI state
  let showHint = $state(false);
  let showSolution = $state(false);
  let activeTabRight = $state('console'); // 'console' | 'schema'
  let showConfetti = $state(false);

  // Triggered when clicking "Train" from Dashboard
  $effect(() => {
    // If the challenge index changes, switch to playground
    if (activePyIdx !== undefined || activeSqlIdx !== undefined) {
      // Avoid switching immediately on boot
      if (localStorage.getItem('dojo_python_challenge_index') !== null || localStorage.getItem('dojo_sql_challenge_index') !== null) {
        activeView = 'playground';
        showHint = false;
        showSolution = false;
        hasRun = false;
        activeTabRight = activeLang === 'sql' ? 'schema' : 'console';
      }
    }
  });

  // Handle editor updates
  function handleCodeChange(newCode) {
    if (activeLang === 'python') {
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

  // Execute active task
  async function runCode() {
    isRunning = true;
    hasRun = true;

    if (activeLang === 'python') {
      const outcome = await runPythonCode(code, currentChallenge.check, {});
      pyResult = outcome;

      if (outcome.success && outcome.checksPassed) {
        completeChallenge(currentChallenge.id, currentChallenge.difficulty);
        triggerConfetti();
      }
    } else {
      const outcome = await runSqlQuery(sqlDbSeed, code);
      sqlResult = outcome;

      // Evaluate the custom check function
      let isCorrect = false;
      if (outcome.success) {
        try {
          isCorrect = currentChallenge.check(outcome.result);
        } catch (e) {
          isCorrect = false;
        }
      }

      sqlResult.checksPassed = isCorrect;

      if (isCorrect) {
        completeChallenge(currentChallenge.id, currentChallenge.difficulty);
        triggerConfetti();
      }
    }

    isRunning = false;
    activeTabRight = 'console';
  }
</script>

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
      <Dashboard />
    </main>
  {:else}
    <!-- Playground View -->
    <main class="playground-layout">
      <!-- Top Action Bar -->
      <div class="play-action-bar">
        <button class="back-btn" onclick={() => activeView = 'dashboard'}>
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
      <div class="workspace-grid">
        <!-- Panel 1: Prompt details -->
        <section class="workspace-panel panel-left">
          <div class="panel-section padding-box">
            <h2 class="subhead">Instructions</h2>
            <div class="prompt-text">
              <p>{currentChallenge.prompt}</p>
            </div>

            <!-- Hint Section -->
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
                  <p>{currentChallenge.hint}</p>
                </div>
              {/if}
            </div>

            <!-- Solution Section -->
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
          </div>
        </section>

        <!-- Panel 2: Code Editor -->
        <section class="workspace-panel panel-center">
          <Editor 
            bind:value={code} 
            language={activeLang} 
            onChange={handleCodeChange}
          />
        </section>

        <!-- Panel 3: Terminal Console and DB Schema tabbed -->
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
          </div>

          <div class="panel-right-content">
            {#if activeTabRight === 'console'}
              <Console 
                type={activeLang}
                stdout={pyResult.stdout}
                error={activeLang === 'python' ? pyResult.error : sqlResult.error}
                checksPassed={activeLang === 'python' ? pyResult.checksPassed : sqlResult.checksPassed}
                checkError={pyResult.checkError}
                queryResult={sqlResult.result}
                dbState={sqlResult.dbState}
                hasRun={hasRun}
              />
            {:else}
              <SchemaBrowser schema={sqlResult.schema || {}} />
            {/if}
          </div>
        </section>
      </div>
    </main>
  {/if}
</div>

<style>
  .dojo-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #09090c;
    color: #cbd5e1;
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
    background: #0d0d11;
    border-bottom: 1px solid #1a1a24;
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
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: #ffffff;
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

  .diff-badge.easy { background: rgba(16, 185, 129, 0.08); color: #10b981; }
  .diff-badge.medium { background: rgba(234, 179, 8, 0.08); color: #eab308; }
  .diff-badge.hard { background: rgba(239, 68, 68, 0.08); color: #ef4444; }

  .topic-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .challenge-head {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
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
    border: 1px solid #1a1a24;
    color: #94a3b8;
  }

  .secondary-act:hover {
    color: #ffffff;
    border-color: #334155;
    background: #111116;
  }

  .primary-act {
    background: #10b981;
    border: 1px solid #10b981;
    color: #000000;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  }

  .primary-act:hover {
    opacity: 0.9;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
  }

  .primary-act:disabled {
    background: #1e293b;
    border-color: #1e293b;
    color: #475569;
    cursor: not-allowed;
    box-shadow: none;
  }

  .loader-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid #475569;
    border-top: 2px solid #ffffff;
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
    background: #09090c;
  }

  .workspace-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-left {
    border-right: 1px solid #1a1a24;
    background: #0d0d11;
  }

  .panel-center {
    border-right: 1px solid #1a1a24;
    padding: 16px;
  }

  .panel-right {
    background: #09090c;
    display: flex;
    flex-direction: column;
  }

  .panel-right-tabs {
    display: flex;
    height: 42px;
    border-bottom: 1px solid #1a1a24;
    background: #0d0d11;
  }

  .right-tab {
    flex: 1;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #64748b;
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
    color: #ffffff;
  }

  .right-tab.active {
    color: #10b981;
    border-bottom-color: #10b981;
    background: rgba(16, 185, 129, 0.02);
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
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 12px 0;
  }

  .prompt-text p {
    font-size: 15px;
    line-height: 1.6;
    color: #cbd5e1;
    margin: 0 0 24px 0;
  }

  /* Accordion boxes */
  .expansion-block {
    background: #101015;
    border: 1px solid #1c1c27;
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
    overflow: hidden;
  }

  .expansion-header {
    width: 100%;
    background: transparent;
    border: none;
    color: #94a3b8;
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
    color: #ffffff;
    background: #14141d;
  }

  .header-icon {
    margin-right: 8px;
    color: #10b981;
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
    border-top: 1px solid #1c1c27;
    font-size: 13px;
    line-height: 1.5;
    color: #94a3b8;
    background: #08080c;
  }

  .solution-block {
    border-color: rgba(16, 185, 129, 0.15);
  }

  .solution-content {
    padding: 0;
    background: #08080b;
  }

  .solution-code {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: 12px;
    color: #10b981;
  }
</style>
