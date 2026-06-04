<script>
  import { language, xp, level, streak, completedChallenges } from '../stores/dojo-store.js';
  import { Flame, Trophy, Terminal, Database, Code, RefreshCw } from 'lucide-svelte';

  let currentLanguage = $derived($language);
  let currentXp = $derived($xp);
  let currentLevel = $derived($level);
  let currentStreak = $derived($streak);

  // Compute percentage progress through current level
  let xpInCurrentLevel = $derived(currentXp % 100);
  let xpProgressPercent = $derived(Math.min(xpInCurrentLevel, 100));

  function setLang(lang) {
    language.set(lang);
  }

  function resetAllProgress() {
    if (confirm("Are you sure you want to reset all your coding progress, XP, and streak? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  }
</script>

<header class="dojo-header">
  <div class="header-container">
    <!-- Brand -->
    <div class="brand">
      <span class="cyber-glow-text">GEMINI · DOJO</span>
      <span class="mono-tag">PY / SQL PLAYGROUND</span>
    </div>

    <!-- Mode Selector -->
    <div class="mode-selector">
      <button 
        class="mode-btn" 
        class:active={currentLanguage === 'python'} 
        onclick={() => setLang('python')}
      >
        <Code size={16} class="icon-spacing" />
        <span>Python Dojo</span>
      </button>
      <button 
        class="mode-btn" 
        class:active={currentLanguage === 'sql'} 
        onclick={() => setLang('sql')}
      >
        <Database size={16} class="icon-spacing" />
        <span>SQL Dojo</span>
      </button>
    </div>

    <!-- Right Stats Panel -->
    <div class="stats-panel">
      <!-- Streak -->
      <div class="stat-badge streak-badge" title="Daily streak">
        <Flame size={18} class="streak-icon" />
        <span class="stat-val">{currentStreak}</span>
      </div>

      <!-- Level & XP -->
      <div class="xp-container">
        <div class="xp-header">
          <Trophy size={16} class="trophy-icon" />
          <span class="level-text">Lvl {currentLevel}</span>
          <span class="xp-text">{xpInCurrentLevel}/100 XP</span>
        </div>
        <div class="xp-bar-bg">
          <div class="xp-bar-fill" style="width: {xpProgressPercent}%"></div>
        </div>
      </div>

      <!-- Settings / Reset -->
      <button class="reset-btn" onclick={resetAllProgress} title="Reset Progress">
        <RefreshCw size={16} />
      </button>
    </div>
  </div>
</header>

<style>
  .dojo-header {
    background: #0d0d11;
    border-bottom: 1px solid #1a1a24;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand {
    display: flex;
    flex-direction: column;
  }

  .cyber-glow-text {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #ffffff;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
  }

  .mono-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: #64748b;
    letter-spacing: 0.15em;
    margin-top: 2px;
  }

  .mode-selector {
    display: flex;
    background: #111116;
    border: 1px solid #1d1d29;
    border-radius: var(--radius-pill);
    padding: 4px;
  }

  .mode-btn {
    background: transparent;
    border: none;
    outline: none;
    color: #94a3b8;
    padding: 8px 18px;
    border-radius: var(--radius-pill);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mode-btn :global(.icon-spacing) {
    margin-right: 8px;
  }

  .mode-btn:hover {
    color: #ffffff;
  }

  .mode-btn.active {
    background: #10b981;
    color: #000000;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .stats-panel {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .stat-badge {
    background: #111116;
    border: 1px solid #1d1d29;
    border-radius: var(--radius-md);
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .streak-badge {
    border-color: rgba(249, 115, 22, 0.2);
    background: rgba(249, 115, 22, 0.05);
  }

  .streak-icon {
    color: #f97316;
    filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.4));
  }

  .stat-val {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
  }

  .xp-container {
    display: flex;
    flex-direction: column;
    width: 140px;
  }

  .xp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    margin-bottom: 4px;
  }

  .trophy-icon {
    color: #eab308;
  }

  .level-text {
    font-family: var(--font-mono);
    color: #ffffff;
    font-weight: 700;
  }

  .xp-text {
    font-family: var(--font-mono);
    color: #64748b;
  }

  .xp-bar-bg {
    height: 6px;
    background: #1a1a24;
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .xp-bar-fill {
    height: 100%;
    background: #eab308;
    border-radius: var(--radius-full);
    transition: width 0.3s ease-out;
  }

  .reset-btn {
    background: transparent;
    border: 1px solid #1a1a24;
    border-radius: var(--radius-md);
    color: #64748b;
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.05);
  }
</style>
