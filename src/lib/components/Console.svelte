<script>
  import { Terminal, AlertCircle, CheckCircle, Database, LayoutGrid } from 'lucide-svelte';

  let { 
    type = 'python',
    stdout = '',
    error = '',
    checksPassed = false,
    checkError = '',
    queryResult = null,
    dbState = {},
    hasRun = false
  } = $props();

  let activeTab = $state('console'); // 'console' | 'table-data'
  let activeTablePreview = $state('');

  let tableList = $derived(Object.keys(dbState));

  // Auto-set the first preview table when tables list updates
  $effect(() => {
    if (tableList.length > 0 && !activeTablePreview) {
      activeTablePreview = tableList[0];
    }
  });
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
  </div>

  <div class="console-body">
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

              <!-- Assertion Results -->
              <div class="assertion-section">
                {#if checksPassed}
                  <div class="assertion-status pass">
                    <CheckCircle size={16} class="status-icon" />
                    <span>All assertion checks passed successfully!</span>
                  </div>
                {:else}
                  <div class="assertion-status fail">
                    <AlertCircle size={16} class="status-icon" />
                    <span class="bold">Assertion check failed:</span>
                    <pre class="assert-error">{checkError || "The returned value did not match the expected solution."}</pre>
                  </div>
                {/if}
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
                  <span>Query Executed Successfully:</span>
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

  .idle-icon {
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
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
    max-height: 250px;
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

  .assertion-status {
    border-radius: var(--radius-xs);
    padding: 12px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
  }

  .assertion-status.pass {
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.15);
    color: #a7f3d0;
  }

  .assertion-status.fail {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.15);
    color: #fca5a5;
    flex-direction: column;
  }

  .status-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .assert-error {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-xs);
    padding: 8px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: #fda4af;
    white-space: pre-wrap;
    margin-top: 6px;
    width: 100%;
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
    max-height: 300px;
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
</style>
