<script>
  import { Database, Table, Key } from 'lucide-svelte';

  let { schema = {}, dbState = {} } = $props();

  let tableList = $derived(Object.keys(schema));

  let viewMode = $state('list'); // 'list' | 'diagram'
  let hoveredTable = $state(null);
  let hoveredColumn = $state(null); // { table, name }

  const relations = [
    { from: 'employees', fromCol: 'dept_id', to: 'departments', toCol: 'dept_id' },
    { from: 'orders', fromCol: 'customer_id', to: 'customers', toCol: 'customer_id' },
    { from: 'orders', fromCol: 'employee_id', to: 'employees', toCol: 'emp_id' },
    { from: 'order_items', fromCol: 'order_id', to: 'orders', toCol: 'order_id' },
    { from: 'order_items', fromCol: 'product_id', to: 'products', toCol: 'product_id' }
  ];

  function isForeignKey(table, column) {
    return relations.some(r => r.from === table && r.fromCol === column);
  }

  function setHoveredKey(table, column) {
    hoveredColumn = { table, name: column };
  }

  function clearHoveredKey() {
    hoveredColumn = null;
  }

  function isMatchingKey(table, column) {
    if (!hoveredColumn) return false;
    
    // Check if it's the hovered key itself
    if (hoveredColumn.table === table && hoveredColumn.name === column) return true;

    // Check relations
    return relations.some(r => {
      if (r.from === hoveredColumn.table && r.fromCol === hoveredColumn.name) {
        return r.to === table && r.toCol === column;
      }
      if (r.to === hoveredColumn.table && r.toCol === hoveredColumn.name) {
        return r.from === table && r.fromCol === column;
      }
      return false;
    });
  }

  function isRelatedTable(table) {
    if (!hoveredTable) return false;
    if (hoveredTable === table) return true;
    return relations.some(r => 
      (r.from === hoveredTable && r.to === table) || 
      (r.to === hoveredTable && r.from === table)
    );
  }

  function getRelationText() {
    if (!hoveredColumn) return "";
    const { table, name } = hoveredColumn;

    // Find relation where this column is 'from' or 'to'
    const rel = relations.find(r => 
      (r.from === table && r.fromCol === name) || 
      (r.to === table && r.toCol === name)
    );

    if (rel) {
      return `${rel.to}.${rel.toCol} ➡️ ${rel.from}.${rel.fromCol}`;
    }
    return "";
  }

  // Visual Schema Modeler: Card positions and drag-and-drop logic
  let cardPositions = $state({});
  let draggingTable = $state(null);
  let dragStartOffset = { x: 0, y: 0 };
  let diagramContainer = $state(null);
  let connectorLines = $state([]);

  function initPositions() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('dojo_erd_positions');
    let pos = {};
    if (saved) {
      try { pos = JSON.parse(saved); } catch (e) {}
    }
    
    tableList.forEach((table, index) => {
      if (!pos[table] || typeof pos[table].x !== 'number') {
        const col = index % 3;
        const row = Math.floor(index / 3);
        pos[table] = {
          x: 20 + col * 230,
          y: 20 + row * 250
        };
      }
    });
    cardPositions = pos;
  }

  function handleMouseDown(event, tableName) {
    if (event.button !== 0) return; // Left click only
    draggingTable = tableName;
    const pos = cardPositions[tableName] || { x: 0, y: 0 };
    dragStartOffset = {
      x: event.clientX - pos.x,
      y: event.clientY - pos.y
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(event) {
    if (!draggingTable) return;
    const pos = cardPositions[draggingTable] || { x: 0, y: 0 };
    cardPositions[draggingTable] = {
      x: event.clientX - dragStartOffset.x,
      y: event.clientY - dragStartOffset.y
    };
  }

  function handleMouseUp() {
    draggingTable = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    localStorage.setItem('dojo_erd_positions', JSON.stringify(cardPositions));
  }

  function handleTouchStart(event, tableName) {
    if (event.touches.length !== 1) return;
    if (event.cancelable) event.preventDefault(); // Prevent page scrolling
    draggingTable = tableName;
    const pos = cardPositions[tableName] || { x: 0, y: 0 };
    const touch = event.touches[0];
    dragStartOffset = {
      x: touch.clientX - pos.x,
      y: touch.clientY - pos.y
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  }

  function handleTouchMove(event) {
    if (!draggingTable || event.touches.length !== 1) return;
    if (event.cancelable) event.preventDefault();
    const touch = event.touches[0];
    cardPositions[draggingTable] = {
      x: touch.clientX - dragStartOffset.x,
      y: touch.clientY - dragStartOffset.y
    };
  }

  function handleTouchEnd() {
    draggingTable = null;
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    localStorage.setItem('dojo_erd_positions', JSON.stringify(cardPositions));
  }

  function updateConnectorLines() {
    if (!diagramContainer) return;
    const containerRect = diagramContainer.getBoundingClientRect();
    
    const lines = [];
    relations.forEach(rel => {
      const fromEl = document.getElementById(`col-node-${rel.from}-${rel.fromCol}`);
      const toEl = document.getElementById(`col-node-${rel.to}-${rel.toCol}`);
      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const fromLeft = fromRect.left - containerRect.left;
        const fromRight = fromRect.right - containerRect.left;
        const toLeft = toRect.left - containerRect.left;
        const toRight = toRect.right - containerRect.left;

        const y1 = (fromRect.top + fromRect.bottom) / 2 - containerRect.top;
        const y2 = (toRect.top + toRect.bottom) / 2 - containerRect.top;

        // Deciding which sides face each other to connect left/right elegantly
        const x1 = fromRight < toLeft ? fromRight : fromLeft;
        const x2 = fromRight < toLeft ? toLeft : toRight;

        lines.push({
          x1, y1, x2, y2,
          fromTable: rel.from,
          fromCol: rel.fromCol,
          toTable: rel.to,
          toCol: rel.toCol
        });
      }
    });
    connectorLines = lines;
  }

  $effect(() => {
    if (tableList.length > 0) {
      initPositions();
    }
  });

  $effect(() => {
    const pos = cardPositions;
    const mode = viewMode;
    const list = tableList;
    const hoverCol = hoveredColumn;

    const frame = requestAnimationFrame(() => {
      updateConnectorLines();
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="schema-browser">
  <div class="title-bar">
    <Database size={16} class="db-icon" />
    <span class="title">Schema Browser</span>
    
    <div class="schema-mode-toggle">
      <button 
        class="schema-toggle-btn" 
        class:active={viewMode === 'list'} 
        onclick={() => viewMode = 'list'}
      >
        List
      </button>
      <button 
        class="schema-toggle-btn" 
        class:active={viewMode === 'diagram'} 
        onclick={() => viewMode = 'diagram'}
      >
        ERD Map
      </button>
    </div>
  </div>

  <div class="content">
    {#if tableList.length === 0}
      <p class="empty-text">No active database tables.</p>
    {:else if viewMode === 'list'}
      <div class="table-list">
        {#each tableList as tableName}
          <div class="table-card">
            <div class="table-header">
              <Table size={14} class="table-icon" />
              <span class="table-name">{tableName}</span>
              {#if dbState[tableName] && dbState[tableName].length > 0}
                <span class="row-count-badge">
                  {dbState[tableName][0].values.length} rows
                </span>
              {/if}
            </div>
            <div class="column-list">
              {#each schema[tableName] as col}
                <div class="column-row">
                  <div class="col-name-group">
                    {#if col.pk}
                      <Key size={10} class="pk-key" />
                    {/if}
                    <span class="col-name" class:pk-name={col.pk}>{col.name}</span>
                  </div>
                  <span class="col-type col-type-{col.type.toLowerCase()}">{col.type}</span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div 
        bind:this={diagramContainer} 
        class="diagram-sandbox" 
        onscroll={updateConnectorLines}
        role="presentation"
      >
        <svg class="diagram-svg-overlay">
          {#each connectorLines as line}
            {@const isHovered = (hoveredColumn && hoveredColumn.table === line.fromTable && hoveredColumn.name === line.fromCol) || (hoveredColumn && hoveredColumn.table === line.toTable && hoveredColumn.name === line.toCol)}
            <path 
              d="M {line.x1} {line.y1} C {(line.x1 + line.x2) / 2} {line.y1}, {(line.x1 + line.x2) / 2} {line.y2}, {line.x2} {line.y2}" 
              fill="none" 
              stroke={isHovered ? 'var(--color-primary)' : 'rgba(59, 130, 246, 0.4)'} 
              stroke-width={isHovered ? '2.5' : '1.5'}
              style="transition: stroke 0.2s, stroke-width 0.2s;"
            />
          {/each}
        </svg>

        {#each tableList as tableName}
          {@const pos = cardPositions[tableName] || { x: 20, y: 20 }}
          <div 
            class="diagram-card draggable-card" 
            style="position: absolute; left: {pos.x}px; top: {pos.y}px; z-index: 10; margin: 0; width: 195px;"
            role="presentation"
            class:highlighted={hoveredTable === tableName || isRelatedTable(tableName)}
            onmouseenter={() => hoveredTable = tableName}
            onmouseleave={() => hoveredTable = null}
          >
            <div 
              class="diagram-card-header drag-handle" 
              onmousedown={(e) => handleMouseDown(e, tableName)}
              ontouchstart={(e) => handleTouchStart(e, tableName)}
              role="presentation"
              style="cursor: grab;"
            >
              <span class="table-name">{tableName}</span>
            </div>
            <div class="diagram-columns">
              {#each schema[tableName] as col}
                <div 
                  id="col-node-{tableName}-{col.name}"
                  class="diagram-col-row"
                  role="presentation"
                  class:is-pk={col.pk}
                  class:is-fk={isForeignKey(tableName, col.name)}
                  class:col-highlighted={hoveredColumn && isMatchingKey(tableName, col.name)}
                  onmouseenter={() => setHoveredKey(tableName, col.name)}
                  onmouseleave={() => clearHoveredKey()}
                >
                  <span class="key-indicator">
                    {#if col.pk}🔑
                    {:else if isForeignKey(tableName, col.name)}🔗
                    {/if}
                  </span>
                  <span class="col-name">{col.name}</span>
                  <span class="col-type">{col.type}</span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      {#if hoveredColumn && getRelationText()}
        <div class="relation-info-panel">
          <span class="relation-badge">RELATIONSHIP</span>
          <p class="relation-desc">
            {getRelationText()}
          </p>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .schema-browser {
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    background: var(--color-card-bg);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .title-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--color-tab-inactive);
    border-bottom: 1px solid var(--color-hairline);
  }

  :global(.db-icon) {
    color: var(--color-primary);
  }

  .title {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-ink);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .empty-text {
    color: var(--color-muted);
    font-size: 13px;
    text-align: center;
    padding: 20px 0;
  }

  .table-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .table-card {
    background: var(--color-editor-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .table-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-tab-inactive);
    border-bottom: 1px solid var(--color-hairline);
  }

  :global(.table-icon) {
    color: #3b82f6;
  }

  .table-name {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-ink);
  }

  .row-count-badge {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-muted);
    background: rgba(100, 116, 139, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: auto;
    font-weight: 500;
  }

  .column-list {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .column-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }

  .col-name-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  :global(.pk-key) {
    color: #eab308;
  }

  .col-name {
    font-family: var(--font-mono);
    color: var(--color-ink);
  }

  .col-name.pk-name {
    color: #eab308;
    font-weight: 500;
  }

  .col-type {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid transparent;
  }

  .col-type-integer {
    background: rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  .col-type-text {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .col-type-real {
    background: rgba(236, 72, 153, 0.08);
    border-color: rgba(236, 72, 153, 0.2);
    color: #ec4899;
  }

  .col-type-null {
    background: rgba(100, 116, 139, 0.08);
    border-color: rgba(100, 116, 139, 0.2);
    color: #64748b;
  }

  /* ERD & Diagram CSS Improvements */
  .schema-mode-toggle {
    display: flex;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    overflow: hidden;
    margin-left: auto;
    background: var(--color-editor-bg);
  }

  .schema-toggle-btn {
    background: transparent;
    border: none;
    padding: 3px 8px;
    font-size: 11px;
    font-family: var(--font-body);
    font-weight: 500;
    color: var(--color-muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .schema-toggle-btn:hover {
    color: var(--color-ink);
    background: rgba(255, 255, 255, 0.05);
  }

  :global(body.theme-light) .schema-toggle-btn:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .schema-toggle-btn.active {
    color: #ffffff;
    background: var(--color-primary);
  }

  .diagram-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .diagram-card {
    background: var(--color-editor-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    transition: all 0.2s ease-in-out;
    opacity: 0.65;
  }

  .diagram-card.highlighted {
    opacity: 1;
    border-color: var(--color-primary);
    box-shadow: 0 0 12px var(--color-accent-glow);
  }

  .diagram-card-header {
    background: var(--color-tab-inactive);
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-hairline);
    text-align: center;
  }

  .diagram-columns {
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .diagram-col-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-family: var(--font-mono);
    padding: 3px 6px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: background 0.15s;
    color: var(--color-ink);
  }

  .diagram-col-row:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  :global(body.theme-light) .diagram-col-row:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .diagram-col-row.col-highlighted {
    background: var(--color-accent-glow);
    color: var(--color-primary);
    font-weight: 700;
  }

  .diagram-col-row.is-pk .col-name {
    color: #eab308;
    font-weight: 700;
  }

  .diagram-col-row.is-fk .col-name {
    color: #3b82f6;
  }

  .key-indicator {
    font-size: 10px;
    width: 12px;
    display: inline-flex;
    justify-content: center;
  }

  .diagram-col-row .col-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .diagram-col-row .col-type {
    font-size: 8px;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .relation-info-panel {
    margin-top: 16px;
    padding: 10px 14px;
    background: var(--color-success-bg);
    border: 1px solid var(--color-success-border);
    border-radius: var(--radius-sm);
    animation: fadeIn 0.2s ease-out;
  }

  .relation-badge {
    font-size: 9px;
    font-weight: 700;
    color: var(--color-success);
    letter-spacing: 0.05em;
    background: rgba(16, 185, 129, 0.1);
    padding: 1px 4px;
    border-radius: 3px;
  }

  .relation-desc {
    margin: 4px 0 0 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-success-text);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .diagram-sandbox {
    position: relative;
    height: 520px;
    overflow: auto;
    background: var(--color-editor-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    user-select: none;
  }

  .diagram-svg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 2000px;
    height: 2000px;
    pointer-events: none;
    z-index: 5;
  }

  .draggable-card {
    transition: box-shadow 0.2s, border-color 0.2s, opacity 0.2s;
    user-select: none;
  }

  .drag-handle {
    user-select: none;
  }

  .drag-handle:active {
    cursor: grabbing !important;
  }
</style>
