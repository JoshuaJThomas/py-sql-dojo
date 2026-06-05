<script>
  import { onMount } from 'svelte';
  import { completedChallenges, completionDates, xp, level, streak, inventory, theme } from '../stores/dojo-store.js';
  import { pythonExercises } from '../data/python-exercises.js';
  import { sqlExercises } from '../data/sql-exercises.js';
  import { Trophy, Clock, Zap, Star, Share2, Award, CheckCircle } from 'lucide-svelte';

  let completedList = $derived($completedChallenges);
  let currentXp = $derived($xp);
  let currentLevel = $derived($level);
  let currentStreak = $derived($streak);
  let datesMap = $derived($completionDates || {});

  // Compute stats details
  let pythonTotal = pythonExercises.length;
  let sqlTotal = sqlExercises.length;
  let pyCompletedCount = $derived(completedList.filter(id => id.startsWith('ch')).length);
  let sqlCompletedCount = $derived(completedList.filter(id => id.startsWith('sql-')).length);

  // Compute category mastery values
  let categoriesData = $derived.by(() => {
    const categories = {
      'Python Loops & Basics': { completed: 0, total: 0 },
      'NumPy Essentials': { completed: 0, total: 0 },
      'Pandas Dataframes': { completed: 0, total: 0 },
      'Machine Learning': { completed: 0, total: 0 },
      'SQL Joins & Filters': { completed: 0, total: 0 },
      'CTEs & Subqueries': { completed: 0, total: 0 },
      'Window Functions': { completed: 0, total: 0 }
    };

    // Classify Python exercises
    pythonExercises.forEach(ex => {
      const topic = ex.topic.toLowerCase();
      if (topic.includes('numpy') || topic.includes('array')) {
        categories['NumPy Essentials'].total++;
        if (completedList.includes(ex.id)) categories['NumPy Essentials'].completed++;
      } else if (topic.includes('pandas') || topic.includes('dataframe') || topic.includes('series')) {
        categories['Pandas Dataframes'].total++;
        if (completedList.includes(ex.id)) categories['Pandas Dataframes'].completed++;
      } else if (topic.includes('svm') || topic.includes('regression') || topic.includes('cluster') || topic.includes('knn') || topic.includes('pca')) {
        categories['Machine Learning'].total++;
        if (completedList.includes(ex.id)) categories['Machine Learning'].completed++;
      } else {
        categories['Python Loops & Basics'].total++;
        if (completedList.includes(ex.id)) categories['Python Loops & Basics'].completed++;
      }
    });

    // Classify SQL exercises
    sqlExercises.forEach(ex => {
      const topic = ex.topic.toLowerCase();
      if (topic.includes('window') || topic.includes('rank') || topic.includes('lead') || topic.includes('lag')) {
        categories['Window Functions'].total++;
        if (completedList.includes(ex.id)) categories['Window Functions'].completed++;
      } else if (topic.includes('cte') || topic.includes('subquer') || topic.includes('exists')) {
        categories['CTEs & Subqueries'].total++;
        if (completedList.includes(ex.id)) categories['CTEs & Subqueries'].completed++;
      } else {
        categories['SQL Joins & Filters'].total++;
        if (completedList.includes(ex.id)) categories['SQL Joins & Filters'].completed++;
      }
    });

    return Object.entries(categories).map(([name, val]) => ({
      name,
      percentage: val.total > 0 ? (val.completed / val.total) * 100 : 0,
      completed: val.completed,
      total: val.total
    }));
  });

  // SVG Radar Coordinates generator
  let radarPointsStr = $derived.by(() => {
    const cx = 150;
    const cy = 130;
    const r = 80;
    const count = categoriesData.length;

    const points = categoriesData.map((cat, idx) => {
      const angle = (idx * 2 * Math.PI) / count - Math.PI / 2;
      const amount = cat.percentage / 100;
      const x = cx + r * amount * Math.cos(angle);
      const y = cy + r * amount * Math.sin(angle);
      return `${x},${y}`;
    });

    return points.join(' ');
  });

  let radarGridLines = $derived.by(() => {
    const cx = 150;
    const cy = 130;
    const r = 80;
    const count = categoriesData.length;

    return categoriesData.map((cat, idx) => {
      const angle = (idx * 2 * Math.PI) / count - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return { x1: cx, y1: cy, x2: x, y2: y, name: cat.name };
    });
  });

  // Language Pie chart parameters
  let pyAngle = $derived(pyCompletedCount + sqlCompletedCount > 0 
    ? (pyCompletedCount / (pyCompletedCount + sqlCompletedCount)) * 360 
    : 180
  );

  // Time-Series XP growth simulation using completed dates
  let xpGrowthData = $derived.by(() => {
    // Collect completions grouped by date
    const dateCompletions = {};
    Object.entries(datesMap).forEach(([id, dateStr]) => {
      if (!dateCompletions[dateStr]) dateCompletions[dateStr] = 0;
      // standard exercise XP is ~25 on average
      dateCompletions[dateStr] += 25;
    });

    // Sort dates
    const sortedDates = Object.keys(dateCompletions).sort((a, b) => new Date(a) - new Date(b));
    let currentTotal = 0;
    
    // Map to cumulative array
    const results = sortedDates.map(date => {
      currentTotal += dateCompletions[date];
      return { date, xp: currentTotal };
    });

    if (results.length === 0) {
      return [{ date: 'Start', xp: 0 }, { date: 'Today', xp: currentXp }];
    }
    return results;
  });

  let linePathXp = $derived.by(() => {
    const width = 360;
    const height = 150;
    const pad = 25;
    
    if (xpGrowthData.length <= 1) return `M ${pad} ${height - pad} L ${width - pad} ${pad}`;

    const maxX = xpGrowthData.length - 1;
    const maxY = Math.max(10, ...xpGrowthData.map(d => d.xp));

    return xpGrowthData.map((d, idx) => {
      const x = pad + (idx / maxX) * (width - 2 * pad);
      const y = height - pad - (d.xp / maxY) * (height - 2 * pad);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  });

  let areaPathXp = $derived.by(() => {
    const width = 360;
    const height = 150;
    const pad = 25;
    const bottomY = height - pad;
    
    if (xpGrowthData.length <= 1) return `M ${pad} ${bottomY} L ${width - pad} ${bottomY} Z`;

    const maxX = xpGrowthData.length - 1;
    const maxY = Math.max(10, ...xpGrowthData.map(d => d.xp));

    const pathPoints = xpGrowthData.map((d, idx) => {
      const x = pad + (idx / maxX) * (width - 2 * pad);
      const y = height - pad - (d.xp / maxY) * (height - 2 * pad);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    const firstX = pad;
    const lastX = pad + (maxX / maxX) * (width - 2 * pad);
    return `${pathPoints.join(' ')} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  });

  // State variables for chart hover tooltips (Item 160)
  let hoveredRadarIndex = $state(null);
  let hoveredXpPoint = $state(null);

  // Clipboard copy progress summary
  function copyProgressToClipboard() {
    const text = `🌌 Gemini Dojo Coding Progress Summary 🌌\n` +
      `---------------------------------------\n` +
      `Mastery Level: ${currentLevel}\n` +
      `Total XP: ${currentXp} XP\n` +
      `Daily Streak: ${currentStreak} Days\n` +
      `Python Exercises: ${pyCompletedCount} / ${pythonTotal} Done\n` +
      `SQL Exercises: ${sqlCompletedCount} / ${sqlTotal} Done\n` +
      `Overall Completion: ${((pyCompletedCount + sqlCompletedCount) / (pythonTotal + sqlTotal) * 100).toFixed(0)}%\n\n` +
      `Join me in the code dojo! https://joshuajthomas.github.io/py-sql-dojo/`;
      
    navigator.clipboard.writeText(text).then(() => {
      alert("Progress summary copied to clipboard! Share it with your friends.");
    }).catch(err => {
      alert("Failed to copy: " + err);
    });
  }
</script>

<div class="analytics-layout">
  <div class="analytics-header-row">
    <div class="title-wrap">
      <Award size={20} class="header-icon" />
      <h2>Mastery Analytics Report</h2>
    </div>
    <button class="share-btn" onclick={copyProgressToClipboard}>
      <Share2 size={12} />
      <span>Share Summary</span>
    </button>
  </div>

  <div class="stats-overview-grid">
    <div class="stat-card">
      <div class="card-glow primary"></div>
      <Trophy class="card-icon" size={24} />
      <div class="card-info">
        <span class="card-label">Mastery Level</span>
        <span class="card-value">{currentLevel}</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="card-glow accent"></div>
      <Zap class="card-icon" size={24} />
      <div class="card-info">
        <span class="card-label">Total Experience</span>
        <span class="card-value">{currentXp} XP</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="card-glow success"></div>
      <CheckCircle class="card-icon" size={24} />
      <div class="card-info">
        <span class="card-label">Completions</span>
        <span class="card-value">{pyCompletedCount + sqlCompletedCount} / {pythonTotal + sqlTotal}</span>
      </div>
    </div>
  </div>

  <div class="analytics-charts-grid">
    <!-- Chart 1: Topic Radar Chart -->
    <div class="chart-box" style="position: relative;">
      <h3>Syllabus Topic Strengths (Radar)</h3>
      <div class="chart-canvas-wrap">
        <svg viewBox="0 0 300 240" width="100%" height="100%">
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.05"/>
            </radialGradient>
          </defs>

          <!-- Outer grid circles and percentage ticks -->
          {#each [0.25, 0.5, 0.75, 1.0] as scale}
            <circle cx="150" cy="130" r={80 * scale} fill="none" stroke="var(--color-hairline)" stroke-width="1" />
            <text x="150" y={130 - 80 * scale + 8} text-anchor="middle" font-size="7" fill="var(--color-muted)" font-family="var(--font-mono)">{scale * 100}%</text>
            {#if scale === 1.0}
              <!-- Radar axes lines -->
              {#each radarGridLines as line}
                <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="var(--color-hairline)" stroke-width="1" />
                <!-- Axis Label -->
                <text 
                  x={line.x2 + (line.x2 > 150 ? 5 : -5)} 
                  y={line.y2 + (line.y2 > 130 ? 5 : -5)} 
                  text-anchor={line.x2 > 149 ? 'start' : 'end'}
                  class="radar-axis-label"
                >
                  {line.name.substring(0, 14)}
                </text>
              {/each}
            {/if}
          {/each}

          <!-- Filled radar polygon -->
          <polygon points={radarPointsStr} fill="url(#radarGlow)" stroke="var(--color-primary)" stroke-width="2" />

          <!-- Interactive hover points on Radar vertices (Item 160) -->
          {#each categoriesData as cat, idx}
            {@const angle = (idx * 2 * Math.PI) / categoriesData.length - Math.PI / 2}
            {@const amount = cat.percentage / 100}
            {@const px = 150 + 80 * amount * Math.cos(angle)}
            {@const py = 130 + 80 * amount * Math.sin(angle)}
            <!-- Glow dot on vertex -->
            <circle cx={px} cy={py} r="4" fill="var(--color-canvas)" stroke="var(--color-primary)" stroke-width="2.5" />
            
            <!-- Large invisible hover target -->
            <circle 
              cx={px} 
              cy={py} 
              r="12" 
              fill="transparent" 
              style="cursor: pointer;"
              onmouseenter={() => hoveredRadarIndex = idx}
              onmouseleave={() => hoveredRadarIndex = null}
              role="presentation"
            />
          {/each}
        </svg>

        <!-- Floating Radar Tooltip -->
        {#if hoveredRadarIndex !== null}
          {@const hoveredCat = categoriesData[hoveredRadarIndex]}
          <div class="chart-tooltip radar-tooltip">
            <strong>{hoveredCat.name}</strong>
            <span class="xp">{hoveredCat.percentage.toFixed(0)}% Mastery</span>
            <span class="sub">{hoveredCat.completed} / {hoveredCat.total} exercises solved</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Chart 2: Cumulative XP Growth Line -->
    <div class="chart-box" style="position: relative;">
      <h3>Experience Accrual (Cumulative)</h3>
      <div class="chart-canvas-wrap">
        <svg viewBox="0 0 360 150" width="100%" height="100%">
          <defs>
            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0"/>
            </linearGradient>
          </defs>

          <!-- Y-axis Grid Lines & Labels -->
          {#each [0, 0.5, 1.0] as ratio}
            {@const yVal = 150 - 25 - ratio * (150 - 50)}
            {@const maxY = Math.max(10, ...xpGrowthData.map(d => d.xp))}
            {@const labelVal = Math.round(ratio * maxY)}
            <line x1="25" y1={yVal} x2="335" y2={yVal} stroke="var(--color-hairline)" stroke-width="0.5" stroke-dasharray="2,2" />
            <text x="20" y={yVal + 3} text-anchor="end" font-size="8" fill="var(--color-muted)" font-family="var(--font-mono)">{labelVal}</text>
          {/each}

          <!-- Area path filled with gradient -->
          <path d={areaPathXp} fill="url(#areaGlow)" />
          
          <!-- Line path -->
          <path d={linePathXp} fill="none" stroke="var(--color-primary)" stroke-width="2.5" />
          
          <!-- Dots for data points -->
          {#each xpGrowthData as pt, idx}
            {@const maxX = xpGrowthData.length - 1}
            {@const maxY = Math.max(10, ...xpGrowthData.map(d => d.xp))}
            {@const px = 25 + (idx / maxX) * (360 - 50)}
            {@const py = 150 - 25 - (pt.xp / maxY) * (150 - 50)}
            
            <circle cx={px} cy={py} r="4" fill="var(--color-canvas)" stroke="var(--color-primary)" stroke-width="2" />
            
            <!-- Large invisible hover target -->
            <circle 
              cx={px} 
              cy={py} 
              r="12" 
              fill="transparent" 
              style="cursor: pointer;"
              onmouseenter={() => hoveredXpPoint = { ...pt, x: px, y: py }}
              onmouseleave={() => hoveredXpPoint = null}
              role="presentation"
            />
          {/each}

          <!-- X-axis Labels (Dates) -->
          {#each xpGrowthData as pt, idx}
            {@const maxX = xpGrowthData.length - 1}
            {@const px = 25 + (idx / maxX) * (360 - 50)}
            {#if idx === 0 || idx === maxX || (maxX > 2 && idx === Math.floor(maxX / 2))}
              {@const formattedDate = pt.date.includes('/') || pt.date.includes('-') ? new Date(pt.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : pt.date}
              <text x={px} y="142" text-anchor="middle" font-size="8" fill="var(--color-muted)" font-family="var(--font-mono)">{formattedDate}</text>
            {/if}
          {/each}
        </svg>

        <!-- Floating XP Tooltip -->
        {#if hoveredXpPoint !== null}
          {@const formattedDate = hoveredXpPoint.date.includes('/') || hoveredXpPoint.date.includes('-') ? new Date(hoveredXpPoint.date).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'}) : hoveredXpPoint.date}
          <div class="chart-tooltip xp-tooltip" style="left: {hoveredXpPoint.x - 30}px; top: {hoveredXpPoint.y - 50}px;">
            <span class="date">{formattedDate}</span>
            <strong class="xp">{hoveredXpPoint.xp} XP Cumulative</strong>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="categories-list-panel">
    <h3>Detailed Category Mastery</h3>
    <div class="cat-grid-rows">
      {#each categoriesData as cat}
        <div class="cat-progress-row">
          <div class="cat-info">
            <span class="cat-name">{cat.name}</span>
            <span class="cat-fraction">{cat.completed} / {cat.total} completed</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: {cat.percentage}%;"></div>
            <span class="progress-pct">{cat.percentage.toFixed(0)}%</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .analytics-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: var(--color-ink);
  }

  .analytics-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-hairline);
    padding-bottom: 10px;
  }

  .title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-primary);
  }

  .title-wrap h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  .share-btn {
    background: var(--color-primary);
    border: none;
    color: var(--color-canvas);
    padding: 6px 14px;
    border-radius: var(--radius-xs);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.2s;
  }

  .share-btn:hover {
    opacity: 0.9;
  }

  .stats-overview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .stat-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    overflow: hidden;
  }

  .card-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
  }

  .card-glow.primary { background: var(--color-primary); }
  .card-glow.accent { background: #8b5cf6; }
  .card-glow.success { background: var(--color-success); }

  .card-icon {
    color: var(--color-muted);
  }

  .card-info {
    display: flex;
    flex-direction: column;
  }

  .card-label {
    font-size: 11px;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-value {
    font-size: 20px;
    font-weight: 800;
  }

  .analytics-charts-grid {
    display: grid;
    grid-template-columns: 1.2fr 1.8fr;
    gap: 16px;
  }

  @media (max-width: 768px) {
    .analytics-charts-grid {
      grid-template-columns: 1fr;
    }
  }

  .chart-box {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chart-box h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chart-canvas-wrap {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .radar-axis-label {
    font-size: 8px;
    fill: var(--color-muted);
    font-family: var(--font-mono);
  }

  .categories-list-panel {
    background: var(--color-card-bg);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .categories-list-panel h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cat-grid-rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cat-progress-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cat-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }

  .cat-name {
    font-weight: 600;
  }

  .cat-fraction {
    color: var(--color-muted);
  }

  .progress-bar-container {
    height: 16px;
    background: var(--color-canvas);
    border: 1px solid var(--color-hairline);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.4s ease-out;
  }

  .progress-pct {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    color: var(--color-ink);
    mix-blend-mode: difference;
  }

  .chart-tooltip {
    position: absolute;
    background: #101015;
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-xs);
    padding: 8px 12px;
    pointer-events: none;
    font-size: 11px;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    z-index: 10;
  }

  .radar-tooltip {
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    border-color: var(--color-primary);
    min-width: 180px;
    text-align: center;
  }

  .xp-tooltip {
    transform: translateX(-50%);
    white-space: nowrap;
    border-color: #8b5cf6;
  }

  .chart-tooltip .sub {
    font-size: 9px;
    color: var(--color-muted);
  }

  .chart-tooltip .date {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .chart-tooltip .xp {
    color: #eab308;
    font-weight: 700;
  }
</style>
