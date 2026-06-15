<script>
  import { Edit2, Trash2, Plus, Check, X, Search, PlusCircle, Terminal, HelpCircle } from 'lucide-svelte';

  let { 
    tableName = '', 
    columns = [], 
    rows = [], 
    onExecuteQuery = null 
  } = $props();

  // State
  let searchQuery = $state('');
  let editingRowIndex = $state(null);
  let editFormValues = $state({});
  let insertFormValues = $state({});
  let showInsertRow = $state(false);
  
  // Add column form
  let showAddCol = $state(false);
  let newColName = $state('');
  let newColType = $state('TEXT');

  let executionLogs = $state([]); // Generated query statement log history

  // Auto-detect primary key column (id-based names like employee_id, customer_id, dept_id, etc. or first column)
  let primaryKeyCol = $derived.by(() => {
    if (columns.length === 0) return null;
    const keyCandidates = columns.filter(col => col.toLowerCase().endsWith('_id') || col.toLowerCase() === 'id');
    return keyCandidates.length > 0 ? keyCandidates[0] : columns[0];
  });

  // Filter rows based on search query
  let filteredRows = $derived.by(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(row => 
      row.some(cell => cell !== null && String(cell).toLowerCase().includes(q))
    );
  });

  // Start editing a row
  function startEditing(rowIndex, rowData) {
    editingRowIndex = rowIndex;
    editFormValues = {};
    columns.forEach((col, idx) => {
      editFormValues[col] = rowData[idx];
    });
  }

  // Cancel edit
  function cancelEditing() {
    editingRowIndex = null;
    editFormValues = {};
  }

  // Helper to format values for SQL queries (strings vs numbers vs nulls)
  function formatSqlVal(val) {
    if (val === null || val === undefined || String(val).trim() === '' || String(val).toUpperCase() === 'NULL') {
      return 'NULL';
    }
    const strVal = String(val).trim();
    
    // If it starts with 0 and has length > 1 (excluding decimals like 0.5), preserve as string (e.g., ZIP code, padded ID)
    if (strVal.startsWith('0') && strVal.length > 1 && !strVal.startsWith('0.')) {
      return `'${strVal.replace(/'/g, "''")}'`;
    }
    
    // Strict numeric check (integer or float)
    const isStrictNumeric = /^-?\d+(\.\d+)?$/.test(strVal);
    if (isStrictNumeric) {
      return Number(strVal);
    }
    
    // Escape single quotes and return as string literal
    return `'${strVal.replace(/'/g, "''")}'`;
  }

  // Save changes (UPDATE)
  async function saveRow(rowIndex) {
    if (!onExecuteQuery) return;
    const origRow = rows[rowIndex];
    const pkIdx = columns.indexOf(primaryKeyCol);
    const pkVal = origRow[pkIdx];

    // Generate SET terms
    const setTerms = [];
    columns.forEach(col => {
      const formatted = formatSqlVal(editFormValues[col]);
      setTerms.push(`"${col.replace(/"/g, '""')}" = ${formatted}`);
    });

    const escapedPkCol = `"${primaryKeyCol.replace(/"/g, '""')}"`;
    const whereClause = pkVal !== null && pkVal !== undefined
      ? `${escapedPkCol} = ${formatSqlVal(pkVal)}`
      : columns.map((col, idx) => `"${col.replace(/"/g, '""')}" IS ${formatSqlVal(origRow[idx])}`).join(' AND ');

    const query = `UPDATE "${tableName.replace(/"/g, '""')}" SET ${setTerms.join(', ')} WHERE ${whereClause};`;
    
    addLog(query);
    const outcome = await onExecuteQuery(query);
    if (outcome.success) {
      editingRowIndex = null;
    } else {
      alert("Error saving row: " + outcome.error);
    }
  }

  // Delete row (DELETE)
  async function deleteRow(rowIndex) {
    if (!confirm("Are you sure you want to delete this row from table " + tableName + "?")) return;
    if (!onExecuteQuery) return;
    const row = rows[rowIndex];
    const pkIdx = columns.indexOf(primaryKeyCol);
    const pkVal = row[pkIdx];

    const escapedPkCol = `"${primaryKeyCol.replace(/"/g, '""')}"`;
    const whereClause = pkVal !== null && pkVal !== undefined
      ? `${escapedPkCol} = ${formatSqlVal(pkVal)}`
      : columns.map((col, idx) => `"${col.replace(/"/g, '""')}" IS ${formatSqlVal(row[idx])}`).join(' AND ');

    const query = `DELETE FROM "${tableName.replace(/"/g, '""')}" WHERE ${whereClause};`;
    
    addLog(query);
    const outcome = await onExecuteQuery(query);
    if (!outcome.success) {
      alert("Error deleting row: " + outcome.error);
    }
  }

  // Insert row (INSERT)
  async function insertRow() {
    if (!onExecuteQuery) return;
    const insertCols = [];
    const insertVals = [];

    columns.forEach(col => {
      const val = insertFormValues[col];
      if (val !== undefined && String(val).trim() !== '') {
        insertCols.push(`"${col.replace(/"/g, '""')}"`);
        insertVals.push(formatSqlVal(val));
      }
    });

    if (insertCols.length === 0) {
      alert("Please enter at least one column value.");
      return;
    }

    const query = `INSERT INTO "${tableName.replace(/"/g, '""')}" (${insertCols.join(', ')}) VALUES (${insertVals.join(', ')});`;
    
    addLog(query);
    const outcome = await onExecuteQuery(query);
    if (outcome.success) {
      showInsertRow = false;
      insertFormValues = {};
    } else {
      alert("Error inserting row: " + outcome.error);
    }
  }

  // Add column (ALTER TABLE)
  async function addColumn() {
    if (!newColName.trim()) {
      alert("Please enter a column name.");
      return;
    }
    if (!onExecuteQuery) return;
    const query = `ALTER TABLE "${tableName.replace(/"/g, '""')}" ADD COLUMN "${newColName.trim().replace(/"/g, '""')}" ${newColType};`;
    
    addLog(query);
    const outcome = await onExecuteQuery(query);
    if (outcome.success) {
      showAddCol = false;
      newColName = '';
    } else {
      alert("Error adding column: " + outcome.error);
    }
  }

  function addLog(sqlText) {
    executionLogs.unshift({
      time: new Date().toLocaleTimeString(),
      sql: sqlText
    });
    if (executionLogs.length > 5) {
      executionLogs = executionLogs.slice(0, 5);
    }
  }
