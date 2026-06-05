<script>
  import { onMount } from 'svelte';
  import { 
    completedChallenges, 
    completionDates,
    xp, 
    level, 
    streak, 
    language, 
    pythonChallengeIndex, 
    sqlChallengeIndex,
    theme,
    soundEnabled,
    inventory,
    unlockedBadges,
    userPythonCode,
    userSqlCode,
    generateSignature,
    updateSignature,
    starredChallenges
  } from '../stores/dojo-store.js';
  import { pythonExercises } from '../data/python-exercises.js';
  import { sqlExercises } from '../data/sql-exercises.js';
  
  // Subcomponents
  import Analytics from './Analytics.svelte';
  import DojoForge from './DojoForge.svelte';
  import Leaderboard from './Leaderboard.svelte';

  import { 
    Trophy, Flame, CheckCircle, Circle, Play, BookOpen, Star, 
    Shield, Zap, Settings, Download, Upload, Volume2, VolumeX, 
    Lock, Unlock, Trash2, Search, X, Code, Database
  } from 'lucide-svelte';

  let { onOpenSandbox } = $props();

  let currentLang = $derived($language);
  let completedList = $derived($completedChallenges);
  let starredList = $derived($starredChallenges || []);
  let currentXp = $derived($xp);
  let currentLevel = $derived($level);
  let currentStreak = $derived($streak);
  let datesMap = $derived($completionDates || {});
  let activeInventory = $derived($inventory);

  // Custom challenges list
  let customList = $state([]);

  // Searching & Filtering States
  let searchQuery = $state('');
  let selectedDifficulty = $state('all'); // 'all' | 'easy' | 'medium' | 'hard'
  let selectedStatus = $state('all'); // 'all' | 'completed' | 'incomplete'
  let selectedTopic = $state('all');

  // Daily quest goal progress (Item 122)
  let dailyXpEarned = $state(0);
  const dailyXpGoal = 50;

  onMount(() => {
    const todayStr = new Date().toDateString();
    const lastXpDate = localStorage.getItem('dojo_last_xp_date');
    if (lastXpDate === todayStr) {
      dailyXpEarned = Number(localStorage.getItem('dojo_daily_xp_earned') || '0');
    } else {
      dailyXpEarned = 0;
    }
    refreshCustomChallenges();
  });

  function refreshCustomChallenges() {
    const saved = localStorage.getItem('dojo_custom_challenges') || '[]';
    try {
      customList = JSON.parse(saved);
    } catch (e) {
      customList = [];
    }
  }

  function toggleStar(cId) {
    starredChallenges.update(list => {
      if (list.includes(cId)) {
        return list.filter(id => id !== cId);
      } else {
        return [...list, cId];
      }
    });
  }

  // Topic Tags list based on current active language (Item 121)
  let popularTopics = $derived.by(() => {
    if (currentLang === 'python') {
      return [
        { id: 'all', label: 'All Topics' },
        { id: 'basics', label: 'Basics' },
        { id: 'loops', label: 'Loops & Logic' },
        { id: 'lists', label: 'Lists & Strings' },
        { id: 'numpy', label: 'NumPy' },
        { id: 'pandas', label: 'Pandas' },
        { id: 'sklearn', label: 'Scikit-Learn' }
      ];
    } else {
      return [
        { id: 'all', label: 'All Topics' },
        { id: 'SELECT', label: 'SELECT Basics' },
        { id: 'WHERE', label: 'Filtering (WHERE)' },
        { id: 'joins', label: 'Joins' },
        { id: 'subqueries', label: 'Subqueries' },
        { id: 'ctes', label: 'CTEs' },
        { id: 'Window Functions', label: 'Window Functions' }
      ];
    }
  });

  // Reset topic filter when language transitions to prevent cross-language mismatch
  $effect(() => {
    const lang = currentLang;
    selectedTopic = 'all';
  });

  function matchesTopicTag(ex, topicTag) {
    if (topicTag === 'all') return true;
    const topic = ex.topic.toLowerCase();
    const title = ex.title.toLowerCase();
    
    if (topicTag === 'basics') {
      return topic.includes('basics') || topic.includes('operator') || topic.includes('division') || topic.includes('math');
    }
    if (topicTag === 'loops') {
      return topic.includes('loop');
    }
    if (topicTag === 'lists') {
      return topic.includes('list') || topic.includes('string') || topic.includes('formatting') || topic.includes('expression');
    }
    if (topicTag === 'numpy') {
      return topic.includes('numpy') || topic.includes('array');
    }
    if (topicTag === 'pandas') {
      return topic.includes('pandas') || topic.includes('dataframe') || topic.includes('series');
    }
    if (topicTag === 'sklearn') {
      return topic.includes('sklearn') || topic.includes('regression') || topic.includes('svm') || topic.includes('knn') || topic.includes('model') || topic.includes('pca') || topic.includes('cluster');
    }
    if (topicTag === 'joins') {
      return topic.includes('join');
    }
    if (topicTag === 'subqueries') {
      return topic.includes('subquer') || topic.includes('exists');
    }
    if (topicTag === 'ctes') {
      return topic.includes('cte');
    }
    
    return topic.includes(topicTag.toLowerCase()) || title.includes(topicTag.toLowerCase());
  }

  // Control Center tab state
  let activeControlTab = $state('achievements'); // 'achievements' | 'shop' | 'settings'

  let unlockedList = $derived($unlockedBadges);

  // Badge configuration
  const allBadgesList = [
    { id: 'first-blood', name: 'First Blood', desc: 'Complete your first challenge in the Dojo.', icon: Trophy, color: '#f59e0b' },
    { id: 'pythonista', name: 'Pythonista', desc: 'Complete at least 10 Python challenges.', icon: Code, color: '#3b82f6' },
    { id: 'sql-maestro', name: 'SQL Maestro', desc: 'Complete at least 10 SQL challenges.', icon: Database, color: '#10b981' },
    { id: 'ml-pioneer', name: 'ML Pioneer', desc: 'Complete at least 5 NumPy/Pandas challenges.', icon: Star, color: '#8b5cf6' },
    { id: 'svm-champion', name: 'SVM Champion', desc: 'Complete the SVM model training challenge.', icon: Shield, color: '#ec4899' },
    { id: 'dedicated-scholar', name: 'Dedicated Scholar', desc: 'Maintain a daily streak of 3 days or more.', icon: Flame, color: '#f97316' },
    { id: 'level-5-mastery', name: 'Level 5 Mastery', desc: 'Reach Mastery Level 5 or higher.', icon: Trophy, color: '#eab308' }
  ];

  // Filtered exercises computed properties
  let filteredPythonExercises = $derived(
    [...pythonExercises, ...customList.filter(c => c.language === 'python')].filter(ex => {
      const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ex.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty;
      const isCompleted = completedList.includes(ex.id);
      const matchesStatus = selectedStatus === 'all' || 
                            (selectedStatus === 'completed' && isCompleted) || 
                            (selectedStatus === 'incomplete' && !isCompleted) ||
                            (selectedStatus === 'starred' && starredList.includes(ex.id));
      const matchesTopic = matchesTopicTag(ex, selectedTopic);
      return matchesSearch && matchesDifficulty && matchesStatus && matchesTopic;
    })
  );

  let filteredSqlExercises = $derived(
    [...sqlExercises, ...customList.filter(c => c.language === 'sql')].filter(ex => {
      const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ex.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty;
      const isCompleted = completedList.includes(ex.id);
      const matchesStatus = selectedStatus === 'all' || 
                            (selectedStatus === 'completed' && isCompleted) || 
                            (selectedStatus === 'incomplete' && !isCompleted) ||
                            (selectedStatus === 'starred' && starredList.includes(ex.id));
      const matchesTopic = matchesTopicTag(ex, selectedTopic);
      return matchesSearch && matchesDifficulty && matchesStatus && matchesTopic;
    })
  );

  // Group challenges by chapter
  let pythonChapters = $derived(
    filteredPythonExercises.reduce((acc, current) => {
      const ch = current.chapter;
      if (!acc[ch]) acc[ch] = [];
      acc[ch].push(current);
      return acc;
    }, {})
  );

  let sqlChapters = $derived(
    filteredSqlExercises.reduce((acc, current) => {
      const ch = current.chapter;
      if (!acc[ch]) acc[ch] = [];
      acc[ch].push(current);
      return acc;
    }, {})
  );

  function getChapterName(chNum, lang) {
    if (lang === 'python') {
      if (chNum === 1) return "Python Crash Course";
      if (chNum === 2) return "NumPy Essentials";
      if (chNum === 3) return "Pandas Data Analysis";
      if (chNum === 4) return "Matplotlib Visualizations";
      if (chNum === 5) return "Seaborn Styling";
      if (chNum === 6) return "Data Analysis Capstone";
      if (chNum === 8) return "Linear Regression Models";
      if (chNum === 9) return "Feature Engineering";
      if (chNum === 10) return "Model Validation & Tuning";
      if (chNum === 11) return "Logistic Regression Models";
      if (chNum === 12) return "K-Nearest Neighbors";
      if (chNum === 13) return "Support Vector Machines";
      if (chNum === 14) return "Decision Tree Models";
      if (chNum === 15) return "Random Forest Ensembles";
      if (chNum === 18) return "Naive Bayes & NLP";
      if (chNum === 20) return "K-Means Clustering";
      if (chNum === 22) return "DBSCAN Clustering";
      if (chNum === 23) return "Principal Component Analysis";
      return `Chapter ${chNum}`;
    } else {
      if (chNum === 1) return "Basic Queries (SELECT, WHERE)";
      if (chNum === 2) return "Sorting & Wildcards (ORDER BY, LIKE)";
      if (chNum === 3) return "Aggregations & Grouping (GROUP BY, HAVING)";
      if (chNum === 4) return "Joining Tables (INNER, LEFT)";
      if (chNum === 5) return "Advanced Queries (Subqueries, Multi-Joins)";
      if (chNum === 6) return "Complex Capstone Practice";
      if (chNum === 7) return "E-Commerce Schema & Filtering";
      if (chNum === 8) return "Sales Joins & Quantities";
      if (chNum === 9) return "HAVING & Calculated Fields";
      if (chNum === 10) return "NULL Handling & Left Joins";
      if (chNum === 11) return "Subqueries & Unique Item Counts";
      if (chNum === 12) return "Correlated Subqueries";
      if (chNum === 13) return "Common Table Expressions (CTEs)";
      if (chNum === 14) return "Conditional CASE Statements";
      if (chNum === 15) return "Nested Subqueries (EXISTS)";
      if (chNum === 16) return "String Wildcards & Concatenation";
      if (chNum === 17) return "Date Operations & Self Joins";
      if (chNum === 18) return "Window Functions & Ranking";
      return `SQL Step ${chNum}`;
    }
  }

  function startChallenge(id, lang) {
    language.set(lang);
    if (lang === 'python') {
      const idx = pythonExercises.findIndex(ex => ex.id === id);
      if (idx !== -1) {
        pythonChallengeIndex.set(idx);
      }
    } else {
      const idx = sqlExercises.findIndex(ex => ex.id === id);
      if (idx !== -1) {
        sqlChallengeIndex.set(idx);
      }
    }
  }

  // Simple calendar grid for mock/real progress heatmap (last 28 days)
  let last28Days = $derived(
    Array.from({ length: 28 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (27 - i));
      return d;
    })
  );

  // Count real challenge completions per day for heatmap colors
  function getHeatmapColor(date) {
    const targetStr = date.toDateString();
    let count = 0;
    
    // Count how many keys (challenges) have this date value
    Object.keys(datesMap).forEach(id => {
      if (datesMap[id] === targetStr) {
        count++;
      }
    });

    if (count === 0) return '';
    if (count === 1) return 'active-low';
    if (count === 2) return 'active-med';
    return 'active-high';
  }

  function getHeatmapCount(date) {
    const targetStr = date.toDateString();
    let count = 0;
    Object.keys(datesMap).forEach(id => {
      if (datesMap[id] === targetStr) count++;
    });
    return count;
  }

  // Shop purchase item logic
  function buyItem(itemType, cost) {
    const currentXpVal = $xp;
    if (currentXpVal < cost) {
      alert("Insufficient XP! Train on more challenges to earn XP.");
      return;
    }
    
    // Check if they already own it (for permanent items)
    const invVal = $inventory;
    if (itemType === 'wizard' && invVal.unlockedPersonas?.includes('wizard')) {
      alert("You already unlocked the SQL Wizard Mentor!");
      return;
    }
    if (itemType === 'flair' && invVal.hasLeaderboardFlair) {
      alert("You already unlocked the Dojo Crown Flair!");
      return;
    }
    if (itemType === 'cheats' && invVal.advancedCheatsUnlocked) {
      alert("You already unlocked the Advanced Cheats Pack!");
      return;
    }

    xp.set(currentXpVal - cost);
    inventory.update(inv => {
      if (itemType === 'shield') {
        inv.streakFreezes = (inv.streakFreezes || 0) + 1;
      } else if (itemType === 'boost') {
        inv.xpBoosts = (inv.xpBoosts || 0) + 1;
      } else if (itemType === 'wizard') {
        inv.unlockedPersonas = [...(inv.unlockedPersonas || []), 'wizard'];
      } else if (itemType === 'flair') {
        inv.hasLeaderboardFlair = true;
      } else if (itemType === 'cheats') {
        inv.advancedCheatsUnlocked = true;
      }
      return inv;
    });

    let itemName = '';
    if (itemType === 'shield') itemName = 'Streak Freeze Shield';
    else if (itemType === 'boost') itemName = 'XP Double Booster';
    else if (itemType === 'wizard') itemName = 'SQL Wizard Mentor';
    else if (itemType === 'flair') itemName = 'Dojo Crown Flair';
    else if (itemType === 'cheats') itemName = 'Advanced Cheats Pack';

    alert(`Successfully purchased ${itemName} for ${cost} XP!`);
  }

  // Backup Schema Validator
  function validateBackupSchema(data) {
    if (!data || typeof data !== 'object') return { valid: false, reason: "Backup is not a JSON object" };
    if (typeof data.xp !== 'number' || data.xp < 0) return { valid: false, reason: "XP must be a non-negative number" };
    if (!Array.isArray(data.completedChallenges)) return { valid: false, reason: "Completed Challenges must be an array" };
    if (data.completionDates && typeof data.completionDates !== 'object') return { valid: false, reason: "Completion Dates must be an object" };
    if (data.inventory) {
      if (typeof data.inventory.streakFreezes !== 'number' || typeof data.inventory.xpBoosts !== 'number') {
        return { valid: false, reason: "Inventory must contain numeric streakFreezes and xpBoosts" };
      }
    }
    if (data.unlockedBadges && !Array.isArray(data.unlockedBadges)) return { valid: false, reason: "Unlocked Badges must be an array" };
    if (data.userPythonCode && typeof data.userPythonCode !== 'object') return { valid: false, reason: "User Python Code must be a key-value object" };
    if (data.userSqlCode && typeof data.userSqlCode !== 'object') return { valid: false, reason: "User SQL Code must be a key-value object" };
    return { valid: true };
  }

  // Backup & Restore
  function exportBackup() {
    const backupData = {
      xp: $xp,
      streak: $streak,
      lastCompletedDate: localStorage.getItem('dojo_last_completed_date') || '',
      completedChallenges: $completedChallenges,
      completionDates: $completionDates,
      theme: $theme,
      soundEnabled: $soundEnabled,
      inventory: $inventory,
      unlockedBadges: $unlockedBadges,
      userPythonCode: $userPythonCode,
      userSqlCode: $userSqlCode,
      signature: generateSignature($xp, $completedChallenges)
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-dojo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // 1. Run schema validation
        const valResult = validateBackupSchema(data);
        if (!valResult.valid) {
          alert(`🛡️ Import Validation Failed: ${valResult.reason}`);
          return;
        }

        // 2. Validate Anti-Cheat Signature
        const expectedSig = generateSignature(data.xp, data.completedChallenges);
        if (data.xp > 0 || data.completedChallenges.length > 0) {
          if (!data.signature || data.signature !== expectedSig) {
            alert("🛡️ Import Validation Failed: Backup signature is missing or corrupted. Backup cannot be loaded.");
            return;
          }
        }

        xp.set(data.xp);
        if (typeof data.streak === 'number') streak.set(data.streak);
        if (typeof data.lastCompletedDate === 'string') {
          localStorage.setItem('dojo_last_completed_date', data.lastCompletedDate);
        }
        if (Array.isArray(data.completedChallenges)) completedChallenges.set(data.completedChallenges);
        if (data.completionDates && typeof data.completionDates === 'object') completionDates.set(data.completionDates);
        if (typeof data.theme === 'string') theme.set(data.theme);
        if (typeof data.soundEnabled === 'boolean') soundEnabled.set(data.soundEnabled);
        if (data.inventory && typeof data.inventory === 'object') inventory.set(data.inventory);
        if (Array.isArray(data.unlockedBadges)) unlockedBadges.set(data.unlockedBadges);
        if (data.userPythonCode && typeof data.userPythonCode === 'object') userPythonCode.set(data.userPythonCode);
        if (data.userSqlCode && typeof data.userSqlCode === 'object') userSqlCode.set(data.userSqlCode);
        
        // Force write signature to localStorage
        localStorage.setItem('dojo_signature', expectedSig);

        alert("Backup restored successfully!");
        window.location.reload();
      } catch (err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  // Resets
  function resetPythonProgress() {
    if (confirm("Are you sure you want to reset all Python progress? This clears your Python completed challenges and codes, but keeps your SQL progress.")) {
      userPythonCode.set({});
      completedChallenges.update(list => list.filter(id => !id.startsWith('ch')));
      pythonChallengeIndex.set(0);
      alert("Python progress has been reset.");
      window.location.reload();
    }
  }

  function resetSqlProgress() {
    if (confirm("Are you sure you want to reset all SQL progress? This clears your SQL completed challenges and codes, but keeps your Python progress.")) {
      userSqlCode.set({});
      completedChallenges.update(list => list.filter(id => !id.startsWith('sql')));
      sqlChallengeIndex.set(0);
      alert("SQL progress has been reset.");
      window.location.reload();
    }
  }
</script>

<div class="dashboard-container">
  <!-- Top Hero Stats Grid -->
  <div class="stats-hero-grid">
    <!-- Level Card -->
    <div class="stat-hero-card lvl-card">
      <div class="card-content">
        <span class="card-label">Mastery level</span>
        <span class="card-value">Level {currentLevel}</span>
        <span class="card-sub">{currentXp} Total Experience Points</span>
      </div>
      <Trophy size={48} class="hero-card-icon level-icon" />
    </div>

    <!-- Streak Card -->
    <div class="stat-hero-card streak-card" class:has-streak={currentStreak > 0}>
      <div class="card-content">
        <span class="card-label">Daily Streak</span>
        <span class="card-value">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</span>
        <span class="card-sub">Keep the code fire burning!</span>
      </div>
      <Flame size={48} class="hero-card-icon streak-icon" />
    </div>

    <!-- Completion Card -->
    <div class="stat-hero-card completions-card">
      <div class="card-content">
        <span class="card-label">Completed Dojo Tasks</span>
        <span class="card-value">{completedList.length} Tasks</span>
        <span class="card-sub">Out of {pythonExercises.length + sqlExercises.length} total tasks</span>
      </div>
      <CheckCircle size={48} class="hero-card-icon comps-icon" />
    </div>

    <!-- Daily Quest Card (Item 122) -->
    <div class="stat-hero-card daily-quest-card" class:goal-reached={dailyXpEarned >= dailyXpGoal}>
      <div class="card-content">
        <span class="card-label">Daily Quest Goal</span>
        <span class="card-value">{dailyXpEarned} / {dailyXpGoal} XP</span>
        <div class="quest-progress-bar-wrap">
          <div class="quest-progress-fill" style="width: {Math.min(100, (dailyXpEarned / dailyXpGoal) * 100)}%"></div>
        </div>
        <span class="card-sub">
          {#if dailyXpEarned >= dailyXpGoal}
            🎉 Quest Completed! Target reached.
          {:else}
            Earn {dailyXpGoal - dailyXpEarned} more XP today!
          {/if}
        </span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="hero-card-icon quest-icon"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    </div>

    <!-- Heatmap Card -->
    <div class="stat-hero-card heatmap-card">
      <div class="card-content">
        <span class="card-label">Activity Heatmap</span>
        <div class="heatmap-grid">
          {#each last28Days as day}
            <div 
              class="heatmap-cell {getHeatmapColor(day)}" 
              title="{day.toDateString()}: {getHeatmapCount(day)} task(s) completed"
            ></div>
          {/each}
        </div>
        <span class="card-sub">Your recent coding contributions</span>
      </div>
    </div>
  </div>

  <!-- Control Center (Achievements, Shop, Settings & Data) -->
  <div class="control-center">
    <div class="control-tabs">
      <button 
        class="control-tab-btn" 
        class:active={activeControlTab === 'achievements'} 
        onclick={() => activeControlTab = 'achievements'}
      >
        <Trophy size={14} class="tab-ic" />
        <span>Achievements</span>
      </button>
      <button 
        class="control-tab-btn" 
        class:active={activeControlTab === 'shop'} 
        onclick={() => activeControlTab = 'shop'}
      >
        <Zap size={14} class="tab-ic" />
        <span>Dojo Shop</span>
      </button>
      <button 
        class="control-tab-btn" 
        class:active={activeControlTab === 'analytics'} 
        onclick={() => activeControlTab = 'analytics'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-ic"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        <span>Analytics</span>
      </button>
      <button 
        class="control-tab-btn" 
        class:active={activeControlTab === 'leaderboard'} 
        onclick={() => activeControlTab = 'leaderboard'}
      >
        <Trophy size={14} class="tab-ic" />
        <span>Leaderboard</span>
      </button>
      <button 
        class="control-tab-btn" 
        class:active={activeControlTab === 'forge'} 
        onclick={() => activeControlTab = 'forge'}
      >
        <Code size={14} class="tab-ic" />
        <span>Dojo Forge</span>
      </button>
      <button 
        class="control-tab-btn" 
        class:active={activeControlTab === 'settings'} 
        onclick={() => activeControlTab = 'settings'}
      >
        <Settings size={14} class="tab-ic" />
        <span>Settings & Data</span>
      </button>
    </div>

    <div class="control-panel-content">
      {#if activeControlTab === 'achievements'}
        <div class="achievements-tab">
          <div class="badges-grid">
            {#each allBadgesList as badge}
              <div 
                class="badge-card" 
                class:unlocked={unlockedList.includes(badge.id)}
                style="--badge-color: {badge.color}"
              >
                <div class="badge-icon-wrap">
                  {#if badge.id === 'first-blood' || badge.id === 'level-5-mastery'}
                    <Trophy size={28} class="badge-icon" />
                  {:else if badge.id === 'pythonista'}
                    <Code size={28} class="badge-icon" />
                  {:else if badge.id === 'sql-maestro'}
                    <Database size={28} class="badge-icon" />
                  {:else if badge.id === 'ml-pioneer'}
                    <Star size={28} class="badge-icon" />
                  {:else if badge.id === 'svm-champion'}
                    <Shield size={28} class="badge-icon" />
                  {:else if badge.id === 'dedicated-scholar'}
                    <Flame size={28} class="badge-icon" />
                  {:else}
                    <Trophy size={28} class="badge-icon" />
                  {/if}
                  {#if !unlockedList.includes(badge.id)}
                    <div class="badge-lock">
                      <Lock size={10} />
                    </div>
                  {/if}
                </div>
                <div class="badge-info">
                  <h4 class="badge-name">{badge.name}</h4>
                  <p class="badge-desc">{badge.desc}</p>
                  <span class="badge-status-tag">
                    {unlockedList.includes(badge.id) ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else if activeControlTab === 'shop'}
        <div class="shop-tab">
          <div class="shop-inventory-row">
            <span class="shop-inv-title">Your Inventory:</span>
            <div class="shop-inv-items">
              <span class="shop-inv-badge">
                <Shield size={12} class="inv-ic" />
                <span>Streaks Freezes: {activeInventory.streakFreezes || 0}</span>
              </span>
              <span class="shop-inv-badge">
                <Zap size={12} class="inv-ic" />
                <span>XP Boosts: {activeInventory.xpBoosts || 0}</span>
              </span>
              {#if activeInventory.unlockedPersonas?.includes('wizard')}
                <span class="shop-inv-badge premium">
                  <Database size={12} class="inv-ic" />
                  <span>SQL Wizard Mentor</span>
                </span>
              {/if}
              {#if activeInventory.hasLeaderboardFlair}
                <span class="shop-inv-badge premium">
                  <Star size={12} class="inv-ic" />
                  <span>👑 Crown Flair</span>
                </span>
              {/if}
              {#if activeInventory.advancedCheatsUnlocked}
                <span class="shop-inv-badge premium">
                  <Code size={12} class="inv-ic" />
                  <span>Advanced Cheats</span>
                </span>
              {/if}
            </div>
            <span class="shop-xp-balance">Balance: <strong>{currentXp} XP</strong></span>
          </div>

          <div class="shop-items-grid">
            <div class="shop-item-card">
              <div class="shop-item-header">
                <div class="shop-item-icon-box shield-box">
                  <Shield size={20} />
                </div>
                <div class="shop-item-details">
                  <h4>Streak Freeze Shield</h4>
                  <p>Prevents your daily streak reset if you miss a day.</p>
                </div>
              </div>
              <div class="shop-item-buy">
                <span class="shop-item-price">200 XP</span>
                <button class="buy-btn" onclick={() => buyItem('shield', 200)} disabled={currentXp < 200}>
                  Buy Shield
                </button>
              </div>
            </div>

            <div class="shop-item-card">
              <div class="shop-item-header">
                <div class="shop-item-icon-box zap-box">
                  <Zap size={20} />
                </div>
                <div class="shop-item-details">
                  <h4>XP Double Booster</h4>
                  <p>Doubles XP rewards for your next 2 challenge completions.</p>
                </div>
              </div>
              <div class="shop-item-buy">
                <span class="shop-item-price">350 XP</span>
                <button class="buy-btn" onclick={() => buyItem('boost', 350)} disabled={currentXp < 350}>
                  Buy Booster
                </button>
              </div>
            </div>

            <!-- SQL Wizard Mentor -->
            <div class="shop-item-card">
              <div class="shop-item-header">
                <div class="shop-item-icon-box wizard-box">
                  <Database size={20} />
                </div>
                <div class="shop-item-details">
                  <h4>SQL Wizard Mentor</h4>
                  <p>Unlock the "SQL Wizard" persona in the AI Mentor chatbot sidebar.</p>
                </div>
              </div>
              <div class="shop-item-buy">
                <span class="shop-item-price">450 XP</span>
                {#if activeInventory.unlockedPersonas?.includes('wizard')}
                  <button class="buy-btn owned" disabled>Owned</button>
                {:else}
                  <button class="buy-btn" onclick={() => buyItem('wizard', 450)} disabled={currentXp < 450}>
                    Unlock Mentor
                  </button>
                {/if}
              </div>
            </div>

            <!-- Dojo Crown Flair -->
            <div class="shop-item-card">
              <div class="shop-item-header">
                <div class="shop-item-icon-box flair-box">
                  <Star size={20} />
                </div>
                <div class="shop-item-details">
                  <h4>Dojo Crown Flair</h4>
                  <p>Add a glowing 👑 crown next to your name on the Leaderboard.</p>
                </div>
              </div>
              <div class="shop-item-buy">
                <span class="shop-item-price">600 XP</span>
                {#if activeInventory.hasLeaderboardFlair}
                  <button class="buy-btn owned" disabled>Owned</button>
                {:else}
                  <button class="buy-btn" onclick={() => buyItem('flair', 600)} disabled={currentXp < 600}>
                    Unlock Flair
                  </button>
                {/if}
              </div>
            </div>

            <!-- Advanced Cheats Pack -->
            <div class="shop-item-card">
              <div class="shop-item-header">
                <div class="shop-item-icon-box cheats-box">
                  <Code size={20} />
                </div>
                <div class="shop-item-details">
                  <h4>Advanced Cheats Pack</h4>
                  <p>Unlock advanced SQL and NumPy/Pandas snippets in the Cheats drawer.</p>
                </div>
              </div>
              <div class="shop-item-buy">
                <span class="shop-item-price">300 XP</span>
                {#if activeInventory.advancedCheatsUnlocked}
                  <button class="buy-btn owned" disabled>Owned</button>
                {:else}
                  <button class="buy-btn" onclick={() => buyItem('cheats', 300)} disabled={currentXp < 300}>
                    Unlock Cheats
                  </button>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else if activeControlTab === 'settings'}
        <div class="settings-tab">
          <div class="settings-grid">
            <div class="setting-row">
              <div class="setting-info">
                <h4>Active Visual Theme</h4>
                <p>Choose your preferred Dojo environment styling and color accents.</p>
              </div>
              <div class="theme-buttons-container">
                <button 
                  class="theme-select-btn theme-obsidian" 
                  class:active={$theme === 'obsidian'}
                  onclick={() => theme.set('obsidian')}
                >
                  Obsidian
                </button>
                <button 
                  class="theme-select-btn theme-cyberpunk" 
                  class:active={$theme === 'cyberpunk'}
                  onclick={() => theme.set('cyberpunk')}
                >
                  Cyberpunk
                </button>
                <button 
                  class="theme-select-btn theme-matrix" 
                  class:active={$theme === 'matrix'}
                  onclick={() => theme.set('matrix')}
                >
                  Matrix
                </button>
                <button 
                  class="theme-select-btn theme-classic" 
                  class:active={$theme === 'classic'}
                  onclick={() => theme.set('classic')}
                >
                  Classic
                </button>
                <button 
                  class="theme-select-btn theme-light" 
                  class:active={$theme === 'light'}
                  onclick={() => theme.set('light')}
                >
                  Light Mode
                </button>
              </div>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <h4>Dojo Audio Soundscapes</h4>
                <p>Mute or play procedural chimes and fanfare sounds during training.</p>
              </div>
              <div class="audio-toggle-container">
                <button 
                  class="audio-toggle-btn" 
                  class:muted={!$soundEnabled}
                  onclick={() => soundEnabled.update(s => !s)}
                >
                  {#if $soundEnabled}
                    <Volume2 size={14} class="tab-ic" />
                    <span>Sounds Enabled</span>
                  {:else}
                    <VolumeX size={14} class="tab-ic" />
                    <span>Sounds Muted</span>
                  {/if}
                </button>
              </div>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <h4>Data Backup & Restorations</h4>
                <p>Download your progress (XP, codes, accomplishments) as JSON, or restore from a file.</p>
              </div>
              <div class="backup-actions">
                <button class="settings-action-btn export-btn" onclick={exportBackup}>
                  <Download size={12} class="tab-ic" />
                  <span>Backup (JSON)</span>
                </button>
                <label class="settings-action-btn import-btn">
                  <Upload size={12} class="tab-ic" />
                  <span>Restore Backup</span>
                  <input type="file" accept=".json" onchange={importBackup} style="display: none;" />
                </label>
              </div>
            </div>

            <div class="setting-row reset-section">
              <div class="setting-info">
                <h4>Partition Resets</h4>
                <p>Reset Python or SQL databases and codes independently without erasing everything.</p>
              </div>
              <div class="reset-actions">
                <button class="settings-action-btn reset-py" onclick={resetPythonProgress}>
                  <Trash2 size={12} class="tab-ic" />
                  <span>Reset Python</span>
                </button>
                <button class="settings-action-btn reset-sql" onclick={resetSqlProgress}>
                  <Trash2 size={12} class="tab-ic" />
                  <span>Reset SQL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      {:else if activeControlTab === 'analytics'}
        <Analytics />
      {:else if activeControlTab === 'leaderboard'}
        <Leaderboard />
      {:else if activeControlTab === 'forge'}
        <DojoForge language={currentLang} onChallengeCreated={refreshCustomChallenges} />
      {/if}
    </div>
  </div>

  <!-- Chapters list -->
  <div class="dojo-chapters-list">
    <div class="dojo-syllabus-header">
      <div class="section-title">
        <BookOpen size={18} class="sec-icon" />
        <h2>Dojo Syllabus ({currentLang === 'python' ? 'Python' : 'SQL'})</h2>
      </div>

      <!-- Syllabus Controls (Search / Filters) -->
      <div class="syllabus-controls">
        <div class="search-bar-wrap">
          <Search size={14} class="search-ic" />
          <input 
            type="text" 
            placeholder="Search exercises..." 
            bind:value={searchQuery}
            class="syllabus-search-input"
          />
          {#if searchQuery}
            <button class="clear-search-btn" onclick={() => searchQuery = ''}>
              <X size={14} />
            </button>
          {/if}
        </div>

        <select bind:value={selectedDifficulty} class="syllabus-filter-select">
          <option value="all">All Difficulties</option>
          <option value="easy">Easy Only</option>
          <option value="medium">Medium Only</option>
          <option value="hard">Hard Only</option>
        </select>

        <select bind:value={selectedStatus} class="syllabus-filter-select">
          <option value="all">All Statuses</option>
          <option value="completed">Completed Only</option>
          <option value="incomplete">Incomplete Only</option>
          <option value="starred">⭐ Starred Only</option>
        </select>
      </div>

      <button class="sandbox-cta-btn" onclick={onOpenSandbox}>
        <Play size={12} class="sandbox-cta-icon" fill="currentColor" />
        <span>Launch Free Sandbox</span>
      </button>
    </div>

    <!-- Topic Tag Chips Bar (Item 121) -->
    <div class="topic-tags-bar">
      {#each popularTopics as tag}
        {@const isSelected = selectedTopic === tag.id}
        <button 
          class="topic-tag-chip" 
          class:active={isSelected}
          onclick={() => selectedTopic = tag.id}
        >
          {tag.label}
        </button>
      {/each}
    </div>

    <!-- Empty State -->
    {#if Object.keys(currentLang === 'python' ? pythonChapters : sqlChapters).length === 0}
      <div class="no-results-state">
        <p>No Dojo tasks match your active filters. Try resetting filters.</p>
        <button class="reset-filters-btn" onclick={() => { searchQuery = ''; selectedDifficulty = 'all'; selectedStatus = 'all'; selectedTopic = 'all'; }}>
          Reset Filters
        </button>
      </div>
    {/if}

    {#if currentLang === 'python'}
      <!-- Python Chapters list -->
      <div class="chapters-grid">
        {#each Object.keys(pythonChapters) as chNum}
          <div class="chapter-block">
            <h3 class="chapter-title">
              <span class="ch-badge">Ch {String(chNum).padStart(2, '0')}</span>
              <span>{getChapterName(Number(chNum), 'python')}</span>
            </h3>

            <div class="task-rows">
              {#each pythonChapters[chNum] as task}
                <div class="task-row" class:completed={completedList.includes(task.id)}>
                  <div class="task-meta">
                    {#if completedList.includes(task.id)}
                      <CheckCircle size={16} class="status-comp" />
                    {:else}
                      <Circle size={16} class="status-empty" />
                    {/if}
                    <div class="task-info">
                      <span class="task-title">
                        {task.title}
                        {#if task.isCustom}
                          <span class="custom-badge" title="Forged challenge">Custom</span>
                        {/if}
                      </span>
                      <span class="task-topic">{task.topic}</span>
                    </div>
                  </div>
                  <div class="task-actions">
                    <button 
                      class="star-toggle-btn" 
                      class:starred={starredList.includes(task.id)}
                      onclick={() => toggleStar(task.id)}
                      title="Bookmark exercise"
                    >
                      <Star size={13} fill={starredList.includes(task.id) ? "currentColor" : "none"} />
                    </button>
                    <span class="diff-tag {task.difficulty}">{task.difficulty}</span>
                    <button class="play-btn" onclick={() => startChallenge(task.id, 'python')}>
                      <Play size={12} fill="currentColor" />
                      <span>Train</span>
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- SQL Chapters list -->
      <div class="chapters-grid">
        {#each Object.keys(sqlChapters) as chNum}
          <div class="chapter-block">
            <h3 class="chapter-title">
              <span class="ch-badge">Step {String(chNum).padStart(2, '0')}</span>
              <span>{getChapterName(Number(chNum), 'sql')}</span>
            </h3>

            <div class="task-rows">
              {#each sqlChapters[chNum] as task}
                <div class="task-row" class:completed={completedList.includes(task.id)}>
                  <div class="task-meta">
                    {#if completedList.includes(task.id)}
                      <CheckCircle size={16} class="status-comp" />
                    {:else}
                      <Circle size={16} class="status-empty" />
                    {/if}
                    <div class="task-info">
                      <span class="task-title">
                        {task.title}
                        {#if task.isCustom}
                          <span class="custom-badge" title="Forged challenge">Custom</span>
                        {/if}
                      </span>
                      <span class="task-topic">{task.topic}</span>
                    </div>
                  </div>
                  <div class="task-actions">
                    <button 
                      class="star-toggle-btn" 
                      class:starred={starredList.includes(task.id)}
                      onclick={() => toggleStar(task.id)}
                      title="Bookmark exercise"
                    >
                      <Star size={13} fill={starredList.includes(task.id) ? "currentColor" : "none"} />
                    </button>
                    <span class="diff-tag {task.difficulty}">{task.difficulty}</span>
                    <button class="play-btn" onclick={() => startChallenge(task.id, 'sql')}>
                      <Play size={12} fill="currentColor" />
                      <span>Train</span>
                    </button>
                  </div>
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
  .dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  /* Stats Hero Grid */
  .stats-hero-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }

  .stat-hero-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 2;
    width: 100%;
  }

  .card-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .card-value {
    font-size: 26px;
    font-weight: 800;
    color: var(--color-ink);
    letter-spacing: -0.02em;
  }

  .card-sub {
    font-size: 12px;
    color: var(--color-muted);
  }

  .hero-card-icon {
    opacity: 0.05;
    z-index: 1;
    position: absolute;
    right: 20px;
    bottom: 20px;
    transform: scale(1.5);
  }

  :global(body.theme-light) .hero-card-icon {
    opacity: 0.08;
  }

  .lvl-card {
    border-color: rgba(234, 179, 8, 0.2);
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.04) 0%, rgba(0,0,0,0) 100%), var(--color-card-bg);
  }

  .lvl-card .card-value {
    color: #eab308;
    text-shadow: 0 0 10px rgba(234, 179, 8, 0.2);
  }

  .streak-card {
    border-color: rgba(249, 115, 22, 0.2);
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.04) 0%, rgba(0,0,0,0) 100%), var(--color-card-bg);
  }

  .streak-card .card-value {
    color: #f97316;
    text-shadow: 0 0 10px rgba(249, 115, 22, 0.2);
  }

  .completions-card {
    border-color: rgba(16, 185, 129, 0.2);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(0,0,0,0) 100%), var(--color-card-bg);
  }

  .completions-card .card-value {
    color: #10b981;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
  }

  .daily-quest-card {
    border-color: rgba(59, 130, 246, 0.2);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(0,0,0,0) 100%), var(--color-card-bg);
  }

  .daily-quest-card .card-value {
    color: #3b82f6;
    text-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
  }

  .daily-quest-card.goal-reached {
    border-color: rgba(16, 185, 129, 0.35);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(0,0,0,0) 100%), var(--color-card-bg);
  }

  .daily-quest-card.goal-reached .card-value {
    color: #10b981;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  }

  .quest-progress-bar-wrap {
    width: 100%;
    height: 6px;
    background: rgba(100, 116, 139, 0.12);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin: 4px 0 2px 0;
  }

  .quest-progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .daily-quest-card.goal-reached .quest-progress-fill {
    background: #10b981;
  }

  /* Activity Heatmap Grid */
  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(7, 12px);
    grid-template-rows: repeat(4, 12px);
    gap: 4px;
    margin: 8px 0;
  }

  .heatmap-cell {
    width: 12px;
    height: 12px;
    background: #1a1a24;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .heatmap-cell:hover {
    transform: scale(1.25);
    box-shadow: 0 0 6px var(--color-glow, #10b981);
    z-index: 5;
    cursor: pointer;
  }

  .heatmap-cell.active-low { background: #064e3b; --color-glow: #064e3b; }
  .heatmap-cell.active-med { background: #047857; --color-glow: #047857; }
  .heatmap-cell.active-high { background: #10b981; box-shadow: 0 0 4px #10b981; --color-glow: #10b981; }

  /* Syllabus Section */
  .topic-tags-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--color-hairline);
  }

  .topic-tag-chip {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-pill);
    padding: 5px 12px;
    font-size: 11px;
    font-family: var(--font-body);
    font-weight: 500;
    color: var(--color-muted);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    outline: none;
  }

  .topic-tag-chip:hover {
    color: var(--color-ink);
    border-color: var(--color-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  :global(body.theme-light) .topic-tag-chip:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .topic-tag-chip.active {
    color: #ffffff;
    background: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: 0 0 10px var(--color-accent-glow);
  }

  :global(body.theme-light) .topic-tag-chip.active {
    color: #ffffff;
  }

  .dojo-syllabus-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    border-bottom: 1px solid #1a1a24;
    padding-bottom: 16px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sec-icon {
    color: #10b981;
  }

  .sandbox-cta-btn {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: #c084fc;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .sandbox-cta-btn:hover {
    background: #8b5cf6;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
    border-color: #8b5cf6;
  }

  :global(.sandbox-cta-icon) {
    filter: drop-shadow(0 0 2px rgba(139, 92, 246, 0.4));
  }

  .section-title h2 {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .chapters-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
  }

  @media (min-width: 900px) {
    .chapters-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .chapter-block {
    background: #0d0d11;
    border: 1px solid #1a1a24;
    border-radius: var(--radius-sm);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .chapter-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    border-bottom: 1px solid #1a1a24;
    padding-bottom: 12px;
  }

  .ch-badge {
    font-family: var(--font-mono);
    font-size: 11px;
    background: #111116;
    border: 1px solid #1d1d29;
    color: #10b981;
    padding: 2px 8px;
    border-radius: var(--radius-xs);
  }

  .task-rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .task-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #101015;
    border: 1px solid #15151e;
    border-radius: var(--radius-xs);
    padding: 10px 14px;
    transition: all 0.2s;
  }

  .task-row:hover {
    border-color: #1a1a24;
    background: #111117;
  }

  .task-row.completed {
    border-color: rgba(16, 185, 129, 0.1);
    background: rgba(16, 185, 129, 0.01);
  }

  .task-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-comp {
    color: #10b981;
  }

  .status-empty {
    color: #334155;
  }

  .task-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .task-title {
    font-size: 14px;
    font-weight: 600;
    color: #cbd5e1;
  }

  .task-row.completed .task-title {
    color: #94a3b8;
    text-decoration: line-through;
    text-decoration-color: #475569;
  }

  .task-topic {
    font-family: var(--font-mono);
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .task-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .diff-tag {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .diff-tag.easy {
    background: rgba(16, 185, 129, 0.08);
    color: #10b981;
  }

  .diff-tag.medium {
    background: rgba(234, 179, 8, 0.08);
    color: #eab308;
  }

  .diff-tag.hard {
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
  }

  .play-btn {
    background: #1c1c28;
    border: 1px solid #27273a;
    color: #e2e8f0;
    padding: 6px 12px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }

  .play-btn:hover {
    background: #10b981;
    color: #000000;
    border-color: #10b981;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
  }

  /* Control Center Container */
  .control-center {
    background: #0d0d11;
    border: 1px solid #1a1a24;
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .control-tabs {
    display: flex;
    border-bottom: 1px solid #1a1a24;
    background: #111116;
  }

  .control-tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #64748b;
    padding: 14px 20px;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .control-tab-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.01);
  }

  .control-tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    background: rgba(16, 185, 129, 0.02);
  }

  .control-panel-content {
    padding: 24px;
    background: #0d0d11;
  }

  :global(.tab-ic) {
    display: inline-block;
  }

  /* Achievements Badge Cards */
  .badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .badge-card {
    background: #101015;
    border: 1px solid #1c1c27;
    border-radius: var(--radius-sm);
    padding: 20px;
    display: flex;
    gap: 16px;
    align-items: center;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .badge-card.unlocked {
    border-color: rgba(16, 185, 129, 0.25);
    background: linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(0,0,0,0) 100%), #101015;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }

  .badge-card:not(.unlocked) {
    opacity: 0.4;
  }

  .badge-icon-wrap {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-sm);
    background: #161622;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 1px solid #232334;
    transition: all 0.3s;
  }

  .badge-card.unlocked .badge-icon-wrap {
    border-color: var(--badge-color);
    background: rgba(255,255,255,0.02);
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
  }

  :global(.badge-icon) {
    color: #475569;
  }

  .badge-card.unlocked :global(.badge-icon) {
    color: var(--badge-color) !important;
    filter: drop-shadow(0 0 8px var(--badge-color));
  }

  .badge-lock {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    border-radius: var(--radius-full);
    background: #1a1a24;
    border: 1px solid #334155;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .badge-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .badge-name {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }

  .badge-card.unlocked .badge-name {
    color: var(--badge-color);
  }

  .badge-desc {
    font-size: 12px;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
  }

  .badge-status-tag {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    margin-top: 4px;
    align-self: flex-start;
  }

  .badge-card.unlocked .badge-status-tag {
    color: #10b981;
  }

  .badge-card:not(.unlocked) .badge-status-tag {
    color: #475569;
  }

  /* Dojo Shop */
  .shop-inventory-row {
    background: #101015;
    border: 1px solid #1c1c27;
    border-radius: var(--radius-sm);
    padding: 16px 20px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .shop-inv-title {
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .shop-inv-items {
    display: flex;
    gap: 12px;
  }

  .shop-inv-badge {
    background: #161622;
    border: 1px solid #232334;
    border-radius: var(--radius-xs);
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  :global(.inv-ic) {
    color: var(--color-primary);
  }

  .shop-xp-balance {
    font-size: 14px;
    color: #94a3b8;
  }

  .shop-xp-balance strong {
    color: #eab308;
    text-shadow: 0 0 8px rgba(234, 179, 8, 0.2);
  }

  .shop-items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
  }

  .shop-item-card {
    background: #101015;
    border: 1px solid #1c1c27;
    border-radius: var(--radius-sm);
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;
    transition: all 0.2s;
  }

  .shop-item-card:hover {
    border-color: #272737;
  }

  .shop-item-header {
    display: flex;
    gap: 16px;
  }

  .shop-item-icon-box {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .shield-box {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  .zap-box {
    background: rgba(234, 179, 8, 0.08);
    border: 1px solid rgba(234, 179, 8, 0.2);
    color: #eab308;
  }

  .wizard-box {
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
  }

  .flair-box {
    background: rgba(244, 63, 94, 0.08);
    border: 1px solid rgba(244, 63, 94, 0.2);
    color: #f43f5e;
  }

  .cheats-box {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .shop-inv-badge.premium {
    border-color: rgba(168, 85, 247, 0.3);
    background: rgba(168, 85, 247, 0.05);
    color: #c084fc;
    box-shadow: 0 0 6px rgba(168, 85, 247, 0.1);
  }

  .buy-btn.owned {
    background: #1e293b;
    border-color: #334155;
    color: #64748b;
    cursor: not-allowed;
  }

  .shop-item-details h4 {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 4px 0;
  }

  .shop-item-details p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  .shop-item-buy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #1c1c27;
    padding-top: 16px;
  }

  .shop-item-price {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 800;
    color: #eab308;
  }

  .buy-btn {
    background: var(--color-primary);
    border: 1px solid var(--color-primary);
    color: #000000;
    padding: 8px 16px;
    border-radius: var(--radius-xs);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .buy-btn:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  }

  .buy-btn:disabled {
    background: #1e293b;
    border-color: #1e293b;
    color: #475569;
    cursor: not-allowed;
  }

  /* Settings Page */
  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .setting-row {
    background: #101015;
    border: 1px solid #1c1c27;
    border-radius: var(--radius-sm);
    padding: 20px 24px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 480px;
  }

  .setting-info h4 {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }

  .setting-info p {
    font-size: 12px;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
  }

  .theme-buttons-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .theme-select-btn {
    border: 1px solid #232334;
    color: #94a3b8;
    padding: 8px 16px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s;
  }

  .theme-select-btn.theme-obsidian { background: #09090c; }
  .theme-select-btn.theme-cyberpunk { background: #0d0614; }
  .theme-select-btn.theme-matrix { background: #020804; }
  .theme-select-btn.theme-classic { background: #0b0f19; }
  .theme-select-btn.theme-light { background: #f8fafc; color: #334155; border-color: #cbd5e1; }
  .theme-select-btn.theme-light.active { border-color: #10b981; color: #10b981; }

  .theme-select-btn.active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
  }

  .audio-toggle-btn {
    background: #161622;
    border: 1px solid #232334;
    color: #cbd5e1;
    padding: 10px 18px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .audio-toggle-btn:hover {
    border-color: #334155;
    background: #1b1b2a;
  }

  .audio-toggle-btn.muted {
    border-color: rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.05);
    color: #ef4444;
  }

  .backup-actions, .reset-actions {
    display: flex;
    gap: 12px;
  }

  .settings-action-btn {
    background: #161622;
    border: 1px solid #232334;
    color: #cbd5e1;
    padding: 10px 18px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .settings-action-btn:hover {
    border-color: #cbd5e1;
    background: #232334;
    color: #ffffff;
  }

  .reset-section {
    border-color: rgba(239, 68, 68, 0.15);
  }

  .reset-py, .reset-sql {
    border-color: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }

  .reset-py:hover, .reset-sql:hover {
    background: #ef4444;
    border-color: #ef4444;
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
  }

  /* Syllabus Controls & Search bar */
  .syllabus-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .search-bar-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-ic {
    position: absolute;
    left: 12px;
    color: #475569;
  }

  .syllabus-search-input {
    background: #101015;
    border: 1px solid #1a1a24;
    border-radius: var(--radius-xs);
    color: #cbd5e1;
    padding: 8px 32px 8px 36px;
    font-family: var(--font-body);
    font-size: 13px;
    outline: none;
    width: 200px;
    transition: all 0.2s;
  }

  .syllabus-search-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
    width: 250px;
  }

  .clear-search-btn {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: var(--radius-full);
  }

  .clear-search-btn:hover {
    color: #ffffff;
    background: rgba(255,255,255,0.05);
  }

  .syllabus-filter-select {
    background: #101015;
    border: 1px solid #1a1a24;
    border-radius: var(--radius-xs);
    color: #cbd5e1;
    padding: 8px 12px;
    font-family: var(--font-body);
    font-size: 13px;
    outline: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .syllabus-filter-select:focus {
    border-color: var(--color-primary);
  }

  .no-results-state {
    background: #101015;
    border: 1px solid #1a1a24;
    border-radius: var(--radius-sm);
    padding: 40px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .no-results-state p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  .reset-filters-btn {
    background: #1c1c28;
    border: 1px solid #27273a;
    color: #e2e8f0;
    padding: 8px 16px;
    border-radius: var(--radius-xs);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-filters-btn:hover {
    background: var(--color-primary);
    color: #000000;
    border-color: var(--color-primary);
  }

  /* Streak Fire Pulse Animation */
  .streak-card.has-streak {
    border-color: rgba(249, 115, 22, 0.4);
    box-shadow: 0 0 15px rgba(249, 115, 22, 0.1);
  }
  
  .streak-card.has-streak :global(.streak-icon) {
    opacity: 0.25;
    color: #f97316;
    animation: dashboard-flame-pulsing 2s infinite ease-in-out;
  }

  @keyframes dashboard-flame-pulsing {
    0% {
      transform: scale(1.5);
      filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.4));
    }
    50% {
      transform: scale(1.65) rotate(-3deg);
      filter: drop-shadow(0 0 15px rgba(249, 115, 22, 0.8));
    }
    100% {
      transform: scale(1.5);
      filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.4));
    }
  }
</style>
