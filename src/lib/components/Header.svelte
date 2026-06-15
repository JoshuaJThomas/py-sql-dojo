<script>
  import { language, xp, level, streak, completedChallenges, musicEnabled, musicVolume, ambientTrack } from '../stores/dojo-store.js';
  import { Flame, Trophy, Terminal, Database, Code, RefreshCw, Music, Play, Pause, SkipForward, Volume2 } from 'lucide-svelte';
  import { startAmbientSynth, stopAmbientSynth } from '../utils/soundscapes.js';

  let currentLanguage = $derived($language);
  let currentXp = $derived($xp);
  let currentLevel = $derived($level);
  let currentStreak = $derived($streak);

  // Music state bindings
  let isMusicOn = $derived($musicEnabled);
  let currentTrack = $derived($ambientTrack);
  let volVal = $derived($musicVolume);

  // Compute percentage progress through current level
  let xpInCurrentLevel = $derived(currentXp % 100);
  let xpProgressPercent = $derived(Math.min(xpInCurrentLevel, 100));

  let isXpPulsing = $state(false);
  let prevXp = $state(0);
  let isFirstRun = $state(true);

  // Track panel popover state
  let showMusicPanel = $state(false);

  $effect(() => {
    if (isFirstRun) {
      prevXp = currentXp;
      isFirstRun = false;
      return;
    }
    if (currentXp > prevXp) {
      isXpPulsing = true;
      const timer = setTimeout(() => {
        isXpPulsing = false;
      }, 1000);
      prevXp = currentXp;
      return () => clearTimeout(timer);
    } else {
      prevXp = currentXp;
    }
  });

  // Watch musicEnabled and start/stop audio context loop
  $effect(() => {
    if (isMusicOn) {
      startAmbientSynth();
    } else {
      stopAmbientSynth();
    }
  });

  function toggleMusic() {
    musicEnabled.set(!isMusicOn);
  }

  function nextTrack() {
    const tracks = ['zen', 'lofi', 'synthwave'];
    const idx = tracks.indexOf(currentTrack);
    const nextIdx = (idx + 1) % tracks.length;
    ambientTrack.set(tracks[nextIdx]);
    if (isMusicOn) {
      setTimeout(() => startAmbientSynth(), 50);
    }
  }

  function handleVolumeChange(e) {
    musicVolume.set(Number(e.target.value));
  }

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
      <div class="stat-badge streak-badge" class:has-streak={currentStreak > 0} title="Daily streak">
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
          <div class="xp-bar-fill" class:pulse={isXpPulsing} style="width: {xpProgressPercent}%"></div>
        </div>
      </div>

      <!-- Ambient Music Player (Item 195) -->
      <div class="music-player-widget">
        <button 
          class="music-widget-btn" 
          class:playing={isMusicOn}
          onclick={() => showMusicPanel = !showMusicPanel}
          title="Ambient Backing Tracks"
        >
          <Music size={16} class="music-icon" />
          {#if isMusicOn}
            <span class="music-wave">
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
            </span>
          {/if}
        </button>
        
        {#if showMusicPanel}
          <div class="music-popover" style="border-color: var(--color-hairline);">
            <div class="popover-header">
              <span class="track-label">Ambient Synth</span>
              <span class="track-name">{currentTrack.toUpperCase()}</span>
            </div>
            
            <div class="popover-controls">
              <button class="pop-control-btn" onclick={toggleMusic} title={isMusicOn ? 'Pause' : 'Play'}>
                {#if isMusicOn}
                  <Pause size={12} fill="currentColor" />
                {:else}
                  <Play size={12} fill="currentColor" />
                {/if}
              </button>
              <button class="pop-control-btn" onclick={nextTrack} title="Next Track">
                <SkipForward size={12} fill="currentColor" />
              </button>
            </div>
            
            <div class="popover-volume">
              <Volume2 size={12} class="vol-icon" />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={volVal} 
                oninput={handleVolumeChange}
                class="vol-slider"
              />
            </div>
          </div>
        {/if}
      </div>

      <!-- Settings / Reset -->
      <button class="reset-btn" onclick={resetAllProgress} title="Reset Progress">
        <RefreshCw size={16} />
      </button>
    </div>
  </div>
</header>

<style>
  .music-player-widget {
    position: relative;
    display: flex;
    align-items: center;
  }

  .music-widget-btn {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-md);
    color: var(--color-muted);
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.2s;
    position: relative;
  }

  .music-widget-btn.playing {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: var(--color-accent-glow);
  }

  .music-wave {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 10px;
    margin-left: 2px;
  }

  .wave-bar {
    width: 2px;
    height: 100%;
    background: var(--color-primary);
    animation: bounce-wave 1s ease-in-out infinite alternate;
  }

  .wave-bar:nth-child(2) { height: 60%; animation-delay: 0.15s; }
  .wave-bar:nth-child(3) { height: 80%; animation-delay: 0.3s; }

  @keyframes bounce-wave {
    0% { height: 30%; }
    100% { height: 100%; }
  }

  .music-popover {
    position: absolute;
    top: 46px;
    right: 0;
    width: 160px;
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 200;
  }

  .popover-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
  }

  .track-label {
    font-size: 9px;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .track-name {
    font-size: 12px;
    font-weight: 700;
  }

  .popover-controls {
    display: flex;
    gap: 6px;
  }

  .pop-control-btn {
    flex: 1;
    height: 24px;
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-radius: 4px;
    color: var(--color-ink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pop-control-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .popover-volume {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .vol-icon {
    color: var(--color-muted);
  }

  .vol-slider {
    flex: 1;
    height: 4px;
    background: var(--color-tab-inactive);
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }

  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    background: var(--color-primary);
    border-radius: 50%;
    cursor: pointer;
  }

  .dojo-header {
    background: var(--color-header-bg);
    border-bottom: 1px solid var(--color-hairline);
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
    color: var(--color-ink);
    text-shadow: 0 0 10px var(--color-accent-glow);
  }

  .mono-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-muted);
    letter-spacing: 0.15em;
    margin-top: 2px;
  }

  .mode-selector {
    display: flex;
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-pill);
    padding: 4px;
  }

  .mode-btn {
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-muted);
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
    color: var(--color-ink);
  }

  .mode-btn.active {
    background: var(--color-primary);
    color: var(--color-canvas);
    box-shadow: 0 4px 12px var(--color-accent-glow);
  }

  .stats-panel {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .stat-badge {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-md);
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .streak-badge {
    border-color: rgba(249, 115, 22, 0.25);
    background: rgba(249, 115, 22, 0.05);
  }

  :global(.streak-icon) {
    color: #f97316;
    filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.4));
  }

  .stat-val {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-ink);
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

  :global(.trophy-icon) {
    color: #eab308;
  }

  .level-text {
    font-family: var(--font-mono);
    color: var(--color-ink);
    font-weight: 700;
  }

  .xp-text {
    font-family: var(--font-mono);
    color: var(--color-muted);
  }

  .xp-bar-bg {
    height: 6px;
    background: var(--color-tab-inactive);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .xp-bar-fill {
    height: 100%;
    background: #eab308;
    border-radius: var(--radius-full);
    transition: width 0.3s ease-out;
  }

  .xp-bar-fill.pulse {
    animation: xp-pulse-glow 0.8s ease-out;
  }

  @keyframes xp-pulse-glow {
    0% {
      background: #ffffff;
      box-shadow: 0 0 15px #ffffff, 0 0 30px #eab308;
    }
    50% {
      box-shadow: 0 0 25px #eab308, 0 0 45px #eab308;
    }
    100% {
      background: #eab308;
      box-shadow: none;
    }
  }

  .streak-badge.has-streak {
    border-color: rgba(249, 115, 22, 0.45);
    background: rgba(249, 115, 22, 0.08);
    box-shadow: 0 0 10px rgba(249, 115, 22, 0.15);
  }

  .streak-badge.has-streak :global(.streak-icon) {
    animation: header-flame-pulsing 1.8s infinite ease-in-out;
  }

  @keyframes header-flame-pulsing {
    0% {
      transform: scale(1);
      filter: drop-shadow(0 0 1px rgba(249, 115, 22, 0.4));
    }
    50% {
      transform: scale(1.15);
      filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.9));
    }
    100% {
      transform: scale(1);
      filter: drop-shadow(0 0 1px rgba(249, 115, 22, 0.4));
    }
  }

  .reset-btn {
    background: transparent;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-md);
    color: var(--color-muted);
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

  /* Breakpoint for tablet viewports */
  @media (max-width: 1024px) {
    .header-container {
      height: auto;
      padding: 12px 24px;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
    .stats-panel {
      width: 100%;
      justify-content: center;
      gap: 16px;
    }
  }
</style>
