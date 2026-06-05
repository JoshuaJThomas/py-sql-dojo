<script>
  import { onMount } from 'svelte';
  import { Play, PlusCircle, Trash2, ArrowUp, ArrowDown, FileCode, FileText, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-svelte';
  import Editor from './Editor.svelte';
  import { runPythonCell } from '../runners/python-runner.js';
  import { runSqlQuery } from '../runners/sql-runner.js';
  import { parseMarkdown } from '../utils/markdown.js';

  let { 
    challengeId = 'sandbox',
    language = 'python',
    starterCode = '',
    onNotebookCodeChange = null // callback when notebook code is updated
  } = $props();

  // Each cell structure: { id, type: 'code'|'markdown', content: '', output: '', error: '', resultRepr: '', isRunning: false }
  let cells = $state([]);
  let activeEditCellId = $state(null);

  // Track the last loaded state to prevent overwrite during race conditions
  let loadedChallengeId = $state(null);
  let loadedLanguage = $state(null);

  // Load cells reactively when challengeId or language changes
  $effect(() => {
    const key = `dojo_notebook_${challengeId}_${language}`;
    const saved = localStorage.getItem(key);
    let parsed = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved notebook: ", e);
      }
    }

    const PY_BOILERPLATE = '# Write your python notebook cell here\nimport numpy as np\narr = np.array([1, 2, 3, 4])\nprint("Array multiplied by 3:")\narr * 3';
    const SQL_BOILERPLATE = '-- Write your SQL query here\nSELECT * FROM employees LIMIT 3;\n';

    // Self-heal saved notebooks if they only have the boilerplate cell
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      let isPolluted = false;
      if (parsed.length === 1 && parsed[0].type === 'code') {
        const contentClean = parsed[0].content.trim();
        if (contentClean === PY_BOILERPLATE.trim() || contentClean === SQL_BOILERPLATE.trim() || 
            (language === 'python' && contentClean.includes('Array multiplied by 3:') && challengeId !== 'sandbox' && challengeId !== 'ch02-numpy-basic')) {
          isPolluted = true;
        }
      }
      if (!isPolluted) {
        cells = parsed;
        loadedChallengeId = challengeId;
        loadedLanguage = language;
        return;
      }
    }
    
    // Initialize with a cell containing the active challenge's code/starter code
    cells = [
      {
        id: 'cell-' + Date.now() + Math.random().toString(36).substr(2, 5),
        type: 'code',
        content: (starterCode && starterCode !== PY_BOILERPLATE && starterCode !== SQL_BOILERPLATE) 
          ? starterCode 
          : (language === 'python' 
            ? '# Write your python notebook cell here\nimport numpy as np\narr = np.array([1, 2, 3, 4])\nprint("Array multiplied by 3:")\narr * 3'
            : '-- Write your SQL query here\nSELECT * FROM employees LIMIT 3;\n'),
        output: '',
        error: '',
        resultRepr: '',
        isRunning: false
      }
    ];
    loadedChallengeId = challengeId;
    loadedLanguage = language;
  });

  // Save to localStorage and update single-string workspace code when cells change
  $effect(() => {
    // Only save and update when cells correspond to the currently loaded challenge & language
    if (loadedChallengeId === challengeId && loadedLanguage === language && cells.length > 0) {
      const key = `dojo_notebook_${challengeId}_${language}`;
      localStorage.setItem(key, JSON.stringify(cells));
      
      // Concatenate all code cells to feed the main validation harness
      const fullCode = cells
        .filter(c => c.type === 'code')
        .map(c => c.content)
        .join('\n\n');
        
      if (onNotebookCodeChange) {
        onNotebookCodeChange(fullCode);
      }
    }
  });

  function addCell(type = 'code', index = null) {
    const newCell = {
      id: 'cell-' + Date.now() + Math.random().toString(36).substr(2, 5),
      type,
      content: type === 'code' ? (language === 'python' ? '# Code Cell\n' : '-- SQL Query\n') : 'Double click to edit markdown text...',
      output: '',
      error: '',
      resultRepr: '',
      isRunning: false
    };
    if (index === null) {
      cells.push(newCell);
    } else {
      cells.splice(index + 1, 0, newCell);
    }
    activeEditCellId = newCell.id;
  }

  function deleteCell(id) {
    if (cells.length <= 1) {
      alert("Notebook must contain at least one cell.");
      return;
    }
    cells = cells.filter(c => c.id !== id);
  }

  function moveCell(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= cells.length) return;
    const temp = cells[index];
    cells[index] = cells[targetIdx];
    cells[targetIdx] = temp;
  }

  async function executeCell(cell) {
    cell.isRunning = true;
    cell.output = '';
    cell.error = '';
    cell.resultRepr = '';

    if (language === 'python') {
      try {
        const outcome = await runPythonCell(cell.content);
        cell.output = outcome.stdout;
        cell.error = outcome.error;
        cell.resultRepr = outcome.resultRepr;
      } catch (err) {
        cell.error = err.message;
      }
    } else {
      // SQL mode
      try {
        const outcome = await runSqlQuery(null, cell.content);
        if (outcome.success) {
          if (outcome.result && outcome.result.length > 0) {
            cell.resultRepr = JSON.stringify({
              columns: outcome.result[0].columns,
              rows: outcome.result[0].values
            }, null, 2);
          } else {
            cell.output = "Query executed successfully. No rows returned.";
          }
        } else {
          cell.error = outcome.error;
        }
      } catch (err) {
        cell.error = err.message;
      }
    }
    cell.isRunning = false;
  }

  async function executeAll() {
    for (let cell of cells) {
      if (cell.type === 'code') {
        await executeCell(cell);
      }
    }
  }

  function clearAllOutputs() {
    cells.forEach(c => {
      c.output = '';
      c.error = '';
      c.resultRepr = '';
    });
  }

  // Export as .ipynb format (Item 135)
  function exportAsIpynb() {
    const ipynb = {
      cells: cells.map(c => ({
        cell_type: c.type === 'code' ? 'code' : 'markdown',
        metadata: {},
        source: c.content.split('\n').map(line => line + '\n'),
        outputs: c.type === 'code' ? [
          ...(c.output ? [{ output_type: 'stream', name: 'stdout', text: c.output.split('\n').map(line => line + '\n') }] : []),
          ...(c.error ? [{ output_type: 'error', ename: 'Error', evalue: c.error, traceback: [c.error] }] : []),
          ...(c.resultRepr ? [{ output_type: 'execute_result', data: { 'text/plain': c.resultRepr.split('\n').map(line => line + '\n') }, execution_count: 1, metadata: {} }] : [])
        ] : [],
        execution_count: c.type === 'code' ? 1 : null
      })),
      metadata: {
        kernelspec: {
          display_name: language === 'python' ? 'Python (Pyodide)' : 'SQL (SQLite)',
          language: language,
          name: language
        }
      },
      nbformat: 4,
      nbformat_minor: 2
    };

    const blob = new Blob([JSON.stringify(ipynb, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dojo_notebook_${challengeId}.ipynb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importIpynb(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json.cells || !Array.isArray(json.cells)) {
          alert("Invalid Jupyter Notebook format!");
          return;
        }
        cells = json.cells.map((jc, i) => {
          const type = jc.cell_type === 'markdown' ? 'markdown' : 'code';
          const content = Array.isArray(jc.source) ? jc.source.join('') : (jc.source || '');
          let output = '';
          let error = '';
          let resultRepr = '';

          if (jc.outputs && Array.isArray(jc.outputs)) {
            jc.outputs.forEach(out => {
              if (out.output_type === 'stream') {
                output += Array.isArray(out.text) ? out.text.join('') : out.text;
              } else if (out.output_type === 'error') {
                error += out.evalue || (Array.isArray(out.traceback) ? out.traceback.join('\n') : '');
              } else if (out.output_type === 'execute_result') {
                if (out.data && out.data['text/plain']) {
                  resultRepr += Array.isArray(out.data['text/plain']) ? out.data['text/plain'].join('') : out.data['text/plain'];
                }
              }
            });
          }

          return {
            id: 'cell-' + Date.now() + '-' + i,
            type,
            content,
            output,
            error,
            resultRepr,
            isRunning: false
          };
        });
        alert("Notebook imported successfully!");
      } catch (err) {
        alert("Failed to parse .ipynb file: " + err.message);
      }
    };
    reader.readAsText(file);
  }
</script>

<div class="notebook-container">
  <div class="notebook-toolbar">
    <span class="toolbar-title">Jupyter Notebook Mode</span>
    <div class="toolbar-actions">
      <button class="tool-btn" onclick={executeAll} title="Run all code cells">
        <Play size={12} fill="currentColor" />
        <span>Run All</span>
      </button>
      <button class="tool-btn" onclick={clearAllOutputs} title="Clear cell results">
        <Trash2 size={12} />
        <span>Clear Outputs</span>
      </button>
      <div class="divider"></div>
      <button class="tool-btn" onclick={exportAsIpynb} title="Export as standard .ipynb file">
        <Download size={12} />
        <span>Export .ipynb</span>
      </button>
      <label class="tool-btn file-label" title="Upload an existing .ipynb file">
        <Upload size={12} />
        <span>Import</span>
        <input type="file" accept=".ipynb" onchange={importIpynb} style="display: none;" />
      </label>
    </div>
  </div>

  <div class="cells-list">
    {#each cells as cell, idx (cell.id)}
      <div class="cell-wrapper" class:active={activeEditCellId === cell.id}>
        <div class="cell-left-bar">
          <span class="cell-num">[{cell.type === 'code' ? (idx + 1) : '*'}]</span>
          
          <div class="cell-actions">
            <button class="cell-act-btn" disabled={idx === 0} onclick={() => moveCell(idx, -1)} title="Move up">
              <ArrowUp size={11} />
            </button>
            <button class="cell-act-btn" disabled={idx === cells.length - 1} onclick={() => moveCell(idx, 1)} title="Move down">
              <ArrowDown size={11} />
            </button>
            <button class="cell-act-btn delete" onclick={() => deleteCell(cell.id)} title="Delete cell">
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        <div class="cell-main">
          {#if cell.type === 'code'}
            <!-- Code Editor Cell -->
            <div class="cell-editor-container" onclick={() => activeEditCellId = cell.id} role="presentation">
              <Editor 
                bind:value={cell.content} 
                language={language}
                fontSize={13}
                wordWrap={true}
              />
              <button 
                class="cell-run-overlay-btn" 
                onclick={() => executeCell(cell)} 
                disabled={cell.isRunning}
                title="Execute cell"
              >
                {#if cell.isRunning}
                  <span class="mini-spinner"></span>
                {:else}
                  <Play size={10} fill="currentColor" />
                {/if}
              </button>
            </div>
          {:else}
            <!-- Markdown Cell -->
            <div 
              class="cell-markdown-container" 
              class:editing={activeEditCellId === cell.id}
              onclick={() => activeEditCellId = cell.id}
              ondblclick={() => activeEditCellId = cell.id}
              role="presentation"
            >
              {#if activeEditCellId === cell.id}
                <textarea 
                  class="markdown-textarea" 
                  bind:value={cell.content}
                  onblur={() => activeEditCellId = null}
                  placeholder="Type markdown syntax here..."
                  autoFocus
                ></textarea>
                <div class="md-tip">Click outside cell to render. Double-click to edit again.</div>
              {:else}
                <div class="markdown-rendered">
                  {@html parseMarkdown(cell.content || '*Double-click to write text here*')}
                </div>
              {/if}
            </div>
          {/if}

          <!-- Cell Output Section -->
          {#if cell.type === 'code' && (cell.output || cell.error || cell.resultRepr)}
            <div class="cell-output-area">
              {#if cell.error}
                <div class="cell-error">
                  <AlertCircle size={12} class="out-icon" />
                  <pre>{cell.error}</pre>
                </div>
              {/if}
              {#if cell.output}
                <div class="cell-stdout">
                  <pre>{cell.output}</pre>
                </div>
              {/if}
              {#if cell.resultRepr}
                <div class="cell-repr">
                  {#if language === 'sql'}
                    {@const data = JSON.parse(cell.resultRepr)}
                    <!-- SQL Mini Preview grid -->
                    <div class="mini-sql-table">
                      <table>
                        <thead>
                          <tr>
                            {#each data.columns as col}
                              <th>{col}</th>
                            {/each}
                          </tr>
                        </thead>
                        <tbody>
                          {#each data.rows.slice(0, 5) as row}
                            <tr>
                              {#each row as cell}
                                <td>{cell === null ? 'NULL' : cell}</td>
                              {/each}
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                      {#if data.rows.length > 5}
                        <span class="truncated-warning">Showing first 5 of {data.rows.length} rows</span>
                      {/if}
                    </div>
                  {:else}
                    <pre class="repr-text">{cell.resultRepr}</pre>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Insert intermediate cell controller -->
      <div class="insert-divider">
        <button class="insert-btn" onclick={() => addCell('code', idx)}>
          <PlusCircle size={10} />
          <span>+ Code</span>
        </button>
        <button class="insert-btn" onclick={() => addCell('markdown', idx)}>
          <PlusCircle size={10} />
          <span>+ Text</span>
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .notebook-container {
    background: var(--color-editor-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--color-ink);
  }

  .notebook-toolbar {
    background: var(--color-tab-inactive);
    border-bottom: 1px solid var(--color-hairline);
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    flex-shrink: 0;
  }

  .toolbar-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tool-btn {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    padding: 4px 10px;
    border-radius: var(--radius-xs);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }

  .tool-btn:hover {
    border-color: var(--color-card-border);
    background: var(--color-tab-inactive);
  }

  .file-label {
    cursor: pointer;
  }

  .divider {
    width: 1px;
    height: 16px;
    background: var(--color-hairline);
    margin: 0 4px;
  }

  .cells-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cell-wrapper {
    display: flex;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 8px;
    background: rgba(255, 255, 255, 0.01);
    transition: all 0.2s;
    position: relative;
  }

  .cell-wrapper.active {
    border-color: var(--color-hairline);
    background: rgba(255, 255, 255, 0.02);
  }

  .cell-left-bar {
    width: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding-top: 8px;
    flex-shrink: 0;
  }

  .cell-num {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-muted);
  }

  .cell-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    opacity: 0.1;
    transition: opacity 0.2s;
  }

  .cell-wrapper:hover .cell-actions {
    opacity: 1;
  }

  .cell-act-btn {
    background: transparent;
    border: none;
    color: var(--color-muted);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
  }

  .cell-act-btn:hover:not(:disabled) {
    color: var(--color-ink);
    background: var(--color-hairline);
  }

  .cell-act-btn.delete:hover {
    color: var(--color-error);
    background: var(--color-error-bg);
  }

  .cell-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .cell-editor-container {
    position: relative;
    border-radius: var(--radius-xs);
    overflow: hidden;
  }

  .cell-run-overlay-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--color-primary);
    border: none;
    color: var(--color-canvas);
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    opacity: 0.8;
    transition: all 0.2s;
  }

  .cell-run-overlay-btn:hover {
    transform: scale(1.1);
    opacity: 1;
  }

  .mini-spinner {
    width: 10px;
    height: 10px;
    border: 2px solid var(--color-canvas);
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .cell-markdown-container {
    border: 1px dashed var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 10px 14px;
    min-height: 48px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .cell-markdown-container:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .cell-markdown-container.editing {
    border-style: solid;
    border-color: var(--color-primary);
    background: var(--color-canvas);
  }

  .markdown-textarea {
    width: 100%;
    min-height: 100px;
    background: transparent;
    border: none;
    color: var(--color-ink);
    font-family: var(--font-mono);
    font-size: 13px;
    outline: none;
    resize: vertical;
  }

  .md-tip {
    font-size: 10px;
    color: var(--color-muted);
    margin-top: 4px;
  }

  .markdown-rendered {
    font-size: 13px;
    line-height: 1.5;
  }

  .markdown-rendered :global(p) {
    margin: 0 0 8px 0;
  }

  .markdown-rendered :global(p:last-child) {
    margin-bottom: 0;
  }

  .markdown-rendered :global(code) {
    background: var(--color-hairline);
    padding: 1px 4px;
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .cell-output-area {
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 8px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 250px;
    overflow-y: auto;
  }

  .cell-stdout pre, .cell-error pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .cell-error {
    color: var(--color-error);
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .out-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .cell-repr {
    border-top: 1px solid var(--color-hairline);
    padding-top: 4px;
    color: var(--color-primary);
  }

  .repr-text {
    margin: 0;
    white-space: pre-wrap;
    color: var(--color-primary);
  }

  .mini-sql-table {
    overflow-x: auto;
  }

  .mini-sql-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    color: var(--color-ink);
  }

  .mini-sql-table th, .mini-sql-table td {
    border: 1px solid var(--color-hairline);
    padding: 4px 8px;
    text-align: left;
  }

  .mini-sql-table th {
    background: var(--color-tab-inactive);
    color: var(--color-muted);
    font-weight: bold;
  }

  .truncated-warning {
    font-size: 10px;
    color: var(--color-muted);
    display: block;
    margin-top: 4px;
    font-style: italic;
  }

  /* Insert divider between cells */
  .insert-divider {
    height: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .cells-list:hover .insert-divider:hover,
  .insert-divider:hover {
    opacity: 1;
  }

  .insert-btn {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
    font-size: 9px;
    font-weight: 700;
    height: 18px;
    padding: 0 8px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .insert-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: scale(1.05);
  }
</style>
