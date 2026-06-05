<script>
  import { Terminal, AlertCircle, CheckCircle, Database, HelpCircle, Download, Cpu } from 'lucide-svelte';
  import TableEditor from './TableEditor.svelte';
  import ExplainVisualizer from './ExplainVisualizer.svelte';

  let { 
    type = 'python',
    stdout = '',
    error = '',
    checksPassed = false,
    checksResults = [],
    queryResult = null,
    dbState = {},
    hasRun = false,
    isRunning = false,
    executionTime = null,
    rawQuery = '',
    executedCode = '',
    onExecuteQuery = null
  } = $props();

  function getFriendlyType(valStr) {
    if (!valStr) return "unknown type";
    if (valStr.startsWith("'") || valStr.startsWith('"')) return "string";
    if (valStr.startsWith('[') && valStr.endsWith(']')) return "list";
    if (valStr.startsWith('(') && valStr.endsWith(')')) return "tuple";
    if (valStr.startsWith('{') && valStr.endsWith('}')) return "dictionary/set";
    if (!isNaN(Number(valStr))) return "number";
    return typeof valStr;
  }

  function generateSmartFeedback(check, type, code) {
    if (check.passed) return "";
    
    const actual = check.actual;
    const expected = check.expected;
    const msg = (check.msg || "").toLowerCase();
    
    const actualStr = actual ? actual.trim() : "";
    const expectedStr = expected ? expected.trim() : "";
    
    // 1. Syntax / Name error case
    if (check.error_type && check.error_type !== 'AssertionError') {
      if (check.error_type === 'NameError') {
        return `A variable used in the test (e.g. 'result') is not defined. Did you spell it correctly or forget to declare/initialize it?`;
      }
      if (check.error_type === 'TypeError') {
        return `Type error encountered: ${check.error_detail}. Check if you're trying to perform operations on incompatible types (e.g., adding a string to an integer).`;
      }
      if (check.error_type === 'IndexError') {
        return `Index error: ${check.error_detail}. You are trying to access a list element at an index that doesn't exist. Check your list bounds!`;
      }
      if (check.error_type === 'KeyError') {
        return `Key error: ${check.error_detail}. You are trying to access a dictionary key that doesn't exist.`;
      }
      return `Your code ran but failed with a ${check.error_type}: ${check.error_detail}`;
    }

    // Determine actual friendly type
    const actualType = getFriendlyType(actualStr);

    // 2. Message-based type analysis (if actual is not None)
    if (actualStr !== "None" && actualStr !== "") {
      if (msg.includes("tuple") && actualType !== "tuple") {
        return `Type mismatch! The check expects a **tuple** (e.g., \`(x, y)\`), but your \`result\` is a **${actualType}** (\`${actualStr}\`). Hint: Use parentheses to define tuples.`;
      }
      if (msg.includes("list") && actualType !== "list") {
        return `Type mismatch! The check expects a **list** (e.g., \`[1, 2]\`), but your \`result\` is a **${actualType}** (\`${actualStr}\`). Hint: Use square brackets to define lists.`;
      }
      if (msg.includes("dictionary") || msg.includes("dict")) {
        if (actualType !== "dictionary/set") {
          return `Type mismatch! The check expects a **dictionary** (e.g., \`{'a': 1}\`), but your \`result\` is a **${actualType}** (\`${actualStr}\`).`;
        }
      }
    }

    // 3. String value casing or mismatch check
    const isExpectedString = (expectedStr.startsWith("'") && expectedStr.endsWith("'")) || (expectedStr.startsWith('"') && expectedStr.endsWith('"'));
    const isActualString = actualType === "string";
    
    if (isExpectedString && isActualString) {
      const expContent = expectedStr.slice(1, -1);
      const actContent = actualStr.slice(1, -1);
      if (expContent.toLowerCase() === actContent.toLowerCase()) {
        return `Casing discrepancy! You returned "${actContent}", which matches the text but has wrong capitalization. Python is case-sensitive: expected exactly "${expContent}".`;
      }
      return `You assigned \`"${actContent}"\` but expected \`"${expContent}"\`. Check if the string has typos.`;
    }

    // 4. Missing assignment check
    if (actualStr === "None" || actualStr === "") {
      const hasAssignment = code && (code.includes('result =') || code.includes('result=') || code.includes('def '));
      if (!hasAssignment) {
        return `The variable \`result\` is not assigned in your code. The test expects you to save the output to the variable \`result\`.`;
      }
      return `\`result\` is currently \`None\`. If you defined a function, did you forget to include a \`return\` statement or assign the function's return value to \`result\`?`;
    }

    // 5. Array/List length checks
    if (actualType === "list" && expectedStr.startsWith('[') && expectedStr.endsWith(']')) {
      try {
        const expLen = (expectedStr.match(/,/g) || []).length + 1;
        const actLen = (actualStr.match(/,/g) || []).length + 1;
        if (expLen !== actLen) {
          return `Size mismatch! Your list contains ${actLen} item(s), but the test expects ${expLen} item(s). Expected: \`${expectedStr}\`.`;
        }
      } catch(e) {}
    }

    // 6. General comparison fallback
    if (expectedStr) {
      return `Value mismatch. The check expected \`${expectedStr}\`, but got \`${actualStr}\`. Check your calculation or variable assignments.`;
    }

    return `The check did not pass. Target condition: "${check.msg}". Double check your logic.`;
  }

  function generateSqlSmartFeedback(check, code) {
    if (check.passed) return "";
    
    const msg = (check.msg || "").toLowerCase();
    const actual = check.actual || "";
    const expected = check.expected || "";
    
    if (msg.includes("columns") || msg.includes("column")) {
      return `Your SELECT query is returning the wrong columns. Expected: \`${expected}\`, but query returned: \`${actual}\`. Check if you used \`SELECT * \` instead of specific column names, or if you have a typo.`;
    }
    if (msg.includes("rows") || msg.includes("row count") || msg.includes("exactly")) {
      return `Row count mismatch. The challenge expects exactly \`${expected}\`, but your query returned \`${actual}\`. Check your \`WHERE\` clause or filter conditions.`;
    }
    
    return `The query executed successfully, but did not satisfy the condition: "${check.msg}". Expected state: \`${expected}\`. Actual: \`${actual}\`.`;
  }

  let activeTab = $state('console'); // 'console' | 'table-data' | 'visuals'
  let activeTablePreview = $state('');
  let consoleBodyRef = $state(null);

  // Explain Query Plan states (Item 156)
  let explainData = $state([]);
  let isExplaining = $state(false);

  async function runExplainAnalysis() {
    activeTab = 'explain';
    if (!onExecuteQuery || !rawQuery) return;
    
    isExplaining = true;
    try {
      const outcome = await onExecuteQuery("EXPLAIN QUERY PLAN " + rawQuery);
      if (outcome.success && outcome.result && outcome.result.length > 0) {
        const resultRows = outcome.result[0].values;
        explainData = resultRows.map(row => ({
          id: row[0],
          parent: row[1],
          notused: row[2],
          detail: row[3]
        }));
      } else {
        explainData = [];
      }
    } catch (e) {
      console.error(e);
      explainData = [];
    }
    isExplaining = false;
  }

  // Charting visuals states
  let chartType = $state('bar'); // 'bar' | 'line' | 'area'
  let chartXCol = $state('');
  let chartYCol = $state('');
  let hoveredPoint = $state(null);

  // Sorting & Pagination states for SQL results
  let sortColumn = $state(null);
  let sortDirection = $state('asc');
  let currentPage = $state(1);
  const pageSize = 10;

  let tableList = $derived(Object.keys(dbState));

  // Reset sorting and page when queryResult changes
  $effect(() => {
    if (queryResult) {
      sortColumn = null;
      sortDirection = 'asc';
      currentPage = 1;
    }
  });

  // Derived properties for SQL results
  let queryColumns = $derived(queryResult && queryResult.length > 0 ? queryResult[0].columns : []);
  let queryRawValues = $derived(queryResult && queryResult.length > 0 ? queryResult[0].values : []);

  let sortedValuesList = $derived.by(() => {
    if (sortColumn === null) return queryRawValues;
    const sorted = [...queryRawValues];
    const colIdx = queryColumns.indexOf(sortColumn);
    if (colIdx === -1) return queryRawValues;

    sorted.sort((a, b) => {
      const valA = a[colIdx];
      const valB = b[colIdx];

      if (valA === null) return sortDirection === 'asc' ? -1 : 1;
      if (valB === null) return sortDirection === 'asc' ? 1 : -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
    return sorted;
  });

  let totalPages = $derived(Math.max(1, Math.ceil(sortedValuesList.length / pageSize)));
  let paginatedValuesList = $derived(sortedValuesList.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  function toggleSort(columnName) {
    if (sortColumn === columnName) {
      if (sortDirection === 'asc') {
        sortDirection = 'desc';
      } else {
        sortColumn = null;
      }
    } else {
      sortColumn = columnName;
      sortDirection = 'asc';
    }
    currentPage = 1;
  }

  // Auto-set the first preview table when tables list updates
  $effect(() => {
    if (tableList.length > 0 && !activeTablePreview) {
      activeTablePreview = tableList[0];
    }
  });

  // Force reset console tab if switching to python or if tab is visuals and no query results
  $effect(() => {
    if (type === 'python' && (activeTab === 'table-data' || activeTab === 'visuals')) {
      activeTab = 'console';
    }
  });

  // Auto-initialize chart columns when query result changes
  $effect(() => {
    if (queryResult && queryResult.length > 0) {
      const cols = queryResult[0].columns;
      if (cols.length > 0) {
        chartXCol = cols[0];
        const vals = queryResult[0].values;
        // Search for first numeric column (excluding first column if possible)
        let numericColIdx = cols.findIndex((col, idx) => {
          if (idx === 0) return false;
          return vals.some(row => typeof row[idx] === 'number' || (!isNaN(Number(row[idx])) && row[idx] !== null));
        });
        if (numericColIdx !== -1) {
          chartYCol = cols[numericColIdx];
        } else {
          chartYCol = cols[1] || cols[0];
        }
      }
    }
  });

  // Compute chart data dynamically
  let chartData = $derived.by(() => {
    if (!queryResult || queryResult.length === 0 || !chartXCol || !chartYCol) return [];
    const cols = queryResult[0].columns;
    const xIdx = cols.indexOf(chartXCol);
    const yIdx = cols.indexOf(chartYCol);
    if (xIdx === -1 || yIdx === -1) return [];

    return queryResult[0].values.map((row, index) => {
      const xVal = row[xIdx] === null ? 'NULL' : String(row[xIdx]);
      const rawY = row[yIdx];
      const yVal = rawY === null ? 0 : (isNaN(Number(rawY)) ? 0 : Number(rawY));
      return { x: xVal, y: yVal, index };
    });
  });

  // SVG parameters & derived scales
  const svgWidth = 500;
  const svgHeight = 220;
  const padding = { top: 15, right: 15, bottom: 40, left: 55 };

  let chartScales = $derived.by(() => {
    if (chartData.length === 0) return null;

    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = svgHeight - padding.top - padding.bottom;

    const yValues = chartData.map(d => d.y);
    const maxY = Math.max(1, ...yValues);
    const minY = Math.min(0, ...yValues);
    const yRange = maxY - minY || 1; // prevent divide-by-zero

    return {
      plotWidth,
      plotHeight,
      maxY,
      minY,
      yRange,
      getX: (index) => {
        if (chartData.length <= 1) return padding.left + plotWidth / 2;
        return padding.left + (index / (chartData.length - 1)) * plotWidth;
      },
      getBarX: (index) => {
        const step = plotWidth / chartData.length;
        return padding.left + index * step + step * 0.1;
      },
      getBarWidth: () => {
        const step = plotWidth / chartData.length;
        return Math.max(4, step * 0.8);
      },
      getY: (value) => {
        const pct = (value - minY) / yRange;
        return padding.top + plotHeight - pct * plotHeight;
      }
    };
  });

  let linePath = $derived.by(() => {
    if (chartData.length === 0 || !chartScales) return "";
    return chartData.map((d, i) => {
      const x = chartScales.getX(i);
      const y = chartScales.getY(d.y);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  });

  let areaPath = $derived.by(() => {
    if (chartData.length === 0 || !chartScales) return "";
    const linePart = linePath;
    const firstX = chartScales.getX(0);
    const lastX = chartScales.getX(chartData.length - 1);
    const zeroY = chartScales.getY(0);
    return `${linePart} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
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

      {#if type === 'sql' && hasRun && !error}
        <button 
          class="tab-btn" 
          class:active={activeTab === 'explain'} 
          onclick={runExplainAnalysis}
        >
          <Cpu size={14} class="tab-icon" />
          <span>Explain Plan</span>
        </button>
      {/if}

      {#if type === 'sql' && queryResult && queryResult.length > 0}
        <button 
          class="tab-btn" 
          class:active={activeTab === 'visuals'} 
          onclick={() => activeTab = 'visuals'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          <span>Visual Analytics</span>
        </button>
      {/if}
    </div>

    <div class="console-header-actions">
      {#if hasRun && executionTime !== null && executionTime !== undefined}
        <span class="execution-time-indicator" title="Sandbox execution duration">
          ⏱️ {executionTime.toFixed(1)} ms
        </span>
      {/if}
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
      {#if isRunning}
        <div class="console-loading-state">
          <div class="cyber-spinner"></div>
          <div class="loading-pulse-text">EXECUTING CODE SANDBOX...</div>
          <div class="loading-sub-text">Compiling WebAssembly packages</div>
        </div>
      {:else if !hasRun}
        <div class="idle-state">
          <Terminal size={24} class="idle-icon" />
          <p>Click "Run Code" to execute your solution.</p>
        </div>
      {:else}
        <div class="output-content">
          <!-- Executed Code Snippet Block -->
          {#if executedCode}
            <div class="executed-code-block">
              <div class="code-block-header">
                <span class="header-dot red"></span>
                <span class="header-dot yellow"></span>
                <span class="header-dot green"></span>
                <span class="header-label">Executed Code ({type === 'python' ? 'Python 3' : 'SQLite'})</span>
              </div>
              <pre class="executed-code-content"><code>{executedCode}</code></pre>
            </div>
          {/if}

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
                      {#if !ch.passed}
                        <div class="check-details-box">
                          {#if ch.error_type && ch.error_type !== 'AssertionError'}
                            <div class="detail-row">
                              <span class="detail-key">Exception:</span>
                              <code class="detail-val error-highlight">{ch.error_type}: {ch.error_detail}</code>
                            </div>
                          {/if}
                          {#if ch.has_expected || ch.has_actual}
                            <div class="diff-split-container">
                              <div class="diff-pane expected-pane">
                                <div class="pane-header">Expected Value</div>
                                <pre class="pane-code"><code>{ch.expected !== null && ch.expected !== undefined ? ch.expected : 'None'}</code></pre>
                              </div>
                              <div class="diff-pane actual-pane">
                                <div class="pane-header">Actual Returned</div>
                                <pre class="pane-code"><code>{ch.actual !== null && ch.actual !== undefined ? ch.actual : 'None'}</code></pre>
                              </div>
                            </div>
                          {/if}
                          <div class="smart-feedback-box">
                            <span class="feedback-icon">💡</span>
                            <div class="feedback-text">
                              {generateSmartFeedback(ch, type, executedCode)}
                            </div>
                          </div>
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
                        {#each queryColumns as col}
                          <th onclick={() => toggleSort(col)} style="cursor: pointer; user-select: none;">
                            <div class="th-content">
                              <span>{col}</span>
                              {#if sortColumn === col}
                                <span class="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                              {:else}
                                <span class="sort-arrow-placeholder">↕</span>
                              {/if}
                            </div>
                          </th>
                        {/each}
                      </tr>
                    </thead>
                    <tbody>
                      {#each paginatedValuesList as row}
                        <tr>
                          {#each row as cell}
                            <td>{cell === null ? 'NULL' : cell}</td>
                          {/each}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                <div class="table-footer-controls">
                  <span class="row-count">{queryRawValues.length} rows returned.</span>
                  {#if queryRawValues.length > pageSize}
                    <div class="pagination-bar">
                      <button 
                        class="pag-btn" 
                        disabled={currentPage === 1} 
                        onclick={() => currentPage = Math.max(1, currentPage - 1)}
                      >
                        Prev
                      </button>
                      <span class="pag-info">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button 
                        class="pag-btn" 
                        disabled={currentPage === totalPages} 
                        onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  {/if}
                </div>

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
                        {#if !ch.passed}
                          <div class="check-details-box">
                            {#if ch.has_expected || ch.has_actual}
                              <div class="diff-split-container">
                                <div class="diff-pane expected-pane">
                                  <div class="pane-header">Expected Value</div>
                                  <pre class="pane-code"><code>{ch.expected !== null && ch.expected !== undefined ? ch.expected : 'None'}</code></pre>
                                </div>
                                <div class="diff-pane actual-pane">
                                  <div class="pane-header">Actual Returned</div>
                                  <pre class="pane-code"><code>{ch.actual !== null && ch.actual !== undefined ? ch.actual : 'None'}</code></pre>
                                </div>
                              </div>
                            {/if}
                            <div class="smart-feedback-box">
                              <span class="feedback-icon">💡</span>
                              <div class="feedback-text">
                                {generateSqlSmartFeedback(ch, executedCode)}
                              </div>
                            </div>
                          </div>
                        {/if}
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
      <!-- SQL Table browser with Mutation controls (Item 136) -->
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
            <TableEditor 
              tableName={activeTablePreview} 
              columns={dbState[activeTablePreview][0].columns} 
              rows={dbState[activeTablePreview][0].values} 
              onExecuteQuery={onExecuteQuery} 
            />
          {:else}
            <p class="empty-text">Table is empty or missing columns.</p>
          {/if}
        </div>
      </div>
    {:else if activeTab === 'explain'}
      <!-- Explain Plan visualizer panel (Item 156) -->
      {#if isExplaining}
        <div class="console-loading-state" style="padding: 40px; text-align: center;">
          <div class="cyber-spinner" style="margin: 0 auto 12px auto;"></div>
          <div class="loading-pulse-text">PARSING QUERY EXPLAIN PLAN...</div>
        </div>
      {:else}
        <ExplainVisualizer 
          explainRows={explainData} 
          tableNameList={tableList} 
          onExecuteQuery={onExecuteQuery} 
          sqlQuery={rawQuery}
        />
      {/if}
    {:else if activeTab === 'visuals' && queryResult && queryResult.length > 0}
      <!-- Visual Analytics Panel -->
      <div class="visuals-panel">
        <div class="visuals-config-bar">
          <div class="config-item">
            <label for="chart-type-select">Chart:</label>
            <select id="chart-type-select" bind:value={chartType} class="config-select">
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>
          <div class="config-item">
            <label for="chart-x-select">X-Axis (Label):</label>
            <select id="chart-x-select" bind:value={chartXCol} class="config-select">
              {#each queryColumns as col}
                <option value={col}>{col}</option>
              {/each}
            </select>
          </div>
          <div class="config-item">
            <label for="chart-y-select">Y-Axis (Value):</label>
            <select id="chart-y-select" bind:value={chartYCol} class="config-select">
              {#each queryColumns as col}
                <option value={col}>{col}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="chart-container">
          {#if chartData.length === 0}
            <p class="empty-chart-text">No data to plot.</p>
          {:else if chartScales}
            <svg 
              viewBox="0 0 {svgWidth} {svgHeight}" 
              width="100%" 
              height="100%" 
              class="analytics-svg"
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.2"/>
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0"/>
                </linearGradient>
              </defs>

              <!-- Grid lines & Y Axis values -->
              {#each [0, 0.25, 0.5, 0.75, 1] as tickPct}
                {@const tickVal = chartScales.minY + tickPct * chartScales.yRange}
                {@const y = chartScales.getY(tickVal)}
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={svgWidth - padding.right} 
                  y2={y} 
                  stroke="var(--color-hairline)" 
                  stroke-dasharray="3,3"
                />
                <text 
                  x={padding.left - 8} 
                  y={y + 4} 
                  text-anchor="end" 
                  class="chart-axis-text"
                >
                  {tickVal.toFixed(0)}
                </text>
              {/each}

              <!-- Bottom base X Axis line -->
              <line 
                x1={padding.left} 
                y1={chartScales.getY(0)} 
                x2={svgWidth - padding.right} 
                y2={chartScales.getY(0)} 
                stroke="var(--color-muted)" 
                stroke-width="1"
              />

              <!-- Render elements based on type -->
              {#if chartType === 'bar'}
                {#each chartData as d, i}
                  {@const barX = chartScales.getBarX(i)}
                  {@const barWidth = chartScales.getBarWidth()}
                  {@const zeroY = chartScales.getY(0)}
                  {@const barY = chartScales.getY(Math.max(0, d.y))}
                  {@const barHeight = Math.abs(chartScales.getY(d.y) - zeroY)}
                  <rect 
                    x={barX} 
                    y={barY} 
                    width={barWidth} 
                    height={Math.max(2, barHeight)} 
                    fill="url(#barGrad)"
                    stroke="var(--color-primary)"
                    stroke-width="1"
                    rx="2"
                    class="chart-bar-rect"
                    onmouseenter={(e) => {
                      hoveredPoint = { ...d, screenX: barX + barWidth/2, screenY: barY };
                    }}
                    onmouseleave={() => hoveredPoint = null}
                    role="presentation"
                  />
                {/each}
              {:else if chartType === 'line'}
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="var(--color-primary)" 
                  stroke-width="2"
                />
                {#each chartData as d, i}
                  {@const ptX = chartScales.getX(i)}
                  {@const ptY = chartScales.getY(d.y)}
                  <circle 
                    cx={ptX} 
                    cy={ptY} 
                    r="4" 
                    fill="var(--color-card-bg)" 
                    stroke="var(--color-primary)" 
                    stroke-width="2" 
                    class="chart-point-circle"
                    onmouseenter={() => hoveredPoint = { ...d, screenX: ptX, screenY: ptY }}
                    onmouseleave={() => hoveredPoint = null}
                    role="presentation"
                  />
                {/each}
              {:else if chartType === 'area'}
                <path 
                  d={areaPath} 
                  fill="url(#areaGrad)" 
                  stroke="none"
                />
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="var(--color-primary)" 
                  stroke-width="2"
                />
                {#each chartData as d, i}
                  {@const ptX = chartScales.getX(i)}
                  {@const ptY = chartScales.getY(d.y)}
                  <circle 
                    cx={ptX} 
                    cy={ptY} 
                    r="4" 
                    fill="var(--color-card-bg)" 
                    stroke="var(--color-primary)" 
                    stroke-width="2" 
                    class="chart-point-circle"
                    onmouseenter={() => hoveredPoint = { ...d, screenX: ptX, screenY: ptY }}
                    onmouseleave={() => hoveredPoint = null}
                    role="presentation"
                  />
                {/each}
              {/if}

              <!-- X Axis Labels (Skipped/sampled if there are many labels to avoid overlap) -->
              {#each chartData as d, i}
                {@const isSampled = chartData.length > 8 ? i % Math.ceil(chartData.length / 6) === 0 : true}
                {#if isSampled}
                  {@const x = chartType === 'bar' ? chartScales.getBarX(i) + chartScales.getBarWidth() / 2 : chartScales.getX(i)}
                  <text 
                    x={x} 
                    y={svgHeight - padding.bottom + 15} 
                    text-anchor="middle" 
                    class="chart-axis-text label-x"
                  >
                    {d.x.length > 10 ? d.x.substring(0, 8) + '..' : d.x}
                  </text>
                {/if}
              {/each}

              <!-- Hover Tooltip Overlay inside SVG -->
              {#if hoveredPoint}
                <g class="chart-tooltip-group">
                  <rect 
                    x={Math.min(svgWidth - 110, Math.max(10, hoveredPoint.screenX - 50))} 
                    y={Math.max(5, hoveredPoint.screenY - 38)} 
                    width="100" 
                    height="32" 
                    rx="4" 
                    fill="var(--color-header-bg)" 
                    stroke="var(--color-primary)" 
                    stroke-width="1.5"
                    filter="drop-shadow(0 2px 5px rgba(0,0,0,0.5))"
                  />
                  <text 
                    x={Math.min(svgWidth - 60, Math.max(60, hoveredPoint.screenX))} 
                    y={Math.max(5, hoveredPoint.screenY - 38) + 12} 
                    text-anchor="middle" 
                    fill="var(--color-ink)" 
                    font-size="9"
                    font-weight="bold"
                    font-family="var(--font-mono)"
                  >
                    {hoveredPoint.x}
                  </text>
                  <text 
                    x={Math.min(svgWidth - 60, Math.max(60, hoveredPoint.screenX))} 
                    y={Math.max(5, hoveredPoint.screenY - 38) + 24} 
                    text-anchor="middle" 
                    fill="var(--color-primary)" 
                    font-size="9"
                    font-weight="bold"
                    font-family="var(--font-mono)"
                  >
                    {hoveredPoint.y}
                  </text>
                </g>
              {/if}
            </svg>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .console-box {
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    background: var(--color-card-bg);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .console-header {
    background: var(--color-tab-inactive);
    border-bottom: 1px solid var(--color-hairline);
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
    color: var(--color-muted);
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
    color: var(--color-ink);
  }

  .tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
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
    color: var(--color-muted);
    height: 100%;
    gap: 12px;
    text-align: center;
    padding: 40px 0;
  }

  :global(.idle-icon) {
    color: var(--color-muted);
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
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .stdout-log {
    background: var(--color-editor-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-ink);
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
    color: var(--color-error) !important;
  }

  .success-text {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-success) !important;
  }

  .error-log {
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    border-radius: var(--radius-xs);
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-error-text);
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
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    border-radius: var(--radius-xs);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-error-text);
  }

  .check-row.passed {
    background: var(--color-success-bg);
    border-color: var(--color-success-border);
    color: var(--color-success-text);
  }

  :global(.check-icon.pass) {
    color: var(--color-success);
  }

  :global(.check-icon.fail) {
    color: var(--color-error);
  }

  .check-msg {
    font-family: var(--font-body);
  }

  .check-details-box {
    margin-left: 24px;
    padding: 10px 14px;
    background: var(--color-editor-bg);
    border-left: 2px solid var(--color-error);
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
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-val {
    font-family: var(--font-mono);
    color: var(--color-ink);
  }

  .error-highlight {
    color: var(--color-error-text);
    background: var(--color-error-bg);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }



  /* Table Results Styling */
  .table-results-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .table-wrapper {
    background: var(--color-editor-bg);
    border: 1px solid var(--color-hairline);
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
    background: var(--color-tab-inactive);
    color: var(--color-muted);
    padding: 10px 14px;
    border-bottom: 1px solid var(--color-hairline);
    font-weight: 600;
  }

  td {
    color: var(--color-ink);
    padding: 8px 14px;
    border-bottom: 1px solid var(--color-hairline);
  }

  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .row-count {
    font-size: 12px;
    color: var(--color-muted);
    margin-top: 2px;
  }

  .empty-results {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--color-success-bg);
    border: 1px solid var(--color-success-border);
    border-radius: var(--radius-xs);
    padding: 12px;
    color: var(--color-ink);
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
    border-right: 1px solid var(--color-hairline);
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
    color: var(--color-muted);
    padding: 8px 12px;
    text-align: left;
    font-family: var(--font-mono);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tbl-select-btn:hover {
    color: var(--color-ink);
    background: var(--color-tab-inactive);
  }

  .tbl-select-btn.selected {
    color: var(--color-primary);
    background: var(--color-success-bg);
    border-color: var(--color-success-border);
  }

  .browser-content {
    flex: 1;
    padding-left: 12px;
    overflow-x: auto;
  }

  .empty-text {
    color: var(--color-muted);
    font-size: 13px;
    padding: 20px;
  }

  .console-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .console-action-btn {
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
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
    background: var(--color-canvas);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .console-action-btn.csv-btn:hover {
    border-color: var(--color-success);
    color: var(--color-success);
  }

  /* Cyber Loading Spinner inside Console */
  .console-loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    gap: 16px;
  }

  .cyber-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid var(--color-hairline);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: console-spin 1s cubic-bezier(0.53, 0.21, 0.29, 0.85) infinite;
    box-shadow: 0 0 15px var(--color-accent-glow);
  }

  @keyframes console-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .loading-pulse-text {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 0.15em;
    animation: text-pulse-glow 1.5s ease-in-out infinite;
  }

  @keyframes text-pulse-glow {
    0%, 100% { opacity: 0.6; text-shadow: 0 0 2px var(--color-accent-glow); }
    50% { opacity: 1; text-shadow: 0 0 10px var(--color-accent-glow); }
  }

  .loading-sub-text {
    font-size: 11px;
    color: var(--color-muted);
  }

  /* Data Table Header Sorting and Pagination styling */
  .th-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .sort-arrow {
    color: var(--color-primary);
    font-size: 10px;
  }

  .sort-arrow-placeholder {
    color: var(--color-muted);
    opacity: 0.3;
    font-size: 10px;
    transition: opacity 0.2s;
  }

  th:hover .sort-arrow-placeholder {
    opacity: 0.8;
  }

  .table-footer-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 4px;
  }

  .pagination-bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pag-btn {
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.2s;
  }

  .pag-btn:hover:not(:disabled) {
    background: var(--color-canvas);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .pag-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pag-info {
    font-family: var(--font-body);
    font-size: 11px;
    color: var(--color-muted);
    font-weight: 500;
  }

  .execution-time-indicator {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: var(--color-muted);
    background: var(--color-editor-bg);
    border: 1px solid var(--color-hairline);
    padding: 2px 6px;
    border-radius: var(--radius-xs);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: 4px;
  }

  /* Visual Analytics styling */
  .visuals-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    animation: visuals-fadeIn 0.2s ease-out;
  }

  .visuals-config-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 10px 14px;
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
  }

  .config-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .config-item label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .config-select {
    background: var(--color-editor-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: 12px;
    padding: 3px 8px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .config-select:focus {
    border-color: var(--color-primary);
  }

  .chart-container {
    flex: 1;
    min-height: 220px;
    background: var(--color-editor-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 16px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .empty-chart-text {
    color: var(--color-muted);
    font-size: 13px;
    text-align: center;
  }

  .analytics-svg {
    max-height: 100%;
    user-select: none;
  }

  .chart-axis-text {
    font-family: var(--font-mono);
    font-size: 8px;
    fill: var(--color-muted);
    font-weight: 500;
  }

  .chart-bar-rect {
    cursor: pointer;
    transition: opacity 0.15s, stroke-width 0.15s;
  }

  .chart-bar-rect:hover {
    opacity: 0.95;
    stroke-width: 2px;
  }

  .chart-point-circle {
    cursor: pointer;
    transition: r 0.15s, stroke-width 0.15s;
  }

  .chart-point-circle:hover {
    r: 6;
    stroke-width: 3px;
  }

  .chart-tooltip-group {
    pointer-events: none;
    animation: visuals-fadeIn 0.1s ease-out;
  }

  @keyframes visuals-fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Visual Diff Split styling (Item 125) */
  .diff-split-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 8px;
    border-radius: var(--radius-xs);
    overflow: hidden;
  }

  .diff-pane {
    display: flex;
    flex-direction: column;
    border: 1px solid transparent;
    border-radius: var(--radius-xs);
    overflow: hidden;
  }

  .expected-pane {
    background: var(--color-success-bg);
    border-color: var(--color-success-border);
  }

  .actual-pane {
    background: var(--color-error-bg);
    border-color: var(--color-error-border);
  }

  .pane-header {
    font-family: var(--font-body);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 3px 8px;
    border-bottom: 1px solid transparent;
  }

  .expected-pane .pane-header {
    color: var(--color-success);
    background: rgba(16, 185, 129, 0.08);
    border-bottom-color: var(--color-success-border);
  }

  .actual-pane .pane-header {
    color: var(--color-error);
    background: rgba(239, 68, 68, 0.08);
    border-bottom-color: var(--color-error-border);
  }

  .pane-code {
    padding: 6px 8px;
    margin: 0;
    font-family: var(--font-mono);
    font-size: 11px;
    overflow-x: auto;
    white-space: pre-wrap;
  }

  .expected-pane .pane-code {
    color: var(--color-success-text);
  }

  .actual-pane .pane-code {
    color: var(--color-error-text);
  }

  /* Executed Code Block styles */
  .executed-code-block {
    background: var(--color-editor-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    animation: visuals-fadeIn 0.25s ease-out;
  }

  .code-block-header {
    display: flex;
    align-items: center;
    background: var(--color-tab-inactive);
    padding: 6px 12px;
    border-bottom: 1px solid var(--color-hairline);
    gap: 6px;
  }

  .header-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .header-dot.red { background: #ef4444; }
  .header-dot.yellow { background: #f59e0b; }
  .header-dot.green { background: #10b981; }

  .header-label {
    margin-left: 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .executed-code-content {
    margin: 0;
    padding: 10px 14px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-ink);
    overflow-x: auto;
    max-height: 120px;
    background: #0f172a; /* Sleek dark terminal background */
  }
  
  .executed-code-content code {
    color: #e2e8f0;
  }

  /* Smart Feedback Box styles */
  .smart-feedback-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 8px;
    padding: 10px 12px;
    background: rgba(59, 130, 246, 0.08); /* Soft blue glow tint */
    border: 1px dashed rgba(59, 130, 246, 0.3);
    border-radius: var(--radius-xs);
    animation: visuals-fadeIn 0.2s ease-out;
  }

  .feedback-icon {
    font-size: 14px;
    line-height: 1.2;
  }

  .feedback-text {
    font-family: var(--font-body);
    font-size: 12px;
    line-height: 1.4;
    color: var(--color-ink);
    font-weight: 500;
    text-align: left;
  }
</style>
