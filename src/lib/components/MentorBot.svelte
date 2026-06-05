<script>
  import { onMount } from 'svelte';
  import { Send, Bot, RefreshCw, MessageSquare, ShieldAlert, Sparkles, Smile, Code } from 'lucide-svelte';
  import { parseMarkdown } from '../utils/markdown.js';
  import { inventory } from '../stores/dojo-store.js';

  let { 
    challengeId = 'sandbox',
    language = 'python',
    currentCode = '',
    lastError = '',
    onApplyFormattedCode = null // callback to replace code in editor
  } = $props();

  // State
  let chatHistory = $state([]);
  let userQuery = $state('');
  let isTyping = $state(false);
  let activePersona = $state('sensei'); // 'sensei' | 'hacker' | 'techlead' | 'wizard'

  // Persona definitions
  const personas = {
    sensei: { name: 'Sensei Gemini', title: 'Dojo Grandmaster', avatar: '🥋', greeting: 'Greetings, student. Let us examine your algorithm and polish your craft.' },
    hacker: { name: 'Cyber Hacker', title: 'System Intruder', avatar: '💻', greeting: 'Yo. Ready to exploit the database and inject some hyper-efficient scripts?' },
    techlead: { name: 'Tech Lead', title: 'Staff Engineer', avatar: '👔', greeting: 'Let us run a code review. Keep it production-ready and scale-invariant.' },
    wizard: { name: 'SQL Wizard', title: 'Database Sorcerer', avatar: '🧙‍♂️', greeting: 'Ah! Speak the magic incantations. Together we shall conjure query execution plans that bend the database engine to our will.' }
  };

  // Preloaded mock responses based on challenge context & queries
  const mockResponses = {
    error: {
      python: "Looks like a syntax or variable scoping issue. Verify that your indentation matches Svelte/Python bounds, and ensure all imported modules are correctly referenced.",
      sql: "Check your query structures. Ensure columns specified exist on the selected tables and that table joins align correctly with primary/foreign keys."
    },
    optimize: {
      python: "To optimize this Python code, consider using list comprehensions or vectorized NumPy/Pandas operations instead of nested loops. Vectorized code runs in C compiled speeds inside Pyodide.",
      sql: "For SQL performance, try using explicit INNER JOINs instead of cross joins, select only necessary columns instead of SELECT *, and verify where clauses utilize indexed columns."
    },
    general: {
      python: "Remember that Python is dynamically typed but strongly scoped. Keep functions focused and leverage libraries like numpy, pandas, and scikit-learn to write clean code.",
      sql: "In SQLite, window functions like ROW_NUMBER, LAG, and LEAD allow analyzing rows in partition frames. They are much faster than correlated subqueries."
    }
  };

  onMount(() => {
    // Load chat history from localStorage if exists
    const key = `dojo_chat_${challengeId}_${language}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        chatHistory = JSON.parse(saved);
        return;
      } catch (e) {}
    }
    
    // Initialize greeting
    chatHistory = [{
      sender: 'bot',
      text: personas[activePersona].greeting,
      time: new Date().toLocaleTimeString()
    }];
  });

  // Save history on changes
  $effect(() => {
    if (chatHistory.length > 0) {
      const key = `dojo_chat_${challengeId}_${language}`;
      localStorage.setItem(key, JSON.stringify(chatHistory));
    }
  });

  // Handle persona swap and reset greeting
  function handlePersonaChange(newPers) {
    activePersona = newPers;
    chatHistory = [{
      sender: 'bot',
      text: personas[newPers].greeting,
      time: new Date().toLocaleTimeString()
    }];
  }

  // Typewriter effect simulator
  function simulateTypingResponse(responseHtml) {
    isTyping = true;
    setTimeout(() => {
      chatHistory.push({
        sender: 'bot',
        text: responseHtml,
        time: new Date().toLocaleTimeString()
      });
      isTyping = false;
    }, 1200);
  }

  // Submit query
  function submitChat() {
    if (!userQuery.trim()) return;
    const userText = userQuery;
    chatHistory.push({
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString()
    });
    userQuery = '';

    // Generate response
    generateBotResponse(userText);
  }

  // Preset button actions
  function askPreset(type) {
    let questionText = "";
    if (type === 'explain-error') {
      questionText = lastError 
        ? `Can you explain this error for me?\n\`\`\`\n${lastError}\n\`\`\``
        : "I have some errors. Can you review my code and point out the issue?";
    } else if (type === 'optimize') {
      questionText = "How can I optimize this algorithm or query to run faster?";
    } else if (type === 'explain-concept') {
      questionText = language === 'python' 
        ? "Explain map/lambdas and list comprehensions in Python." 
        : "Explain how Window Functions (LAG, LEAD, ROW_NUMBER) work in SQL.";
    }

    chatHistory.push({
      sender: 'user',
      text: questionText,
      time: new Date().toLocaleTimeString()
    });

    generateBotResponse(type);
  }

  function generateBotResponse(inputQuery) {
    let answer = "";
    const lowerQ = typeof inputQuery === 'string' ? inputQuery.toLowerCase() : "";

    if (activePersona === 'wizard') {
      if (inputQuery === 'explain-error') {
        answer = lastError 
          ? `🔮 **Wizard's Diagnostic Arcana:**\nThe query incantation has failed with this traceback:\n\`${lastError}\`.\n\n*Sorcerer's Suggestions:*\n1. Check for typos in table or column names.\n2. Ensure column constraints or references align with primary/foreign keys.\n3. Make sure table aliases match in JOIN and SELECT clauses.`
          : `🔮 **Wizard's Diagnostic Arcana:**\nYour incantation runs without syntax errors, but the tests are not satisfied. Ensure you have targeted all requirements!`;
      } else if (inputQuery === 'optimize') {
        answer = `🔮 **Wizard's Optimization Arcana:**\nTo optimize database performance, examine the \`EXPLAIN QUERY PLAN\` tree. Focus on avoiding \`SCAN TABLE\` (O(N) search) by introducing composite or single-column indexes on joining keys. Use \`USING INDEX\` or \`USING COVERING INDEX\` to unlock immediate speed boosts!`;
      } else if (inputQuery === 'explain-concept') {
        answer = `🔮 **Wizard's Query Whispers:**\nQueries are declarative formulas. The database optimizer builds a lookup plan. When using window functions (\`ROW_NUMBER() OVER\`), SQLite divides records into sub-partitions, sorted in-memory, without costly Cartesian self-joins!`;
      } else if (lowerQ.includes('index') || lowerQ.includes('explain') || lowerQ.includes('slow')) {
        answer = `🔮 **Wizard's Indexing Secrets:**\nIndexes are B-Trees created on table columns. Creating an index speeds up lookups but incurs tiny insert/update overheads. Look for \`SEARCH TABLE USING INDEX\` in the explain visualizer to verify index engagement!`;
      } else {
        answer = `🔮 **Wizard's Counsel:**\nAh! The database spirits whisper. Let us craft query incantations. Write standard JOINs and keep where conditions targeted on indexed fields. What query plan shall we conjour?`;
      }
    } else {
      if (inputQuery === 'explain-error') {
        answer = lastError 
          ? `**Diagnostic Analysis:**\nYour program failed with the following traceback:\n\`${lastError}\`.\n\n*Suggestions:*\n1. Verify column or variable spelling.\n2. In Python, ensure correct indentation blocks.\n3. In SQL, check if you're aliasing joined tables correctly.`
          : `Your code looks syntactically sound, but verify logic requirements. Check if you completed all requirements list points on the left panel!`;
      } else if (inputQuery === 'optimize') {
        answer = mockResponses.optimize[language];
      } else if (inputQuery === 'explain-concept') {
        answer = mockResponses.general[language];
      } else {
        // General NLP matcher
        if (lowerQ.includes('error') || lowerQ.includes('fail') || lowerQ.includes('bug')) {
          answer = "Let's review the syntax error. Make sure brackets match and commas exist. If there's an assertion failing, compare expected vs actual panes.";
        } else if (lowerQ.includes('join') || lowerQ.includes('table')) {
          answer = "In SQL, JOINs link tables. Remember: `INNER JOIN` returns matching rows, while `LEFT JOIN` preserves all rows from the left table, inserting `NULL` for missing rights.";
        } else if (lowerQ.includes('pandas') || lowerQ.includes('dataframe')) {
          answer = "For Pandas, remember df.groupby() creates index objects. You can chain `.mean()` or `.agg()` to perform aggregate operations on columns.";
        } else {
          answer = `I hear you. As your ${personas[activePersona].title}, my advice is to review the exercise prompts, isolate variables, and execute one check at a time.`;
        }
      }
    }

    simulateTypingResponse(answer);
  }

  // Client side formatter & beautifier (Item 170)
  function formatActiveCode() {
    if (!currentCode || !onApplyFormattedCode) return;
    let formatted = currentCode;

    if (language === 'sql') {
      // Simple regex keyword uppercase formatter
      const keywords = [
        'select', 'from', 'where', 'join', 'inner', 'left', 'on', 'group by', 
        'having', 'order by', 'limit', 'as', 'and', 'or', 'insert', 'into', 
        'values', 'delete', 'update', 'set', 'with', 'intersect', 'except', 'union'
      ];
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formatted = formatted.replace(regex, keyword.toUpperCase());
      });
      // Add standard newlines after select list, from, where for style
      formatted = formatted.trim();
      if (!formatted.endsWith(';')) formatted += ';';
    } else {
      // Python formatter - clean tabs and excessive empty lines
      const lines = formatted.split('\n');
      const cleanedLines = lines.map(line => line.trimEnd());
      formatted = cleanedLines.join('\n');
    }

    onApplyFormattedCode(formatted);
    alert("Code successfully formatted!");
  }

  // Offline lint checks (Item 171)
  let lintErrors = $derived.by(() => {
    const errors = [];
    if (!currentCode.trim()) return errors;

    if (language === 'sql') {
      const openParens = (currentCode.match(/\(/g) || []).length;
      const closeParens = (currentCode.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({ type: 'error', text: `Parentheses mismatch: Found ${openParens} '(' and ${closeParens} ')'.` });
      }
      if (currentCode.toLowerCase().includes('join') && !currentCode.toLowerCase().includes('on')) {
        errors.push({ type: 'warning', text: 'JOIN clause found without a matching ON constraint. This can cause slow cross-joins.' });
      }
    } else {
      // Python specific lints
      const lines = currentCode.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('def ') && !line.trim().endsWith(':')) {
          errors.push({ type: 'error', text: `Line ${idx + 1}: Function declaration is missing a ending colon ':'` });
        }
        if (line.includes('for ') && !line.trim().endsWith(':') && line.includes(' in ')) {
          errors.push({ type: 'error', text: `Line ${idx + 1}: Loop statement is missing a ending colon ':'` });
        }
      });
    }

    return errors;
  });
