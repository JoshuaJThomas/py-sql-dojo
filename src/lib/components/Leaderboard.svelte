<script>
  import { onMount, untrack } from 'svelte';
  import { xp, level, completedChallenges, inventory } from '../stores/dojo-store.js';
  import { Trophy, Shield, MessageSquare, Clock, Zap, Star, ShieldCheck } from 'lucide-svelte';
  import { playSuccessChime, playLevelUpFanfare, playErrorBuzz } from '../utils/soundscapes.js';

  let userXp = $derived($xp);
  let userLevel = $derived($level);
  let completedList = $derived($completedChallenges);

  // Constants for league difficulty bases
  const LEAGUE_XP_BASES = {
    'Bronze League': 150,
    'Silver League': 400,
    'Gold League': 800,
    'Emerald League': 1400,
    'Diamond League': 2200
  };

  // States
  let competitors = $state([]);
  let tournamentHours = $state(162); // Simulated countdown hours remaining
  let tournamentMinutes = $state(48);
  let activeHoverBot = $state(null);
  
  // Load user league tier from localStorage (defaulting to Bronze)
  const savedUserLeague = typeof window !== 'undefined' ? localStorage.getItem('dojo_user_league') || 'Bronze League' : 'Bronze League';
  let selectedTier = $state(savedUserLeague);

  // Promotion/Conclude states
  let showPromotionModal = $state(false);
  let showConfetti = $state(false);
  let promotionResult = $state({
    rank: 1,
    promoted: false,
    rewardXp: 0,
    oldLeague: 'Gold League',
    newLeague: 'Emerald League'
  });

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
        } else {
          // Timer ended
          concludeTournament();
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  });

  // Get localized leaderboard key based on active tier
  function getLeaderboardKey() {
    return `dojo_leaderboard_bots_${selectedTier}`;
  }

  function loadLeaderboard() {
    const key = getLeaderboardKey();
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        competitors = JSON.parse(saved);
        // Sync user stats
        updateUserScore();
        return;
      } catch (e) {}
    }

    // Initialize bot scores based on league difficulty base
    const leagueBase = LEAGUE_XP_BASES[selectedTier] || 150;
    competitors = botBases.map((bot) => {
      const botXp = Math.floor(leagueBase + bot.baseSkill * (leagueBase * 0.4) + Math.random() * (leagueBase * 0.25));
      return {
        ...bot,
        xp: botXp,
        level: Math.floor(botXp / 100) + 1,
        badgesCount: Math.floor(bot.baseSkill * 3) + 1,
        completions: Math.floor(botXp / 25),
        isUser: false
      };
    });

    // Add user
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
    localStorage.setItem(getLeaderboardKey(), JSON.stringify(competitors));
  }

  // Conclude Tournament & Claim Rewards (Weekly Tournament Rewards)
  function concludeTournament() {
    const pos = userPosition;
    const currentLeague = selectedTier;
    let promoted = false;
    let rewardXp = 0;
    let newLeague = currentLeague;

    const leaguesList = [
      'Bronze League',
      'Silver League',
      'Gold League',
      'Emerald League',
      'Diamond League'
    ];

    const currentIdx = leaguesList.indexOf(currentLeague);

    // Determine rewards & promotion
    if (pos <= 3) {
      promoted = true;
      if (pos === 1) rewardXp = 300;
      else if (pos === 2) rewardXp = 200;
      else if (pos === 3) rewardXp = 100;
      
      // Advance to next league
      if (currentIdx !== -1 && currentIdx < leaguesList.length - 1) {
        newLeague = leaguesList[currentIdx + 1];
        localStorage.setItem('dojo_user_league', newLeague);
      }
    } else {
      promoted = false;
      rewardXp = 20; // Consolation prize
    }

    // Award XP
    xp.update(val => val + rewardXp);

    promotionResult = {
      rank: pos,
      promoted,
      rewardXp,
      oldLeague: currentLeague,
      newLeague
    };

    // Update active tier select box
    selectedTier = newLeague;
    showPromotionModal = true;
    
    // Play sounds & trigger confetti
    if (promoted) {
      playLevelUpFanfare();
      showConfetti = true;
      setTimeout(() => {
        showConfetti = false;
      }, 3500);
    } else {
      playErrorBuzz();
    }
    
    // Reset timer
    tournamentHours = 168; // 7 days
    tournamentMinutes = 0;
    
    // Reset scores for all bots in the new league
    const leagueBase = LEAGUE_XP_BASES[newLeague] || 150;
    competitors = botBases.map((bot) => {
      const botXp = Math.floor(leagueBase + bot.baseSkill * (leagueBase * 0.4) + Math.random() * (leagueBase * 0.25));
      return {
        ...bot,
        xp: botXp,
        level: Math.floor(botXp / 100) + 1,
        badgesCount: Math.floor(bot.baseSkill * 3) + 1,
        completions: Math.floor(botXp / 25),
        isUser: false
      };
    });

    // Add user back
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

  // Reload leaderboard whenever user switches tier selection
  $effect(() => {
    const activeTier = selectedTier;
    untrack(() => {
      loadLeaderboard();
    });
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

    <div style="display: flex; align-items: center; gap: 12px;">
      <div class="tournament-timer">
        <Clock size={12} class="timer-icon" />
        <span>Ends in: {tournamentHours}h {tournamentMinutes}m</span>
      </div>
      <button onclick={concludeTournament} class="ff-btn" title="End current season and calculate promotions/rewards">
        End Season
      </button>
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
            <span class="row-name">
              {item.name}
              {#if item.isUser && $inventory.hasLeaderboardFlair}
                <span class="crown-flair" title="Dojo Master Crown">👑</span>
              {/if}
            </span>
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

{#if showPromotionModal}
  <div class="promotion-modal-overlay">
    <div class="promotion-modal-card">
      <div class="modal-glow" style="background: radial-gradient(circle, {leagueTierColor}30 0%, transparent 70%);"></div>
      
      {#if showConfetti}
        <div class="local-confetti-container">
          {#each Array(60) as _, i}
            <div 
              class="local-confetti-particle" 
              style="
                --x: {Math.random() * 100}%;
                --delay: {Math.random() * 1.2}s;
                --color: {['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5]};
                --rotation: {Math.random() * 360}deg;
                --drift: {Math.random() * 40 - 20}%;
              "
            ></div>
          {/each}
        </div>
      {/if}

      <div class="modal-header">
        <div class="modal-trophy-icon" style="color: {leagueTierColor};">
          <Trophy size={48} />
        </div>
        <h2>Season Concluded!</h2>
        <p class="subtitle">Weekly Tournament Results</p>
      </div>

      <div class="modal-body">
        <div class="result-stats-grid">
          <div class="result-stat-box">
            <span class="stat-lbl">Final Rank</span>
            <span class="stat-val font-mono">#{promotionResult.rank}</span>
          </div>
          <div class="result-stat-box">
            <span class="stat-lbl">XP Earned</span>
            <span class="stat-val font-mono" style="color: var(--color-primary);">+{promotionResult.rewardXp} XP</span>
          </div>
        </div>

        <div class="league-advance-box">
          {#if promotionResult.promoted}
            <div class="promo-badge">PROMOTED</div>
            <div class="league-advance">
              <span class="old-league">{promotionResult.oldLeague}</span>
              <span class="arrow">→</span>
              <span class="new-league" style="color: {leagueTierColor}; font-weight: 800;">{promotionResult.newLeague}</span>
            </div>
            <p class="congrats-text">Congratulations! You finished in the top 3 and secured your promotion to the next league.</p>
          {:else}
            <div class="promo-badge non-promoted">RETAINED</div>
            <div class="league-advance">
              <span class="current-league">{promotionResult.oldLeague}</span>
            </div>
            <p class="congrats-text">Keep training! Finish in the top 3 next week to promote to the next league.</p>
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button onclick={() => { showPromotionModal = false; }} class="claim-btn">
          Claim Rewards & Continue
        </button>
      </div>
    </div>
  </div>
{/if}

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

  .crown-flair {
    display: inline-block;
    margin-left: 4px;
    filter: drop-shadow(0 0 4px #eab308);
    animation: crown-pulse 2s infinite ease-in-out;
  }

  @keyframes crown-pulse {
    0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 2px #eab308); }
    50% { transform: scale(1.15) rotate(5deg); filter: drop-shadow(0 0 6px #fbbf24); }
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

  /* End Season button styled like a Cohere premium button */
  .ff-btn {
    background: transparent;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 700;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ff-btn:hover {
    background: var(--color-primary);
    color: var(--color-canvas);
    box-shadow: 0 0 12px var(--color-primary);
    text-shadow: none;
  }

  /* Promotion Modal Overlay */
  .promotion-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(9, 9, 12, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
  }

  /* Promotion Modal Card */
  .promotion-modal-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--radius-md);
    padding: 32px;
    width: 90%;
    max-width: 460px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .modal-glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    z-index: 0;
    pointer-events: none;
  }

  .modal-header, .modal-body, .modal-footer {
    position: relative;
    z-index: 1;
    width: 100%;
  }

  .modal-header h2 {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 800;
    margin: 12px 0 4px 0;
    color: var(--color-ink);
  }

  .modal-header .subtitle {
    font-size: 12px;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 24px 0;
  }

  .modal-trophy-icon {
    animation: trophy-bounce 2s infinite ease-in-out;
    filter: drop-shadow(0 0 15px currentColor);
  }

  @keyframes trophy-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-8px) scale(1.05); }
  }

  /* Result Stats Grid */
  .result-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
    width: 100%;
  }

  .result-stat-box {
    background: var(--color-tab-inactive);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-xs);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-lbl {
    font-size: 10px;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-val {
    font-size: 20px;
    font-weight: 800;
  }

  /* League Advance Box */
  .league-advance-box {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 20px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .promo-badge {
    background: var(--color-primary);
    color: var(--color-canvas);
    font-size: 10px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    letter-spacing: 0.1em;
    box-shadow: 0 0 8px var(--color-primary);
  }

  .promo-badge.non-promoted {
    background: var(--color-muted);
    color: var(--color-canvas);
    box-shadow: none;
  }

  .league-advance {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
  }

  .league-advance .arrow {
    color: var(--color-muted);
  }

  .congrats-text {
    font-size: 12px;
    color: var(--color-muted);
    margin: 0;
    line-height: 1.4;
    max-width: 320px;
  }

  /* Claim button */
  .claim-btn {
    background: var(--color-primary);
    border: none;
    color: var(--color-canvas);
    width: 100%;
    padding: 12px;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
  }

  .claim-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }

  .claim-btn:active {
    transform: translateY(0);
  }

  /* Animation keyframes */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  /* Confetti Styles locally */
  .local-confetti-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    z-index: 10;
  }

  .local-confetti-particle {
    position: absolute;
    top: -10px;
    width: 6px;
    height: 12px;
    background: var(--color);
    opacity: 0.8;
    transform: rotate(var(--rotation));
    animation: local-confetti-fall 3s var(--delay) linear forwards;
  }

  @keyframes local-confetti-fall {
    0% {
      top: -10px;
      left: var(--x);
      transform: rotate(var(--rotation)) translateY(0);
    }
    100% {
      top: 100%;
      left: calc(var(--x) + var(--drift));
      transform: rotate(calc(var(--rotation) + 360deg)) translateY(0);
      opacity: 0;
    }
  }
</style>
