<script>
  import { Terminal, AlertCircle, CheckCircle, Database, HelpCircle, Download } from 'lucide-svelte';

  let { 
    type = 'python',
    stdout = '',
    error = '',
    checksPassed = false,
    checksResults = [],
    queryResult = null,
    dbState = {},
    hasRun = false
  } = $props();

  let activeTab = $state('console'); // 'console' | 'table-data'
  let activeTablePreview = $state('');
  let consoleBodyRef = $state(null);

  let tableList = $derived(Object.keys(dbState));

  // Auto-set the first preview table when tables list updates
  $effect(() => {
    if (tableList.length > 0 && !activeTablePreview) {
      activeTablePreview = tableList[0];
    }
  });

  // Force reset console tab if switching to python
  $effect(() => {
    if (type === 'python' && activeTab === 'table-data') {
      activeTab = 'console';
    }
  });

  // Auto-scroll console to bottom when results load
  $effect(() => {
    const trigger = [stdout, error, queryResult, activeTab];
    if (consoleBodyRef) {
      setTimeout(() => {
        consoleBodyRef.scrollTop = consoleBodyRef.scrollHeight;
      }, 50);
    }
  });

  // Export SQL rows to CSV
  function downloadCSV() {
    if (!queryResult || queryResult.length === 0) return;
    const columns = queryResult[0].columns;
    const values = queryResult[0].values;
    
    const csvContent = [
      columns.join(','),
      ...values.map(row => 
        row.map(val => {
          if (val === null) return 'NULL';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dojo_query_result_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export console text output to a txt file
  function downloadConsoleLogs() {
    let logText = "";
    if (type === 'python') {
      if (error) {
        logText = `Python Execution Error:\n${error}`;
      } else if (stdout) {
        logText = `Python Standard Output:\n${stdout}`;
      } else {
        logText = "Python executed successfully (no stdout output).";
      }
    } else if (type === 'sql') {
      if (error) {
        logText = `SQL Query Execution Error:\n${error}`;
      } else if (queryResult && queryResult.length > 0) {
        const columns = queryResult[0].columns;
        const values = queryResult[0].values;
        logText = `SQL Query Executed Successfully.\nColumns: ${columns.join(', ')}\nRows:\n` +
          values.map(v => v.map(cell => cell === null ? 'NULL' : cell).join(' | ')).join('\n');
      } else {
        logText = `SQL Query Executed Successfully (No Rows returned).`;
      }
    }
    
    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_console_output_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="console-box">
  <div class="console-header">
    <div class="tabs">
      <button 
        class="tab-btn" 
        class:active={activeTab === 'console'} 
        onclick={() => activeTab = 'console'}
      >
        <Terminal size={14} class="tab-icon" />
        <span>Output / Console</span>
      </button>

      {#if type === 'sql' && tableList.length > 0}
        <button 
          class="tab-btn" 
          class:active={activeTab === 'table-data'} 
          onclick={() => activeTab = 'table-data'}
        >
          <Database size={14} class="tab-icon" />
          <span>Browse Tables</span>
        </button>
      {/if}
    </div>

    <div class="console-header-actions">
      {#if hasRun && (stdout || error || (type === 'sql' && queryResult))}
        <button class="console-action-btn" onclick={downloadConsoleLogs} title="Download console logs">
          <Download size={11} />
          <span>Logs</span>
        </button>
      {/if}
      {#if type === 'sql' && queryResult && queryResult.length > 0}
        <button class="console-action-btn csv-btn" onclick={downloadCSV} title="Export query result as CSV">
          <Download size={11} />
          <span>Export CSV</span>
        </button>
      {/if}
    </div>
  </div>

  <div class="console-body" bind:this={consoleBodyRef}>
    {#if activeTab === 'console'}
      {#if !hasRun}
        <div class="idle-state">
          <Terminal size={24} class="idle-icon" />
          <p>Click "Run Code" to execute your solution.</p>
        </div>
      {:else}
        <div class="output-content">
          <!-- Python specific output -->
          {#if type === 'python'}
            {#if error}
              <div class="error-section">
                <div class="log-title error-text">
                  <AlertCircle size={14} class="log-icon" />
                  <span>Execution Error:</span>
                </div>
                <pre class="error-log">{error}</pre>
              </div>
            {:else}
              {#if stdout}
                <div class="log-section">
                  <div class="log-title">Standard Output (stdout):</div>
                  <pre class="stdout-log">{stdout}</pre>
                </div>
              {/if}

              <!-- Test Cases Checklist -->
              <div class="assertion-section">
                <div class="log-title">Test Cases Checklist:</div>
                <div class="checks-list">
                  {#each checksResults as ch}
                    <div class="check-item-wrapper">
                      <div class="check-row" class:passed={ch.passed}>
                        {#if ch.passed}
                          <CheckCircle size={14} class="check-icon pass" />
                        {:else}
                          <AlertCircle size={14} class="check-icon fail" />
                        {/if}
                        <span class="check-msg">{ch.msg}</span>
                      </div>
                      {#if !ch.passed && (ch.has_actual || ch.has_expected || ch.error_detail)}
                        <div class="check-details-box">
                          {#if ch.error_type && ch.error_type !== 'AssertionError'}
                            <div class="detail-row">
                              <span class="detail-key">Exception:</span>
                              <code class="detail-val error-highlight">{ch.error_type}: {ch.error_detail}</code>
                            </div>
                          {/if}
                          {#if ch.has_expected}
                            <div class="detail-row">
                              <span class="detail-key">Expected:</span>
                              <pre class="detail-pre"><code>{ch.expected}</code></pre>
                            </div>
                          {/if}
                          {#if ch.has_actual}
                            <div class="detail-row">
                              <span class="detail-key">Returned:</span>
                              <pre class="detail-pre actual-pre"><code>{ch.actual}</code></pre>
                            </div>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

          <!-- SQL specific output -->
          {:else if type === 'sql'}
            {#if error}
              <div class="error-section">
                <div class="log-title error-text">
                  <AlertCircle size={14} class="log-icon" />
                  <span>SQL Error:</span>
                </div>
                <pre class="error-log">{error}</pre>
              </div>
            {:else if queryResult && queryResult.length > 0}
              <div class="table-results-container">
                <div class="log-title success-text">
                  <CheckCircle size={14} class="log-icon" />
                  <span>Query Executed:</span>
                </div>
                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        {#each queryResult[0].columns as col}
                          <th>{col}</th>
                        {/each}
                      </tr>
                    </thead>
                    <tbody>
                      {#each queryResult[0].values as row}
                        <tr>
                          {#each row as cell}
                            <td>{cell === null ? 'NULL' : cell}</td>
                          {/each}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                <span class="row-count">{queryResult[0].values.length} rows returned.</span>

                <!-- SQL Test Cases Checklist -->
                <div class="assertion-section" style="margin-top: 10px;">
                  <div class="log-title">Dojo Checks:</div>
                  <div class="checks-list">
                    {#each checksResults as ch}
                      <div class="check-item-wrapper">
                        <div class="check-row" class:passed={ch.passed}>
                          {#if ch.passed}
                            <CheckCircle size={14} class="check-icon pass" />
                          {:else}
                            <AlertCircle size={14} class="check-icon fail" />
                          {/if}
                          <span class="check-msg">{ch.msg}</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {:else if queryResult}
              <div class="empty-results">
                <CheckCircle size={16} class="log-icon success-text" />
                <p>Query executed successfully, but returned no rows.</p>
              </div>
            {/if}
          {/if}
        </div>
      {/if}

    {:else if activeTab === 'table-data'}
      <!-- SQL Table browser -->
      <div class="table-browser-panel">
        <div class="browser-sidebar">
          {#each tableList as tbl}
            <button 
              class="tbl-select-btn" 
              class:selected={activeTablePreview === tbl}
              onclick={() => activeTablePreview = tbl}
            >
              {tbl}
            </button>
          {/each}
        </div>
        <div class="browser-content">
          {#if activeTablePreview && dbState[activeTablePreview]}
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {#each dbState[activeTablePreview][0].columns as col}
                      <th>{col}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each dbState[activeTablePreview][0].values as row}
                    <tr>
                      {#each row as cell}
                        <td>{cell === null ? 'NULL' : cell}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="empty-text">Table is empty or missing columns.</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .console-box {
    border: 1px solid #1a1a24;
    border-radius: var(--radius-sm);
    background: #0d0d11;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .console-header {
    background: #111116;
    border-bottom: 1px solid #1a1a24;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    height: 42px;
  }

  .tabs {
    display: flex;
    gap: 8px;
    height: 100%;
  }

  .tab-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #64748b;
    padding: 0 12px;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 100%;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: #ffffff;
  }

  .tab-btn.active {
    color: #10b981;
    border-bottom-color: #10b981;
  }

  .console-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    position: relative;
  }

  .idle-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #475569;
    height: 100%;
    gap: 12px;
    text-align: center;
    padding: 40px 0;
  }

  :global(.idle-icon) {
    color: #334155;
  }

  .idle-state p {
    font-size: 13px;
  }

  .output-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .log-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .log-title {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .stdout-log {
    background: #060608;
    border: 1px solid #14141d;
    border-radius: var(--radius-xs);
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: #cbd5e1;
    white-space: pre-wrap;
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
  }

  .error-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .error-text {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ef4444 !important;
  }

  .success-text {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #10b981 !important;
  }

  .error-log {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: var(--radius-xs);
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: #fca5a5;
    white-space: pre-wrap;
    margin: 0;
  }

  .assertion-section {
    margin-top: 4px;
  }

  .check-item-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .check-row {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.12);
    border-radius: var(--radius-xs);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #fca5a5;
  }

  .check-row.passed {
    background: rgba(16, 185, 129, 0.05);
    border-color: rgba(16, 185, 129, 0.12);
    color: #a7f3d0;
  }

  :global(.check-icon.pass) {
    color: #10b981;
  }

  :global(.check-icon.fail) {
    color: #ef4444;
  }

  .check-msg {
    font-family: var(--font-body);
  }

  .check-details-box {
    margin-left: 24px;
    padding: 10px 14px;
    background: #07070a;
    border-left: 2px solid #ef4444;
    border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-key {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-val {
    font-family: var(--font-mono);
    color: #cbd5e1;
  }

  .error-highlight {
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .detail-pre {
    background: #0c0c10;
    border: 1px solid #14141d;
    padding: 6px 10px;
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    color: #a7f3d0;
    margin: 0;
    white-space: pre-wrap;
    overflow-x: auto;
  }

  .actual-pre {
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.15);
  }

  /* Table Results Styling */
  .table-results-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .table-wrapper {
    background: #09090c;
    border: 1px solid #181822;
    border-radius: var(--radius-xs);
    overflow-x: auto;
    max-height: 250px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 13px;
    text-align: left;
  }

  th {
    background: #14141d;
    color: #94a3b8;
    padding: 10px 14px;
    border-bottom: 1px solid #1a1a24;
    font-weight: 600;
  }

  td {
    color: #cbd5e1;
    padding: 8px 14px;
    border-bottom: 1px solid #14141a;
  }

  tr:hover td {
    background: rgba(255, 255, 255, 0.01);
  }

  .row-count {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
  }

  .empty-results {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.15);
    border-radius: var(--radius-xs);
    padding: 12px;
    color: #cbd5e1;
  }

  .empty-results p {
    font-size: 13px;
    margin: 0;
  }

  /* Browser panel styling */
  .table-browser-panel {
    display: flex;
    height: 100%;
    min-height: 250px;
  }

  .browser-sidebar {
    width: 130px;
    border-right: 1px solid #1a1a24;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 12px;
    overflow-y: auto;
  }

  .tbl-select-btn {
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-xs);
    color: #64748b;
    padding: 8px 12px;
    text-align: left;
    font-family: var(--font-mono);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tbl-select-btn:hover {
    color: #ffffff;
    background: #111116;
  }

  .tbl-select-btn.selected {
    color: #10b981;
    background: rgba(16, 185, 129, 0.05);
    border-color: rgba(16, 185, 129, 0.15);
  }

  .browser-content {
    flex: 1;
    padding-left: 12px;
    overflow-x: auto;
  }

  .empty-text {
    color: #64748b;
    font-size: 13px;
    padding: 20px;
  }

  .console-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .console-action-btn {
    background: #1c1c28;
    border: 1px solid #27273a;
    color: #cbd5e1;
    padding: 4px 8px;
    border-radius: var(--radius-xs);
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }

  .console-action-btn:hover {
    background: #232334;
    border-color: #3b82f6;
    color: #ffffff;
  }

  .console-action-btn.csv-btn:hover {
    border-color: #10b981;
  }
</style>
