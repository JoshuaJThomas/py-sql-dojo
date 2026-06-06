<script>
  import { onMount } from 'svelte';
  import { Plus, Trash2, Download, Upload, Check, AlertCircle, FileCode, Edit2, Play } from 'lucide-svelte';

  let { 
    language = 'python',
    onChallengeCreated = null // callback when custom challenge list updates
  } = $props();

  // Custom challenges list
  let customChallenges = $state([]);
  let filteredCustomChallenges = $derived(customChallenges.filter(c => c.language === lang));
  
  // Form fields
  let id = $state('');
  let title = $state('');
  let prompt = $state('');
  let chapter = $state(1);
  let topic = $state('');
  let starterCode = $state('');
  let hint = $state('');
  let solution = $state('');
  let difficulty = $state('easy'); // 'easy'|'medium'|'hard'
  let lang = $derived(language);

  // Checks creator
  let checks = $state([{ test: '', msg: '' }]);

  onMount(() => {
    loadCustomChallenges();
  });

  function loadCustomChallenges() {
    const saved = localStorage.getItem('dojo_custom_challenges');
    if (saved) {
      try {
        customChallenges = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing custom challenges: ", e);
      }
    }
  }

  function saveCustomChallenges() {
    localStorage.setItem('dojo_custom_challenges', JSON.stringify(customChallenges));
    if (onChallengeCreated) {
      onChallengeCreated();
    }
  }

  function addCheck() {
    checks.push({ test: '', msg: '' });
  }

  function removeCheck(idx) {
    if (checks.length <= 1) return;
    checks = checks.filter((_, i) => i !== idx);
  }

  function resetForm() {
    id = '';
    title = '';
    prompt = '';
    chapter = 1;
    topic = '';
    starterCode = lang === 'python' ? '# Starter code\n' : '-- Starter query\n';
    hint = '';
    solution = '';
    difficulty = 'easy';
    checks = [{ test: '', msg: '' }];
  }

  function createChallenge() {
    if (!title.trim() || !prompt.trim() || !topic.trim()) {
      alert("Please enter title, prompt, and topic.");
      return;
    }

    // Filter empty checks
    const filteredChecks = checks.filter(c => c.test.trim() && c.msg.trim());
    if (lang === 'python' && filteredChecks.length === 0) {
      alert("Python exercises require at least one validation rule check.");
      return;
    }

    const newChallenge = {
      id: id || `custom-${lang}-${Date.now()}`,
      chapter: Number(chapter),
      topic: topic.trim(),
      title: title.trim(),
      prompt: prompt.trim(),
      starterCode: starterCode,
      hint: hint.trim(),
      solution: solution.trim(),
      difficulty,
      language: lang,
      isCustom: true,
      checks: lang === 'python' ? filteredChecks.map(c => ({
        // convert string format assertions to dojo checks
        test: c.test,
        msg: c.msg
      })) : [
        {
          rule: `(result) => result && result.length > 0`,
          msg: "Query must return a result table"
        }
      ]
    };

    // Replace if existing ID, otherwise append
    const existingIdx = customChallenges.findIndex(c => c.id === newChallenge.id);
    if (existingIdx !== -1) {
      customChallenges[existingIdx] = newChallenge;
      alert("Challenge updated successfully!");
    } else {
      customChallenges.push(newChallenge);
      alert("New challenge forged and added to your syllabus!");
    }

    saveCustomChallenges();
    resetForm();
  }

  function deleteChallenge(cId) {
    if (!confirm("Are you sure you want to delete this forged challenge?")) return;
    customChallenges = customChallenges.filter(c => c.id !== cId);
    saveCustomChallenges();
  }

  function loadIntoForm(challenge) {
    id = challenge.id;
    title = challenge.title;
    prompt = challenge.prompt;
    chapter = challenge.chapter;
    topic = challenge.topic;
    starterCode = challenge.starterCode;
    hint = challenge.hint;
    solution = challenge.solution;
    difficulty = challenge.difficulty;
    
    if (challenge.checks && Array.isArray(challenge.checks)) {
      checks = challenge.checks.map(c => ({
        test: c.test || '',
        msg: c.msg || ''
      }));
    } else {
      checks = [{ test: '', msg: '' }];
    }
  }

  // CSV Serialization Helper
  function convertToCsv(arr) {
    const headers = ['id', 'chapter', 'topic', 'title', 'prompt', 'starterCode', 'hint', 'solution', 'difficulty', 'language', 'isCustom'];
    const escapeCsvValue = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(','),
      ...arr.map(row => {
        return headers.map(header => escapeCsvValue(row[header])).join(',');
      })
    ];
    return csvRows.join('\n');
  }

  // CSV Deserialization Helper
  function parseCsv(csvText) {
    const lines = [];
    let row = [''];
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.trim());
    const data = [];

    for (let r = 1; r < lines.length; r++) {
      const line = lines[r];
      if (line.length < headers.length) continue;
      const obj = {};
      headers.forEach((header, colIdx) => {
        obj[header] = line[colIdx];
      });
      
      // Parse fields back
      if (obj.chapter) obj.chapter = Number(obj.chapter) || 1;
      if (obj.isCustom) obj.isCustom = obj.isCustom === 'true';
      if (obj.language === 'sql') {
        obj.checks = [
          {
            rule: `(result) => result && result.length > 0`,
            msg: "Query must return a result table"
          }
        ];
      } else {
        obj.checks = [
          {
            test: 'True',
            msg: 'Compiled successfully'
          }
        ];
      }
      data.push(obj);
    }
    return data;
  }

  // Export custom challenges JSON/CSV (Item 184)
  function exportForgedChallenges(format = 'json') {
    if (customChallenges.length === 0) {
      alert("No custom challenges forged yet to export!");
      return;
    }
    let content = '';
    let mimeType = 'application/json';
    let fileExt = 'json';

    if (format === 'csv') {
      content = convertToCsv(customChallenges);
      mimeType = 'text/csv';
      fileExt = 'csv';
    } else {
      content = JSON.stringify(customChallenges, null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forged_challenges_${lang}_${new Date().toISOString().slice(0, 10)}.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importForgedChallenges(event) {
    const file = event.target.files[0];
    if (!file) return;
    const isCsv = file.name.endsWith('.csv');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data = [];
        if (isCsv) {
          data = parseCsv(e.target.result);
        } else {
          data = JSON.parse(e.target.result);
        }

        if (!Array.isArray(data)) {
          alert("Imported data must be a JSON array or valid CSV.");
          return;
        }
        
        // merge and prevent duplicates
        const merged = [...customChallenges];
        data.forEach(item => {
          if (item.id && item.title) {
            const idx = merged.findIndex(c => c.id === item.id);
            if (idx !== -1) {
              merged[idx] = item;
            } else {
              merged.push(item);
            }
          }
        });
        customChallenges = merged;
        saveCustomChallenges();
        alert("Forged challenges imported successfully!");
      } catch (err) {
        alert("Failed to parse file: " + err.message);
      }
    };
    reader.readAsText(file);
  }
</script>

<div class="forge-container">
  <div class="forge-header-row">
    <div class="header-title-group">
      <FileCode size={20} class="header-icon" />
      <h2>Dojo Forge (Challenge Creator)</h2>
    </div>
    <div class="header-actions" style="display: flex; gap: 8px;">
      <button class="action-btn-gui outline" onclick={() => exportForgedChallenges('json')} title="Export custom exercises as JSON">
        <Download size={12} />
        <span>Export JSON</span>
      </button>
      <button class="action-btn-gui outline" onclick={() => exportForgedChallenges('csv')} title="Export custom exercises as CSV">
        <Download size={12} />
        <span>Export CSV</span>
      </button>
      <label class="action-btn-gui outline file-label" title="Import custom exercises from JSON or CSV">
        <Upload size={12} />
        <span>Import JSON/CSV</span>
        <input type="file" accept=".json,.csv" onchange={importForgedChallenges} style="display: none;" />
      </label>
    </div>
  </div>

  <div class="forge-main-grid">
    <!-- Left panel: Form editor -->
    <div class="forge-form-panel">
      <h3>Forging options:</h3>
      
      <div class="form-scrollable">
        <div class="form-row-group">
          <label for="forge-title">Exercise Title</label>
          <input id="forge-title" type="text" placeholder="e.g. Pandas Filter Rows" bind:value={title} class="forge-input" />
        </div>

        <div class="form-row-grid-2">
          <div class="form-row-group">
            <label for="forge-chapter">Chapter / Step Number</label>
            <input id="forge-chapter" type="number" min="1" bind:value={chapter} class="forge-input" />
          </div>
          <div class="form-row-group">
            <label for="forge-difficulty">Difficulty</label>
            <select id="forge-difficulty" bind:value={difficulty} class="forge-select">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div class="form-row-group">
          <label for="forge-topic">Topic / Syllabus Category</label>
          <input id="forge-topic" type="text" placeholder="e.g. Dataframe Slicing" bind:value={topic} class="forge-input" />
        </div>

        <div class="form-row-group">
          <label for="forge-prompt">Prompt Instructions (Markdown supported)</label>
          <textarea id="forge-prompt" placeholder="Describe what the student should code..." bind:value={prompt} class="forge-textarea prompt-box"></textarea>
        </div>

        <div class="form-row-group">
          <label for="forge-starter">Starter Code template</label>
          <textarea id="forge-starter" placeholder="Starter snippet..." bind:value={starterCode} class="forge-textarea code-box"></textarea>
        </div>

        <div class="form-row-group">
          <label for="forge-hint">Hint message</label>
          <input id="forge-hint" type="text" placeholder="A friendly clue..." bind:value={hint} class="forge-input" />
        </div>

        <div class="form-row-group">
          <label for="forge-solution">Reference Solution Code</label>
          <textarea id="forge-solution" placeholder="The correct answer code..." bind:value={solution} class="forge-textarea code-box"></textarea>
        </div>

        <!-- Validation rule builder (Python only) -->
        {#if lang === 'python'}
          <div class="validation-rules-section">
            <div class="section-header">
              <span>Verification Assertions:</span>
              <button class="add-rule-btn" onclick={addCheck}>+ Add Rule</button>
            </div>
            
            <div class="rules-list">
              {#each checks as rule, idx}
                <div class="rule-item-builder">
                  <input 
                    type="text" 
                    placeholder="Check expression (e.g. len(result) == 5)" 
                    bind:value={rule.test}
                    class="rule-input-exp" 
                  />
                  <input 
                    type="text" 
                    placeholder="User failing message..." 
                    bind:value={rule.msg}
                    class="rule-input-msg" 
                  />
                  <button class="rule-delete-btn" onclick={() => removeCheck(idx)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="form-action-row">
        <button class="forge-btn reset" onclick={resetForm}>Reset Form</button>
        <button class="forge-btn submit" onclick={createChallenge}>Forge Challenge</button>
      </div>
    </div>

    <!-- Right panel: List of forged challenges -->
    <div class="forge-list-panel">
      <h3>Forged exercises ({customChallenges.filter(c => c.language === lang).length}):</h3>
      
      <div class="forged-cards-scroll">
        {#if filteredCustomChallenges.length === 0}
          <div class="empty-forged-state">
            <AlertCircle size={28} class="empty-icon" />
            <p>You haven't created any custom challenges in {lang.toUpperCase()} yet.</p>
          </div>
        {:else}
          <div class="forged-grid">
            {#each filteredCustomChallenges as c}
              <div class="forged-card">
                <div class="card-left">
                  <span class="card-ch">CH {c.chapter} • {c.difficulty}</span>
                  <h4>{c.title}</h4>
                  <span class="card-topic">{c.topic}</span>
                </div>
                <div class="card-right-actions">
                  <button class="card-act-btn edit" onclick={() => loadIntoForm(c)} title="Edit in form">
                    <Edit2 size={12} />
                  </button>
                  <button class="card-act-btn delete" onclick={() => deleteChallenge(c.id)} title="Delete custom challenge">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .forge-container {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--color-ink);
  }

  .forge-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-hairline);
    padding-bottom: 10px;
    flex-shrink: 0;
  }

  .header-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-primary);
  }

  .header-title-group h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn-gui {
    height: 28px;
    padding: 0 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }

  .action-btn-gui.outline {
    background: transparent;
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
  }

  .action-btn-gui.outline:hover {
    color: var(--color-ink);
    border-color: var(--color-card-border);
  }

  .file-label {
    cursor: pointer;
  }

  /* Main Grid Layout */
  .forge-main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    height: 480px;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .forge-main-grid {
      grid-template-columns: 1fr;
      height: auto;
      overflow: visible;
    }
  }

  .forge-form-panel, .forge-list-panel {
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 14px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .forge-form-panel h3, .forge-list-panel h3 {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .form-scrollable {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 6px;
  }

  .form-row-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-row-group label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-muted);
  }

  .forge-input, .forge-select {
    height: 32px;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: 4px;
    color: var(--color-ink);
    padding: 0 10px;
    font-size: 12px;
    outline: none;
  }

  .forge-input:focus, .forge-select:focus {
    border-color: var(--color-primary);
  }

  .form-row-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .forge-textarea {
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: 4px;
    color: var(--color-ink);
    padding: 8px 10px;
    font-size: 12px;
    outline: none;
    resize: vertical;
  }

  .forge-textarea:focus {
    border-color: var(--color-primary);
  }

  .prompt-box {
    min-height: 80px;
  }

  .code-box {
    min-height: 80px;
    font-family: var(--font-mono);
  }

  /* Rules section */
  .validation-rules-section {
    border-top: 1px solid var(--color-hairline);
    padding-top: 10px;
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
  }

  .add-rule-btn {
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .rule-item-builder {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .rule-input-exp, .rule-input-msg {
    height: 28px;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    font-size: 11px;
    padding: 0 6px;
    border-radius: 4px;
    outline: none;
  }

  .rule-input-exp { flex: 0.6; font-family: var(--font-mono); }
  .rule-input-msg { flex: 0.4; }

  .rule-delete-btn {
    width: 28px;
    height: 28px;
    background: transparent;
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rule-delete-btn:hover {
    color: var(--color-error);
    background: var(--color-error-bg);
  }

  .form-action-row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--color-hairline);
    flex-shrink: 0;
  }

  .forge-btn {
    height: 32px;
    padding: 0 16px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .forge-btn.submit {
    background: var(--color-primary);
    border: none;
    color: var(--color-canvas);
  }

  .forge-btn.reset {
    background: transparent;
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
  }

  /* List Side */
  .forged-cards-scroll {
    flex: 1;
    overflow-y: auto;
  }

  .empty-forged-state {
    padding: 60px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: var(--color-muted);
  }

  .empty-icon {
    margin-bottom: 8px;
  }

  .forged-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .forged-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .card-ch {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    color: var(--color-primary);
    font-weight: bold;
  }

  .forged-card h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
  }

  .card-topic {
    font-size: 11px;
    color: var(--color-muted);
  }

  .card-right-actions {
    display: flex;
    gap: 6px;
  }

  .card-act-btn {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid var(--color-hairline);
    background: var(--color-tab-inactive);
    color: var(--color-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .card-act-btn.edit:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .card-act-btn.delete:hover {
    color: var(--color-error);
    border-color: var(--color-error);
    background: var(--color-error-bg);
  }
</style>
