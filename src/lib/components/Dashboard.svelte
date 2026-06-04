<script>
  import { 
    completedChallenges, 
    completionDates,
    xp, 
    level, 
    streak, 
    language, 
    pythonChallengeIndex, 
    sqlChallengeIndex 
  } from '../stores/dojo-store.js';
  import { pythonExercises } from '../data/python-exercises.js';
  import { sqlExercises } from '../data/sql-exercises.js';
  import { Trophy, Flame, CheckCircle, Circle, Play, BookOpen, Star } from 'lucide-svelte';

  let { onOpenSandbox } = $props();

  let currentLang = $derived($language);
  let completedList = $derived($completedChallenges);
  let currentXp = $derived($xp);
  let currentLevel = $derived($level);
  let currentStreak = $derived($streak);
  let datesMap = $derived($completionDates || {});

  // Group challenges by chapter
  let pythonChapters = $derived(
    pythonExercises.reduce((acc, current) => {
      const ch = current.chapter;
      if (!acc[ch]) acc[ch] = [];
      acc[ch].push(current);
      return acc;
    }, {})
  );

  let sqlChapters = $derived(
    sqlExercises.reduce((acc, current) => {
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
      return `SQL Step ${chNum}`;
    }
  }

  function startChallenge(id, lang) {
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
    <div class="stat-hero-card streak-card">
      <div class="card-content">
        <span class="card-label">Daily Streak</span>
        <span class="card-value">{currentStreak} Days</span>
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

    <!-- Heatmap Card -->
    <div class="stat-hero-card heatmap-card">
      <div class="card-content">
        <span class="card-label">Activity Heatmap</span>
        <div class="heatmap-grid">
          {#each last28Days as day}
            <div 
              class="heatmap-cell {getHeatmapColor(day)}" 
              title="{day.toDateString()}"
            ></div>
          {/each}
        </div>
        <span class="card-sub">Your recent coding contributions</span>
      </div>
    </div>
  </div>

  <!-- Chapters list -->
  <div class="dojo-chapters-list">
    <div class="dojo-syllabus-header">
      <div class="section-title">
        <BookOpen size={18} class="sec-icon" />
        <h2>Dojo Syllabus ({currentLang === 'python' ? 'Python' : 'SQL'})</h2>
      </div>
      <button class="sandbox-cta-btn" onclick={onOpenSandbox}>
        <Play size={12} class="sandbox-cta-icon" fill="currentColor" />
        <span>Launch Free Sandbox</span>
      </button>
    </div>

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
                      <span class="task-title">{task.title}</span>
                      <span class="task-topic">{task.topic}</span>
                    </div>
                  </div>
                  <div class="task-actions">
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
                      <span class="task-title">{task.title}</span>
                      <span class="task-topic">{task.topic}</span>
                    </div>
                  </div>
                  <div class="task-actions">
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
    background: #0d0d11;
    border: 1px solid #1a1a24;
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
  }

  .card-label {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .card-value {
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  .card-sub {
    font-size: 12px;
    color: #475569;
  }

  .hero-card-icon {
    opacity: 0.05;
    z-index: 1;
    position: absolute;
    right: 20px;
    bottom: 20px;
    transform: scale(1.5);
  }

  .lvl-card {
    border-color: rgba(234, 179, 8, 0.15);
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.03) 0%, rgba(0,0,0,0) 100%), #0d0d11;
  }

  .lvl-card .card-value {
    color: #eab308;
    text-shadow: 0 0 10px rgba(234, 179, 8, 0.2);
  }

  .streak-card {
    border-color: rgba(249, 115, 22, 0.15);
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.03) 0%, rgba(0,0,0,0) 100%), #0d0d11;
  }

  .streak-card .card-value {
    color: #f97316;
    text-shadow: 0 0 10px rgba(249, 115, 22, 0.2);
  }

  .completions-card {
    border-color: rgba(16, 185, 129, 0.15);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(0,0,0,0) 100%), #0d0d11;
  }

  .completions-card .card-value {
    color: #10b981;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
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
</style>
