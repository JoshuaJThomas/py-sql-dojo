<script>
  import { ShieldAlert, Zap, Cpu, CheckCircle } from 'lucide-svelte';

  let { 
    explainRows = [], // [{id, parent, detail}]
    tableNameList = [], // list of tables in schema
    onExecuteQuery = null // callback to run queries like CREATE INDEX
  } = $props();

  // Parse linear explain rows into a tree structure
  let rootNodes = $derived.by(() => {
    if (explainRows.length === 0) return [];
    
    // Map ids to node objects
    const nodeMap = {};
    explainRows.forEach(row => {
      nodeMap[row.id] = {
        id: row.id,
        parent: row.parent,
        detail: row.detail,
        children: []
      };
    });

    const roots = [];
    explainRows.forEach(row => {
      const node = nodeMap[row.id];
      if (row.parent === 0 || !nodeMap[row.parent]) {
        roots.push(node);
      } else {
        nodeMap[row.parent].children.push(node);
      }
    });

    return roots;
  });

  // Evaluate query plan to find tables scanned and recommend indexes
  let recommendations = $derived.by(() => {
    const recs = [];
    explainRows.forEach(row => {
      const detail = row.detail.toLowerCase();
      if (detail.includes('scan table')) {
        // Find which table is scanned
        const match = row.detail.match(/SCAN TABLE (\w+)/i);
        if (match && match[1]) {
          const tbl = match[1];
          recs.push({
            type: 'warning',
            text: `Full Table Scan detected on "${tbl}". For larger datasets, this causes slow linear searches.`,
            table: tbl,
            suggestion: `Consider creating an index on the columns used in your WHERE or JOIN clauses for table "${tbl}".`
          });
        }
      }
    });
    return recs;
  });

  // Check if detail is a fast path vs slow path
  function getNodeClass(detail) {
    const d = detail.toLowerCase();
    if (d.includes('scan table')) return 'node-scan';
    if (d.includes('using cover') || d.includes('using index')) return 'node-index';
    return 'node-normal';
  }

  // Create mock index to simulate optimizer (Item 163)
  async function simulateCreateIndex(tbl) {
    if (!onExecuteQuery) return;
    const idxName = `idx_${tbl}_custom_${Math.floor(Math.random() * 1000)}`;
    const query = `CREATE INDEX ${idxName} ON ${tbl} (${tableNameList.includes(tbl) ? 'id' : 'customer_id'});`;
    
    const outcome = await onExecuteQuery(query);
    if (outcome.success) {
      alert(`Index successfully created: ${query}\nRe-running explain analyzer...`);
    } else {
      alert("Error building index: " + outcome.error);
    }
  }
</script>

<div class="explain-visualizer-container">
  <div class="explain-header-row">
    <Cpu size={16} class="header-icon" />
    <span>SQLite Query Plan Analyzer</span>
  </div>

  {#if explainRows.length === 0}
    <p class="empty-explain-text">Run a valid SQL SELECT query to analyze its execution plan.</p>
  {:else}
    <!-- Visual Tree Grid -->
    <div class="explain-tree-canvas">
      {#each rootNodes as node}
        <div class="tree-branch">
          <!-- Node box -->
          <div class="explain-node-box {getNodeClass(node.detail)}">
            <div class="node-icon-indicator">
              {#if getNodeClass(node.detail) === 'node-scan'}
                ⚠️
              {:else if getNodeClass(node.detail) === 'node-index'}
                ⚡
              {/if}
            </div>
            <div class="node-details">
              <span class="node-id">Stage ID: {node.id}</span>
              <span class="node-desc">{node.detail}</span>
            </div>
          </div>

          <!-- Children branches recursively -->
          {#if node.children.length > 0}
            <div class="tree-children">
              {#each node.children as child}
                <div class="tree-branch child-branch">
                  <div class="explain-node-box {getNodeClass(child.detail)}">
                    <div class="node-icon-indicator">
                      {#if getNodeClass(child.detail) === 'node-scan'}
                        ⚠️
                      {:else if getNodeClass(child.detail) === 'node-index'}
                        ⚡
                      {/if}
                    </div>
                    <div class="node-details">
                      <span class="node-id">Stage ID: {child.id}</span>
                      <span class="node-desc">{child.detail}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Recommendations area -->
    <div class="recommendations-box">
      <h4>Optimizer Recommendations:</h4>
      {#if recommendations.length === 0}
        <div class="rec-item perfect">
          <CheckCircle size={14} class="rec-icon" />
          <p>Perfect! Query plan is fully optimized. Proper indexes are being utilized for searches.</p>
        </div>
      {:else}
        {#each recommendations as rec}
          <div class="rec-item warning">
            <ShieldAlert size={14} class="rec-icon" />
            <div class="rec-content">
              <span class="rec-warning-text">{rec.text}</span>
              <span class="rec-suggestion">{rec.suggestion}</span>
              {#if onExecuteQuery}
                <button class="opt-btn" onclick={() => simulateCreateIndex(rec.table)}>
                  ⚡ Auto-create Index on {rec.table}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .explain-visualizer-container {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--color-ink);
  }

  .explain-header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--color-hairline);
    padding-bottom: 8px;
  }

  .header-icon {
    color: var(--color-primary);
  }

  .empty-explain-text {
    font-size: 12px;
    color: var(--color-muted);
    font-style: italic;
    text-align: center;
    padding: 20px 0;
  }

  .explain-tree-canvas {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 8px;
    overflow-x: auto;
  }

  .tree-branch {
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
  }

  .tree-children {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: 32px;
    border-left: 2px dashed var(--color-hairline);
    margin-left: 20px;
  }

  .explain-node-box {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    max-width: 480px;
    transition: all 0.2s;
  }

  .explain-node-box.node-scan {
    background: var(--color-error-bg);
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .explain-node-box.node-index {
    background: var(--color-success-bg);
    border-color: var(--color-success);
    color: var(--color-success);
  }

  .explain-node-box.node-normal {
    background: var(--color-tab-inactive);
  }

  .node-icon-indicator {
    font-size: 16px;
  }

  .node-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .node-id {
    font-family: var(--font-mono);
    font-size: 10px;
    opacity: 0.6;
  }

  .node-desc {
    font-size: 12px;
    font-weight: 600;
  }

  /* Recommendations */
  .recommendations-box {
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .recommendations-box h4 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .rec-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
  }

  .rec-item.perfect {
    background: var(--color-success-bg);
    border: 1px solid var(--color-success);
    color: var(--color-success);
  }

  .rec-item.warning {
    background: var(--color-error-bg);
    border: 1px solid var(--color-error);
    color: var(--color-error);
  }

  .rec-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .rec-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .rec-warning-text {
    font-weight: 700;
  }

  .rec-suggestion {
    opacity: 0.85;
  }

  .opt-btn {
    align-self: flex-start;
    height: 24px;
    background: var(--color-primary);
    border: none;
    color: var(--color-canvas);
    font-size: 10px;
    font-weight: 700;
    padding: 0 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .opt-btn:hover {
    opacity: 0.9;
  }
</style>