</script>

<div class="table-editor-container">
  <!-- Top Bar Filters & Insertion Controls -->
  <div class="editor-top-bar">
    <div class="search-box">
      <Search size={14} class="search-icon" />
      <input 
        type="text" 
        placeholder="Filter table rows..." 
        bind:value={searchQuery} 
        class="filter-input"
      />
      {#if searchQuery}
        <button class="clear-search-btn" onclick={() => searchQuery = ''}>
          <X size={12} />
        </button>
      {/if}
    </div>

    <div class="action-buttons-group">
      <button 
        class="action-btn-gui outline-btn" 
        onclick={() => showAddCol = !showAddCol}
        class:active={showAddCol}
      >
        <PlusCircle size={12} />
        <span>Add Column</span>
      </button>
      <button 
        class="action-btn-gui fill-btn" 
        onclick={() => { showInsertRow = !showInsertRow; cancelEditing(); }}
        class:active={showInsertRow}
      >
        <Plus size={12} />
        <span>Insert Row</span>
      </button>
    </div>
  </div>

  <!-- Alter Table Column Panel -->
  {#if showAddCol}
    <div class="add-col-panel">
      <span class="panel-tag">ALTER TABLE ADD COLUMN</span>
      <div class="form-row">
        <input 
          type="text" 
          placeholder="New column name..." 
          bind:value={newColName} 
          class="gui-input"
        />
        <select bind:value={newColType} class="gui-select">
          <option value="TEXT">TEXT</option>
          <option value="INTEGER">INTEGER</option>
          <option value="REAL">REAL</option>
          <option value="NUMERIC">NUMERIC</option>
        </select>
        <button class="gui-form-btn apply" onclick={addColumn}>Add</button>
        <button class="gui-form-btn cancel" onclick={() => showAddCol = false}>Cancel</button>
      </div>
    </div>
  {/if}

  <!-- Insert New Row Form -->
  {#if showInsertRow}
    <div class="insert-row-panel">
      <span class="panel-tag">INSERT INTO {tableName}</span>
      <div class="insert-inputs-grid">
        {#each columns as col}
          <div class="input-field-group">
            <label for="ins-field-{col}">{col}</label>
            <input 
              id="ins-field-{col}"
              type="text" 
              placeholder={col === primaryKeyCol ? 'AUTO/PK' : 'NULL'} 
              bind:value={insertFormValues[col]} 
              class="gui-input"
            />
          </div>
        {/each}
      </div>
      <div class="form-actions">
        <button class="gui-form-btn apply" onclick={insertRow}>Execute Insert</button>
        <button class="gui-form-btn cancel" onclick={() => showInsertRow = false}>Cancel</button>
      </div>
    </div>
  {/if}

  <!-- Main Grid view -->
  <div class="table-editor-grid-wrapper">
    {#if filteredRows.length === 0}
      <div class="empty-rows-message">
        <HelpCircle size={24} class="empty-icon" />
        <p>No rows found matching filter query.</p>
      </div>
    {:else}
      <table class="editor-grid">
        <thead>
          <tr>
            <th class="actions-header">Actions</th>
            {#each columns as col}
              <th class:pk-col={col === primaryKeyCol}>
                <div class="th-cell">
                  {#if col === primaryKeyCol}
                    <span class="pk-badge" title="Detected identifier key">🔑</span>
                  {/if}
                  <span>{col}</span>
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each filteredRows as row, idx}
            {@const globalIdx = rows.indexOf(row)}
            <tr class:editing={editingRowIndex === globalIdx}>
              <!-- Action column -->
              <td class="action-cell">
                {#if editingRowIndex === globalIdx}
                  <div class="action-edit-group">
                    <button class="grid-act-btn save" onclick={() => saveRow(globalIdx)} title="Save changes">
                      <Check size={14} />
                    </button>
                    <button class="grid-act-btn cancel" onclick={cancelEditing} title="Cancel editing">
                      <X size={14} />
                    </button>
                  </div>
                {:else}
                  <div class="action-edit-group">
                    <button class="grid-act-btn edit" onclick={() => startEditing(globalIdx, row)} title="Edit row">
                      <Edit2 size={14} />
                    </button>
                    <button class="grid-act-btn delete" onclick={() => deleteRow(globalIdx)} title="Delete row">
                      <Trash2 size={14} />
                    </button>
                  </div>
                {/if}
              </td>

              <!-- Value cells -->
              {#each columns as col, colIdx}
                <td>
                  {#if editingRowIndex === globalIdx}
                    <input 
                      type="text" 
                      bind:value={editFormValues[col]} 
                      class="grid-inline-input"
                    />
                  {:else}
                    <span class="cell-text-value" class:null-value={row[colIdx] === null}>
                      {row[colIdx] === null ? 'NULL' : row[colIdx]}
                    </span>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- Generated SQL Statements Console Logs -->
  {#if executionLogs.length > 0}
    <div class="editor-logs-panel">
      <div class="logs-header">
        <Terminal size={12} class="log-icon" />
        <span>Generated SQL Mutation Log:</span>
      </div>
      <div class="logs-list">
        {#each executionLogs as log}
          <div class="log-line">
            <span class="log-time">[{log.time}]</span>
            <code class="log-query">{log.sql}</code>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .table-editor-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    color: var(--color-ink);
  }

  .editor-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 400px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-muted);
  }

  .filter-input {
    width: 100%;
    height: 36px;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    color: var(--color-ink);
    padding: 0 36px;
    font-size: 13px;
    outline: none;
    transition: all 0.2s;
  }

  .filter-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
  }

  .clear-search-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--color-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-buttons-group {
    display: flex;
    gap: 8px;
  }

  .action-btn-gui {
    height: 36px;
    padding: 0 14px;
    border-radius: var(--radius-xs);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }

  .action-btn-gui.outline-btn {
    background: transparent;
    border: 1px solid var(--color-hairline);
    color: var(--color-muted);
  }

  .action-btn-gui.outline-btn:hover,
  .action-btn-gui.outline-btn.active {
    color: var(--color-ink);
    border-color: var(--color-card-border);
    background: var(--color-tab-inactive);
  }

  .action-btn-gui.fill-btn {
    background: var(--color-primary);
    border: 1px solid var(--color-primary);
    color: var(--color-canvas);
  }

  .action-btn-gui.fill-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Sub Panels */
  .add-col-panel, .insert-row-panel {
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }

  .panel-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-primary);
    font-weight: bold;
    letter-spacing: 0.05em;
  }

  .form-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .gui-input {
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    font-size: 13px;
    height: 32px;
    padding: 0 10px;
    border-radius: 6px;
    outline: none;
  }

  .gui-input:focus {
    border-color: var(--color-primary);
  }

  .gui-select {
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    font-size: 12px;
    height: 32px;
    padding: 0 8px;
    border-radius: 6px;
  }

  .gui-form-btn {
    height: 32px;
    padding: 0 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .gui-form-btn.apply {
    background: var(--color-primary);
    color: var(--color-canvas);
  }

  .gui-form-btn.apply:hover {
    opacity: 0.9;
  }

  .gui-form-btn.cancel {
    background: transparent;
    color: var(--color-muted);
    border: 1px solid var(--color-hairline);
  }

  .gui-form-btn.cancel:hover {
    background: rgba(0,0,0,0.02);
  }

  .insert-inputs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }

  .input-field-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .input-field-group label {
    font-size: 10px;
    color: var(--color-muted);
    font-family: var(--font-mono);
  }

  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  /* Grid Table wrapper */
  .table-editor-grid-wrapper {
    flex: 1;
    overflow: auto;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    background: var(--color-canvas);
  }

  .empty-rows-message {
    padding: 40px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: var(--color-muted);
  }

  .empty-icon {
    margin-bottom: 8px;
  }

  .editor-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .editor-grid th, .editor-grid td {
    border: 1px solid var(--color-hairline);
    padding: 10px 14px;
    text-align: left;
    white-space: nowrap;
  }

  /* Truncation on mobile/tablet viewports to prevent wide horizontal scrolling */
  @media (max-width: 768px) {
    .editor-grid td {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .editor-grid th {
    background: var(--color-tab-inactive);
    color: var(--color-muted);
    font-weight: bold;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .pk-col {
    color: var(--color-primary);
  }

  .th-cell {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pk-badge {
    font-size: 10px;
  }

  .actions-header {
    width: 100px;
    text-align: center !important;
  }

  .action-cell {
    text-align: center !important;
  }

  .action-edit-group {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .grid-act-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-hairline);
    background: var(--color-card-bg);
    color: var(--color-muted);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .grid-act-btn:hover {
    color: var(--color-ink);
    border-color: var(--color-card-border);
    transform: scale(1.05);
  }

  .grid-act-btn.save:hover {
    background: var(--color-success-bg);
    color: var(--color-success);
    border-color: var(--color-success);
  }

  .grid-act-btn.delete:hover {
    background: var(--color-error-bg);
    color: var(--color-error);
    border-color: var(--color-error);
  }

  .grid-inline-input {
    background: var(--color-canvas);
    border: 1px solid var(--color-primary);
    color: var(--color-ink);
    font-size: 13px;
    padding: 4px 8px;
    width: 100%;
    outline: none;
    border-radius: 4px;
  }

  .cell-text-value.null-value {
    color: var(--color-muted);
    font-style: italic;
    opacity: 0.6;
  }

  /* Generated Mutation log */
  .editor-logs-panel {
    background: var(--color-header-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 8px 12px;
    flex-shrink: 0;
  }

  .logs-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
    margin-bottom: 6px;
  }

  .logs-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .log-line {
    font-family: var(--font-mono);
    font-size: 11px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .log-time {
    color: var(--color-muted);
    flex-shrink: 0;
  }

  .log-query {
    color: var(--color-primary);
    word-break: break-all;
    white-space: pre-wrap;
  }

  /* Mobile and Tablet optimization rules */
  @media (max-width: 768px) {
    .filter-input {
      height: 44px;
      font-size: 14px;
      padding: 0 40px;
    }
    
    .search-icon {
      left: 14px;
    }

    .action-btn-gui {
      height: 44px;
      font-size: 14px;
      padding: 0 16px;
    }

    .gui-input, .gui-select, .gui-form-btn {
      height: 44px;
      font-size: 14px;
      border-radius: 8px;
    }

    .add-col-panel .form-row {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .add-col-panel .form-row > * {
      width: 100%;
    }

    .grid-act-btn {
      width: 44px;
      height: 44px;
      border-radius: 8px;
    }

    .grid-act-btn :global(svg) {
      width: 16px !important;
      height: 16px !important;
    }

    .editor-grid th, .editor-grid td {
      padding: 12px 16px;
    }
  }
</style>
