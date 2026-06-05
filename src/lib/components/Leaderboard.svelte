<script>
  import { onMount, untrack } from 'svelte';
  import { xp, level, completedChallenges } from '../stores/dojo-store.js';
  import { Trophy, Shield, MessageSquare, Clock, Zap, Star, ShieldCheck } from 'lucide-svelte';

  let userXp = $derived($xp);
  let userLevel = $derived($level);
  let completedList = $derived($completedChallenges);

  // States
  let competitors = $state([]);
  let tournamentHours = $state(162); // Simulated countdown hours remaining
  let tournamentMinutes = $state(48);
  let activeHoverBot = $state(null);
  let selectedTier = $state('Gold League');

  // Bot configuration
  const botBases = [
    { name: 'Alice_Pandas', title: 'Pandas Queen', avatar: '👩‍💻', baseSkill: 0.9, chat: 'Pandas groupby is my favorite construct!' },
    { name: 'Bob_SQL', title: 'SQL Joiner', avatar: '👨‍💻', baseSkill: 0.7, chat: 'Just optimized my 5-way join!' },
    { name: 'Charlie_NumPy', title: 'NumPy Wizard', avatar: '🧙‍♂️', baseSkill: 1.1, chat: 'Vectorized calculations run so fast.' },
    { name: 'Diana_ML', title: 'ML Hacker', avatar: '👩‍🔬', baseSkill: 1.2, chat: 'My SVM convergence took only 12ms.' },
    { name: 'Ethan_CTE', title: 'CTE Master', avatar: '👨‍💼', baseSkill: 0.8, chat: 'CTEs make queries look like poetry.' },
    { name: 'Fiona_Opt', title: 'Optimizer', avatar: '👩‍💼', baseSkill: 1.0, chat: 'Always index your foreign keys!' },
    { name: 'George_Clean', title: 'Data Janitor', avatar: '🧹', baseSkill: 0.6, chat: 'Cleaning NaN rows is honest work.' },
    { name: 'Hannah_SVM', title: 'SVM Ninja', avatar: '🥷', baseSkill: 1.15, chat: 'Hyperplane separation achieved.' },
    { name: 'Ian_Matrix', title: 'Matrix Multiplier', avatar: '🤖', baseSkill: 0.95, chat: 'Dot products are easy in numpy.' }
  ];

  onMount(() => {
    loadLeaderboard();
    
    // Countdown timer
    const interval = setInterval(() => {
      if (tournamentMinutes > 0) {
        tournamentMinutes--;
      } else {
        tournamentMinutes = 59;
        if (tournamentHours > 0) {
          tournamentHours--;
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  });

  function loadLeaderboard() {
    const key = 'dojo_leaderboard_bots';
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        competitors = JSON.parse(saved);
        // Sync user stats
        updateUserScore();
        return;
      } catch (e) {}
    }

    // Initialize bot scores
    competitors = botBases.map((bot, idx) => {
      // bots around user score
      const botXp = Math.floor(100 + bot.baseSkill * 150 + Math.random() * 200);
      return {
        ...bot,
        xp: botXp,
        level: Math.floor(botXp / 100) + 1,
        badgesCount: Math.floor(bot.baseSkill * 3) + 1,
        completions: Math.floor(botXp / 25),
        isUser: false
      };
    });

    // Add user placeholder
    competitors.push({
      name: 'You (Dojo Apprentice)',
      title: 'Active Student',
      avatar: '🥋',
      xp: userXp,
      level: userLevel,
      badgesCount: 0,
      completions: completedList.length,
      chat: 'Training hard!',
      isUser: true
    });

    saveLeaderboard();
  }

  function updateUserScore() {
    let updated = false;
    competitors = competitors.map(c => {
      if (c.isUser) {
        updated = true;
        return {
          ...c,
          xp: userXp,
          level: userLevel,
          completions: completedList.length
        };
      }
      return c;
    });

    if (!updated) {
      competitors.push({
        name: 'You (Dojo Apprentice)',
        title: 'Active Student',
        avatar: '🥋',
        xp: userXp,
        level: userLevel,
        badgesCount: 0,
        completions: completedList.length,
        chat: 'Training hard!',
        isUser: true
      });
    }

    // Dynamic XP drift for bots to simulate live completions
    competitors = competitors.map(c => {
      if (!c.isUser && Math.random() < 0.15) {
        const addedXp = Math.floor(Math.random() * 20) + 5;
        const newXp = c.xp + addedXp;
        return {
          ...c,
          xp: newXp,
          level: Math.floor(newXp / 100) + 1,
          completions: c.completions + 1
        };
      }
      return c;
    });

    saveLeaderboard();
  }

  function saveLeaderboard() {
    localStorage.setItem('dojo_leaderboard_bots', JSON.stringify(competitors));
  }

  // Sort competitors by XP descending
  let sortedList = $derived(
    [...competitors].sort((a, b) => b.xp - a.xp)
  );

  let userPosition = $derived(
    sortedList.findIndex(c => c.isUser) + 1
  );

  let leagueTierColor = $derived.by(() => {
    if (selectedTier.includes('Bronze')) return '#b45309';
    if (selectedTier.includes('Silver')) return '#94a3b8';
    if (selectedTier.includes('Gold')) return '#fbbf24';
    if (selectedTier.includes('Emerald')) return '#10b981';
    return '#3b82f6'; // Diamond
  });

  // Re-run user score sync whenever user XP updates
  $effect(() => {
    const currentScore = userXp;
    const completedCount = completedList.length;
    untrack(() => {
      if (competitors.length > 0) {
        updateUserScore();
      }
    });
  });
</script>

<div class="leaderboard-container">
  <!-- Top League Tier Bar -->
  <div class="league-tier-header" style="border-color: {leagueTierColor}40;">
    <div class="league-info">
      <Shield size={18} style="color: {leagueTierColor};" />
      <select bind:value={selectedTier} class="tier-select" style="color: {leagueTierColor};">
        <option value="Bronze League">Bronze League</option>
        <option value="Silver League">Silver League</option>
        <option value="Gold League" selected>Gold League</option>
        <option value="Emerald League">Emerald League</option>
        <option value="Diamond League">Diamond League</option>
      </select>
    </div>

    <div class="tournament-timer">
      <Clock size={12} class="timer-icon" />
      <span>Ends in: {tournamentHours}h {tournamentMinutes}m</span>
    </div>
  </div>

  <div class="leaderboard-grid-wrapper">
    <div class="leaderboard-list">
      {#each sortedList as item, index}
        <div 
          class="leaderboard-row" 
          class:user-row={item.isUser}
          onmouseenter={() => activeHoverBot = item}
          onmouseleave={() => activeHoverBot = null}
          role="presentation"
        >
          <div class="row-rank">
            {#if index === 0}
              👑
            {:else if index === 1}
              🥈
            {:else if index === 2}
              🥉
            {:else}
              {index + 1}
            {/if}
          </div>

          <div class="row-avatar">{item.avatar}</div>

          <div class="row-main">
            <span class="row-name">{item.name}</span>
            <span class="row-title">{item.title}</span>
          </div>

          <div class="row-level">LVL {item.level}</div>

          <div class="row-score">
            <Zap size={11} class="score-icon" />
            <span>{item.xp} XP</span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Right Side Hover Card detail -->
    <div class="leaderboard-hover-panel">
      {#if activeHoverBot}
        <div class="bot-hover-card" style="border-color: var(--color-primary)30;">
          <div class="bot-card-glow"></div>
          <div class="bot-card-avatar">{activeHoverBot.avatar}</div>
          <h4>{activeHoverBot.name}</h4>
          <span class="bot-card-title">{activeHoverBot.title}</span>
          
          <div class="bot-stats-grid">
            <div class="bot-stat">
              <span class="val">{activeHoverBot.level}</span>
              <span class="lbl">Dojo Level</span>
            </div>
            <div class="bot-stat">
              <span class="val">{activeHoverBot.completions}</span>
              <span class="lbl">Solved</span>
            </div>
            <div class="bot-stat">
              <span class="val">{activeHoverBot.badgesCount || 1}</span>
              <span class="lbl">Badges</span>
            </div>
          </div>

          {#if activeHoverBot.chat}
            <div class="bot-chat-bubble">
              <MessageSquare size={12} class="chat-icon-left" />
              <p>"{activeHoverBot.chat}"</p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="hover-tip-card">
          <Trophy size={24} class="tip-icon" />
          <h4>League Standings</h4>
          <p>You are currently in position #{userPosition} out of 10.</p>
          <p class="small-tip">Hover over competitors to inspect their profile badges and weekly status stats.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .leaderboard-container {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--color-ink);
  }

  .league-tier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--color-hairline);
    background: var(--color-tab-inactive);
    padding: 8px 16px;
    border-radius: var(--radius-xs);
    flex-shrink: 0;
  }

  .league-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tier-select {
    background: transparent;
    border: none;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    outline: none;
  }

  .tier-select option {
    background: var(--color-card-bg);
    color: var(--color-ink);
  }

  .tournament-timer {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-muted);
    font-weight: 600;
  }

  .timer-icon {
    color: var(--color-primary);
  }

  /* Grid Layout */
  .leaderboard-grid-wrapper {
    display: grid;
    grid-template-columns: 1.8fr 1.2fr;
    gap: 16px;
    height: 380px;
    overflow: hidden;
  }

  @media (max-width: 600px) {
    .leaderboard-grid-wrapper {
      grid-template-columns: 1fr;
      height: auto;
      overflow: visible;
    }
  }

  .leaderboard-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 6px;
  }

  .leaderboard-row {
    background: var(--color-tab-inactive);
    border: 1px solid transparent;
    border-radius: var(--radius-xs);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .leaderboard-row:hover {
    background: var(--color-canvas);
    border-color: var(--color-hairline);
    transform: translateX(4px);
  }

  .leaderboard-row.user-row {
    background: rgba(16, 185, 129, 0.04);
    border: 1px solid var(--color-primary);
  }

  .row-rank {
    width: 24px;
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 12px;
    text-align: center;
  }

  .row-avatar {
    font-size: 16px;
  }

  .row-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .row-name {
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-title {
    font-size: 10px;
    color: var(--color-muted);
  }

  .row-level {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    background: var(--color-hairline);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--color-muted);
  }

  .row-score {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-primary);
  }

  .score-icon {
    fill: currentColor;
  }

  /* Hover Panel */
  .leaderboard-hover-panel {
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .bot-hover-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }

  .bot-card-avatar {
    font-size: 40px;
    margin-bottom: 8px;
  }

  .bot-hover-card h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
  }

  .bot-card-title {
    font-size: 11px;
    color: var(--color-muted);
    margin-bottom: 16px;
  }

  .bot-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    width: 100%;
    gap: 8px;
    border-top: 1px solid var(--color-hairline);
    border-bottom: 1px solid var(--color-hairline);
    padding: 12px 0;
    margin-bottom: 16px;
  }

  .bot-stat {
    display: flex;
    flex-direction: column;
  }

  .bot-stat .val {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: bold;
    color: var(--color-primary);
  }

  .bot-stat .lbl {
    font-size: 9px;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .bot-chat-bubble {
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 8px 12px;
    position: relative;
    font-size: 11px;
    line-height: 1.4;
    font-style: italic;
    color: var(--color-muted);
  }

  .chat-icon-left {
    position: absolute;
    top: -6px;
    left: 12px;
    color: var(--color-hairline);
    fill: var(--color-tab-inactive);
  }

  .bot-chat-bubble p {
    margin: 0;
  }

  .hover-tip-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: var(--color-muted);
    gap: 8px;
  }

  .tip-icon {
    color: var(--color-primary);
    margin-bottom: 8px;
  }

  .hover-tip-card h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-ink);
  }

  .hover-tip-card p {
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
  }

  .small-tip {
    font-size: 10px !important;
    opacity: 0.8;
  }
</style>