</script>

<div class="mentor-bot-container">
  <!-- Top bar configuration -->
  <div class="mentor-header">
    <div class="persona-selector">
      <Bot size={14} class="bot-icon-color" />
      <span class="header-label">Advisor:</span>
      <select 
        value={activePersona} 
        onchange={(e) => handlePersonaChange(e.target.value)}
        class="persona-select"
      >
        <option value="sensei">Sensei Gemini</option>
        <option value="hacker">Cyber Hacker</option>
        <option value="techlead">Tech Lead</option>
        {#if $inventory.unlockedPersonas?.includes('wizard')}
          <option value="wizard">🧙‍♂️ SQL Wizard</option>
        {:else}
          <option value="wizard_locked" disabled>🧙‍♂️ SQL Wizard (Lock: 450 XP)</option>
        {/if}
      </select>
    </div>

    <div class="code-actions">
      <button class="mentor-tool-btn" onclick={formatActiveCode} title="Format workspace code style">
        <Code size={11} />
        <span>Format Code</span>
      </button>
    </div>
  </div>

  <!-- Inline Linter Warnings (Item 171) -->
  {#if lintErrors.length > 0}
    <div class="linter-overlay-box">
      <div class="lint-header">
        <ShieldAlert size={12} />
        <span>Linter Advisories ({lintErrors.length}):</span>
      </div>
      <div class="lint-list">
        {#each lintErrors as err}
          <div class="lint-item {err.type}">
            • {err.text}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Dialogue thread scroll pane -->
  <div class="chat-thread-pane">
    {#each chatHistory as msg}
      <div class="chat-bubble {msg.sender}">
        <div class="bubble-header">
          <span class="avatar-tag">{msg.sender === 'bot' ? personas[activePersona].avatar : '👨‍💻'}</span>
          <span class="bubble-sender">{msg.sender === 'bot' ? personas[activePersona].name : 'You'}</span>
          <span class="bubble-time">{msg.time}</span>
        </div>
        <div class="bubble-content">
          {@html parseMarkdown(msg.text)}
        </div>
      </div>
    {/each}

    {#if isTyping}
      <div class="chat-bubble bot typing">
        <div class="bubble-header">
          <span class="avatar-tag">{personas[activePersona].avatar}</span>
          <span class="bubble-sender">{personas[activePersona].name}</span>
        </div>
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Presets directory -->
  <div class="presets-row">
    <button class="preset-btn" onclick={() => askPreset('explain-error')} title="Review compilation error trace">
      Explain Error
    </button>
    <button class="preset-btn" onclick={() => askPreset('optimize')} title="Suggest optimization steps">
      Optimize Code
    </button>
    <button class="preset-btn" onclick={() => askPreset('explain-concept')} title="Explain programming concepts">
      Explain Concept
    </button>
  </div>

  <!-- Text input tray -->
  <div class="chat-input-row">
    <input 
      type="text" 
      placeholder="Ask a question about your code..." 
      bind:value={userQuery} 
      onkeydown={(e) => e.key === 'Enter' && submitChat()}
      class="chat-textbox"
    />
    <button class="send-btn" onclick={submitChat} title="Send message">
      <Send size={12} />
    </button>
  </div>
</div>

<style>
  .mentor-bot-container {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--color-ink);
    overflow: hidden;
  }

  .mentor-header {
    background: var(--color-tab-inactive);
    border-bottom: 1px solid var(--color-hairline);
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    flex-shrink: 0;
  }

  .persona-selector {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }

  .bot-icon-color {
    color: var(--color-primary);
  }

  .header-label {
    color: var(--color-muted);
    font-weight: 700;
  }

  .persona-select {
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    font-size: 11px;
    height: 24px;
    border-radius: 4px;
    padding: 0 4px;
    outline: none;
  }

  .mentor-tool-btn {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Linter */
  .linter-overlay-box {
    background: rgba(245, 158, 11, 0.08);
    border-bottom: 1px solid rgba(245, 158, 11, 0.3);
    padding: 8px 12px;
    font-size: 11px;
    flex-shrink: 0;
  }

  .lint-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #f59e0b;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .lint-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .lint-item.error {
    color: var(--color-error);
  }

  .lint-item.warning {
    color: #f59e0b;
  }

  /* Thread */
  .chat-thread-pane {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chat-bubble {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 85%;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
  }

  .chat-bubble.bot {
    align-self: flex-start;
    background: var(--color-tab-inactive);
    border-bottom-left-radius: 0;
  }

  .chat-bubble.user {
    align-self: flex-end;
    background: var(--color-primary);
    color: var(--color-canvas);
    border-bottom-right-radius: 0;
  }

  .bubble-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    opacity: 0.65;
  }

  .bubble-sender {
    font-weight: 700;
  }

  .bubble-content {
    font-size: 12px;
    line-height: 1.4;
  }

  .bubble-content :global(pre) {
    background: rgba(0,0,0,0.15);
    padding: 6px 10px;
    border-radius: 4px;
    font-family: var(--font-mono);
    overflow-x: auto;
    margin: 4px 0;
  }

  .bubble-content :global(p) {
    margin: 0;
  }

  .bubble-content :global(p:not(:last-child)) {
    margin-bottom: 6px;
  }

  /* Typing */
  .typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
    height: 16px;
    padding-top: 4px;
  }

  .typing-indicator span {
    width: 6px;
    height: 6px;
    background: var(--color-muted);
    border-radius: 50%;
    animation: bounce 1s infinite alternate;
  }

  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0% { transform: translateY(0); }
    100% { transform: translateY(-6px); }
  }

  /* Presets */
  .presets-row {
    display: flex;
    gap: 6px;
    padding: 6px 12px;
    background: var(--color-tab-inactive);
    border-top: 1px solid var(--color-hairline);
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .preset-btn {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .preset-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* Input */
  .chat-input-row {
    padding: 8px 12px;
    display: flex;
    gap: 8px;
    border-top: 1px solid var(--color-hairline);
    background: var(--color-card-bg);
    flex-shrink: 0;
  }

  .chat-textbox {
    flex: 1;
    height: 32px;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    color: var(--color-ink);
    padding: 0 10px;
    font-size: 12px;
    outline: none;
  }

  .chat-textbox:focus {
    border-color: var(--color-primary);
  }

  .send-btn {
    width: 32px;
    height: 32px;
    background: var(--color-primary);
    border: none;
    color: var(--color-canvas);
    border-radius: var(--radius-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .send-btn:hover {
    opacity: 0.9;
  }
</style>
