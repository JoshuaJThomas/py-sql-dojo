<script>
  import { ShieldAlert, Zap, Cpu, CheckCircle } from 'lucide-svelte';

  let { 
    explainRows = [], // [{id, parent, detail}]
    tableNameList = [], // list of tables in schema
    onExecuteQuery = null, // callback to run queries like CREATE INDEX
    sqlQuery = '' // the active SQL query (Item 151)
  } = $props();

  // Simple regex column extractor for index recommendations (Item 151)
  function getSuggestedColumns(sql, table) {
    if (!sql) return ['id'];
    const lowerSql = sql.toLowerCase().replace(/\s+/g, ' ');
    const lowerTable = table.toLowerCase();
    
    const suggested = new Set();
    
    // 1. Try to find JOIN conditions: ON t1.col = t2.col or similar
    const joinOnMatches = lowerSql.matchAll(/on\s+([\w.]+)\s*=\s*([\w.]+)/g);
    for (const match of joinOnMatches) {
      const p1 = match[1];
      const p2 = match[2];
      
      if (p1.startsWith(lowerTable + '.')) {
        suggested.add(p1.split('.')[1]);
      } else if (!p1.includes('.') && (lowerSql.includes(`join ${lowerTable}`) || lowerSql.includes(`from ${lowerTable}`))) {
        if (isNaN(p1) && !p1.startsWith("'") && !p1.startsWith('"')) suggested.add(p1);
      }
      
      if (p2.startsWith(lowerTable + '.')) {
        suggested.add(p2.split('.')[1]);
      } else if (!p2.includes('.') && (lowerSql.includes(`join ${lowerTable}`) || lowerSql.includes(`from ${lowerTable}`))) {
        if (isNaN(p2) && !p2.startsWith("'") && !p2.startsWith('"')) suggested.add(p2);
      }
    }
    
    // 2. Try to find WHERE conditions
    const whereMatch = lowerSql.match(/where\s+(.+?)(?:group\s+by|order\s+by|limit|$)/);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const operators = ['=', '<', '>', '!=', '<=', '>=', '\\s+like\\s+', '\\s+in\\s+', '\\s+is\\s+'];
      operators.forEach(op => {
        const regex = new RegExp(`(?:([\\w.]+)\\s*${op})|(?:${op}\\s*([\\w.]+))`, 'g');
        const matches = whereClause.matchAll(regex);
        for (const match of matches) {
          const col = match[1] || match[2];
          if (col) {
            const cleanCol = col.trim();
            if (cleanCol.startsWith(lowerTable + '.')) {
              suggested.add(cleanCol.split('.')[1]);
            } else if (!cleanCol.includes('.') && isNaN(cleanCol) && !cleanCol.startsWith("'") && !cleanCol.startsWith('"')) {
              suggested.add(cleanCol);
            }
          }
        }
      });
    }

    // 3. Try to find GROUP BY columns
    const groupByMatch = lowerSql.match(/group\s+by\s+(.+?)(?:order\s+by|limit|$)/);
    if (groupByMatch) {
      const cols = groupByMatch[1].split(',');
      cols.forEach(col => {
        const cleanCol = col.trim();
        if (cleanCol.startsWith(lowerTable + '.')) {
          suggested.add(cleanCol.split('.')[1]);
        } else if (!cleanCol.includes('.') && isNaN(cleanCol) && !cleanCol.startsWith("'") && !cleanCol.startsWith('"')) {
          suggested.add(cleanCol);
        }
      });
    }
    
    const validCols = Array.from(suggested).filter(c => {
      return c && c !== 'null' && c !== 'true' && c !== 'false' && /^[a-z_][a-z0-9_]*$/.test(c);
    });
    
    return validCols.length > 0 ? validCols : ['id'];
  }

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

  // Estimated CPU Execution Cost profiling functions
  function estimateStageCost(detail) {
    const d = detail.toLowerCase();
    let score = 10; // base minimum cost
    
    if (d.includes('correlated')) {
      score += 70;
    }
    if (d.includes('scan table')) {
      score += 50;
    }
    if (d.includes('temp b-tree') || d.includes('sorting')) {
      score += 35;
    }
    if (d.includes('scan subquery')) {
      score += 25;
    }
    if (d.includes('search table')) {
      if (d.includes('covering index')) {
        score += 2;
      } else if (d.includes('index')) {
        score += 5;
      } else {
        score += 15;
      }
    }
    if (d.includes('compound subqueries')) {
      score += 40;
    }
    
    return score;
  }

  let totalCostScore = $derived.by(() => {
    let sum = 0;
    explainRows.forEach(row => {
      sum += estimateStageCost(row.detail);
    });
    return sum || 1;
  });

  function getCostColor(detail) {
    const score = estimateStageCost(detail);
    const pct = (score / totalCostScore) * 100;
    if (pct >= 40) return 'var(--color-error)';
    if (pct >= 15) return 'var(--color-warning)';
    return 'var(--color-success)';
  }

  // Evaluate query plan to find tables scanned and recommend indexes (Item 151)
  let recommendations = $derived.by(() => {
    const recs = [];
    explainRows.forEach(row => {
      const detail = row.detail.toLowerCase();
      if (detail.includes('scan table')) {
        // Find which table is scanned
        const match = row.detail.match(/SCAN TABLE (\w+)/i);
        if (match && match[1]) {
          const tbl = match[1];
          const cols = getSuggestedColumns(sqlQuery, tbl);
          const colsStr = cols.join(', ');
          
          recs.push({
            type: 'warning',
            text: `Full Table Scan detected on "${tbl}". For larger datasets, this causes slow linear searches.`,
            table: tbl,
            columns: cols,
            suggestion: `Consider creating an index on column(s) "${colsStr}" for table "${tbl}" to optimize this lookup path.`
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

  // Create composite/column index dynamically based on suggestions (Item 152)
  async function simulateCreateIndex(tbl, columns) {
    if (!onExecuteQuery || !columns || columns.length === 0) return;
    const colsStr = columns.join(', ');
    const colsSlug = columns.join('_');
    const idxName = `idx_${tbl}_${colsSlug}_${Math.floor(Math.random() * 1000)}`;
    const query = `CREATE INDEX ${idxName} ON ${tbl} (${colsStr});`;
    
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
    <!-- Svelte 5 Recursive Snippet for Explain Plan Tree Node -->
    {#snippet renderNode(node)}
      <div class="tree-branch">
        <div class="explain-node-box {getNodeClass(node.detail)}">
          <div class="node-icon-indicator">
            {#if getNodeClass(node.detail) === 'node-scan'}
              ⚠️
            {:else if getNodeClass(node.detail) === 'node-index'}
              ⚡
            {:else}
              ⚙️
            {/if}
          </div>
          <div class="node-details" style="flex: 1; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span class="node-id font-mono">Stage ID: {node.id}</span>
              <span class="node-cost-badge font-mono" style="color: {getCostColor(node.detail)}; font-weight: 700; font-size: 10px;">
                CPU: {Math.round((estimateStageCost(node.detail) / totalCostScore) * 100)}%
              </span>
            </div>
            <span class="node-desc">{node.detail}</span>
            
            <!-- CPU Cost Bar -->
            <div class="node-cost-bar-bg">
              <div 
                class="node-cost-bar-fill" 
                style="
                  width: {Math.round((estimateStageCost(node.detail) / totalCostScore) * 100)}%;
                  background-color: {getCostColor(node.detail)};
                  box-shadow: 0 0 6px {getCostColor(node.detail)}30;
                "
              ></div>
            </div>
          </div>
        </div>

        {#if node.children.length > 0}
          <div class="tree-children">
            {#each node.children as child}
              {@render renderNode(child)}
            {/each}
          </div>
        {/if}
      </div>
    {/snippet}

    <!-- Visual Tree Grid -->
    <div class="explain-tree-canvas">
      {#each rootNodes as root}
        {@render renderNode(root)}
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
                <button class="opt-btn" onclick={() => simulateCreateIndex(rec.table, rec.columns)}>
                  ⚡ Auto-create Index on {rec.table} ({rec.columns.join(', ')})
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

  /* CPU Cost Progress Bar Styling */
  .node-cost-bar-bg {
    background: rgba(255, 255, 255, 0.06);
    height: 4px;
    border-radius: var(--radius-pill);
    margin-top: 6px;
    overflow: hidden;
    width: 100%;
  }

  .node-cost-bar-fill {
    height: 100%;
    border-radius: var(--radius-pill);
    transition: width 0.3s ease;
  }
</style>
