<script>
  import { Database, Table, Key } from 'lucide-svelte';

  let { schema = {}, dbState = {} } = $props();

  let tableList = $derived(Object.keys(schema));
</script>

<div class="schema-browser">
  <div class="title-bar">
    <Database size={16} class="db-icon" />
    <span class="title">Schema Browser</span>
  </div>

  <div class="content">
    {#if tableList.length === 0}
      <p class="empty-text">No active database tables.</p>
    {:else}
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
    {/if}
  </div>
</div>

<style>
  .schema-browser {
    border: 1px solid #1a1a24;
    border-radius: var(--radius-sm);
    background: #0d0d11;
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
    background: #111116;
    border-bottom: 1px solid #1a1a24;
  }

  :global(.db-icon) {
    color: #10b981;
  }

  .title {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .empty-text {
    color: #64748b;
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
    background: #101015;
    border: 1px solid #1c1c27;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .table-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #14141d;
    border-bottom: 1px solid #1c1c27;
  }

  :global(.table-icon) {
    color: #3b82f6;
  }

  .table-name {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
  }

  .row-count-badge {
    font-size: 10px;
    font-family: var(--font-mono);
    color: #64748b;
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
    color: #cbd5e1;
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
</style>
