import { writable, get } from 'svelte/store';
import { pythonExercises } from '../data/python-exercises.js';
import { sqlExercises } from '../data/sql-exercises.js';

// Helper to get from localstorage with fallback
function getStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(`dojo_${key}`);
  if (val === null) return fallback;
  try {
    const parsed = JSON.parse(val);
    if (parsed === null) return fallback;
    return parsed;
  } catch (e) {
    return val;
  }
}

// Helper to get and sanitize stored types
function getStorageSanitized(key, fallback, expectedType) {
  let val = getStorage(key, fallback);
  if (expectedType === 'array') {
    if (!Array.isArray(val)) return fallback;
  } else if (expectedType === 'object') {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) return fallback;
  } else if (expectedType === 'number') {
    const num = Number(val);
    if (isNaN(num)) return fallback;
    val = num;
  } else if (expectedType === 'string') {
    if (typeof val !== 'string') return fallback;
  }
  return val;
}

// Helper to set localstorage
function setStorage(key, val) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`dojo_${key}`, JSON.stringify(val));
  }
}

export const language = writable(getStorageSanitized('language', 'python', 'string'));
export const pythonChallengeIndex = writable(getStorageSanitized('python_challenge_index', 0, 'number'));
export const sqlChallengeIndex = writable(getStorageSanitized('sql_challenge_index', 0, 'number'));

export const userPythonCode = writable(getStorageSanitized('user_python_code', {}, 'object'));
export const userSqlCode = writable(getStorageSanitized('user_sql_code', {}, 'object'));

export const xp = writable(getStorageSanitized('xp', 0, 'number'));
export const streak = writable(getStorageSanitized('streak', 0, 'number'));
export const lastCompletedDate = writable(getStorageSanitized('last_completed_date', '', 'string'));
export const completedChallenges = writable(getStorageSanitized('completed_challenges', [], 'array'));
export const completionDates = writable(getStorageSanitized('completion_dates', {}, 'object'));

export const theme = writable(getStorageSanitized('theme', 'obsidian', 'string'));
export const soundEnabled = writable(getStorage('sound_enabled', true));
export const inventory = writable(getStorageSanitized('inventory', { streakFreezes: 0, xpBoosts: 0 }, 'object'));
export const unlockedBadges = writable(getStorageSanitized('unlocked_badges', [], 'array'));

// Keep track of level based on XP (every 100 XP is a level)
export const level = writable(1);

// Anti-Cheat DJB2 Signature generator
export function generateSignature(xpVal, completedList) {
  const salt = "gemini-dojo-vanguard-salt-2026";
  const sortedCompleted = [...completedList].sort().join(',');
  const rawString = `${xpVal}:${sortedCompleted}:${salt}`;
  let hash = 5381;
  for (let i = 0; i < rawString.length; i++) {
    hash = ((hash << 5) + hash) + rawString.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// Update local signature
export function updateSignature() {
  if (typeof window === 'undefined') return;
  const currentXp = get(xp);
  const currentCompleted = get(completedChallenges);
  const sig = generateSignature(currentXp, currentCompleted);
  localStorage.setItem('dojo_signature', sig);
}

// Subscribe to store updates and save to localStorage
language.subscribe(val => setStorage('language', val));
pythonChallengeIndex.subscribe(val => setStorage('python_challenge_index', val));
sqlChallengeIndex.subscribe(val => setStorage('sql_challenge_index', val));
userPythonCode.subscribe(val => setStorage('user_python_code', val));
userSqlCode.subscribe(val => setStorage('user_sql_code', val));

xp.subscribe(val => {
  setStorage('xp', val);
  level.set(Math.floor(val / 100) + 1);
  updateSignature();
});

streak.subscribe(val => setStorage('streak', val));
lastCompletedDate.subscribe(val => setStorage('last_completed_date', val));

completedChallenges.subscribe(val => {
  setStorage('completed_challenges', val);
  updateSignature();
});

completionDates.subscribe(val => setStorage('completion_dates', val));

theme.subscribe(val => {
  setStorage('theme', val);
  if (typeof document !== 'undefined') {
    document.body.classList.remove('theme-obsidian', 'theme-cyberpunk', 'theme-matrix', 'theme-classic', 'theme-light');
    document.body.classList.add(`theme-${val}`);
  }
});
soundEnabled.subscribe(val => setStorage('sound_enabled', val));
inventory.subscribe(val => setStorage('inventory', val));
unlockedBadges.subscribe(val => setStorage('unlocked_badges', val));

// Initialize starter code for all challenges if not set
function initializeStarterCode() {
  const currentPyCodes = get(userPythonCode);
  let pyUpdated = false;
  pythonExercises.forEach(ex => {
    if (!currentPyCodes[ex.id]) {
      currentPyCodes[ex.id] = ex.starterCode;
      pyUpdated = true;
    }
  });
  if (pyUpdated) userPythonCode.set(currentPyCodes);

  const currentSqlCodes = get(userSqlCode);
  let sqlUpdated = false;
  sqlExercises.forEach(ex => {
    if (!currentSqlCodes[ex.id]) {
      currentSqlCodes[ex.id] = ex.starterCode;
      sqlUpdated = true;
    }
  });
  if (sqlUpdated) userSqlCode.set(currentSqlCodes);
}

initializeStarterCode();

// Vanguard Anti-Cheat Verification on startup
export function checkVanguardIntegrity() {
  if (typeof window === 'undefined') return;
  const loadedXp = get(xp);
  const loadedCompleted = get(completedChallenges);
  const loadedSig = localStorage.getItem('dojo_signature');
  
  if (loadedXp > 0 || loadedCompleted.length > 0) {
    if (!loadedSig) {
      // Legacy user upgrading - sign their progress silently to avoid false warnings
      updateSignature();
      return;
    }
    const expectedSig = generateSignature(loadedXp, loadedCompleted);
    if (loadedSig !== expectedSig) {
      alert("🛡️ Vanguard Anti-Cheat: Local storage modification detected! Your progress has been reverted to prevent cheating.");
      // Rollback
      xp.set(0);
      completedChallenges.set([]);
      unlockedBadges.set([]);
      streak.set(0);
      lastCompletedDate.set('');
      completionDates.set({});
      updateSignature();
    }
  } else {
    updateSignature();
  }
}

// Daily Streak verification on load (Auto-consumes Streak Freeze Shield if missed a day)
export function checkDailyStreakOnLoad() {
  if (typeof window === 'undefined') return;
  const lastDateStr = get(lastCompletedDate);
  if (!lastDateStr) return;

  const todayStr = new Date().toDateString();
  const lastDate = new Date(lastDateStr);
  const today = new Date(todayStr);
  
  // Calculate difference in days
  const diffTime = Math.abs(today - lastDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 1 && lastDateStr !== todayStr) {
    // They missed at least 1 day!
    const currentStreak = get(streak);
    if (currentStreak > 0) {
      const inv = get(inventory);
      if (inv.streakFreezes > 0) {
        inv.streakFreezes--;
        inventory.set(inv);
        // Streak is preserved, but we update lastCompletedDate to yesterday so it acts as if they completed it yesterday!
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        lastCompletedDate.set(yesterday);
        alert(`🛡️ Streak Shield Activated! One Streak Freeze Shield has been consumed to preserve your daily streak of ${currentStreak} days.`);
      } else {
        // Reset streak to 0
        streak.set(0);
        lastCompletedDate.set('');
        alert("🔥 Oh no! You missed a day and had no Streak Freeze Shield. Your daily streak has reset.");
      }
    }
  }
}

// Helper to evaluate and unlock achievement badges
export function checkAchievements() {
  const completed = get(completedChallenges);
  const currentStreak = get(streak);
  const currentLevel = get(level);
  const badges = get(unlockedBadges);
  const newlyUnlocked = [];

  const addBadge = (badgeId) => {
    if (!badges.includes(badgeId)) {
      badges.push(badgeId);
      newlyUnlocked.push(badgeId);
    }
  };

  // 1. First Blood
  if (completed.length >= 1) addBadge("first-blood");
  
  // 2. Pythonista (10 python tasks)
  const pyCount = completed.filter(id => id.startsWith('ch')).length;
  if (pyCount >= 10) addBadge("pythonista");
  
  // 3. SQL Maestro (10 sql tasks)
  const sqlCount = completed.filter(id => id.startsWith('sql-')).length;
  if (sqlCount >= 10) addBadge("sql-maestro");

  // 4. ML Pioneer (5 numpy/pandas tasks)
  const mlCount = completed.filter(id => id.startsWith('ch02') || id.startsWith('ch03')).length;
  if (mlCount >= 5) addBadge("ml-pioneer");

  // 5. SVM Champion (SVM task)
  if (completed.includes("ch13-svm-fit-03")) addBadge("svm-champion");

  // 6. Dedicated Scholar (3 day streak)
  if (currentStreak >= 3) addBadge("dedicated-scholar");

  // 7. Level 5 Mastery (Level >= 5)
  if (currentLevel >= 5) addBadge("level-5-mastery");

  if (newlyUnlocked.length > 0) {
    unlockedBadges.set(badges);
    return newlyUnlocked;
  }
  return [];
}

// Helper to complete a challenge and update XP and streaks
export function completeChallenge(challengeId, isEasy) {
  const completed = get(completedChallenges);
  if (!completed.includes(challengeId)) {
    completed.push(challengeId);
    completedChallenges.set(completed);

    // Track date of completion
    const today = new Date().toDateString();
    completionDates.update(dates => {
      dates[challengeId] = today;
      return dates;
    });

    // Add XP: 15 for easy, 30 for medium, 50 for hard (double if XP boost is active)
    let reward = isEasy === 'easy' ? 15 : isEasy === 'medium' ? 30 : 50;
    
    // Check for XP boost active in inventory
    const inv = get(inventory);
    if (inv.xpBoosts > 0) {
      reward = reward * 2;
      inv.xpBoosts--;
      inventory.set(inv);
    }

    xp.update(val => val + reward);

    // Update streak
    const lastDate = get(lastCompletedDate);

    if (lastDate !== today) {
      if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
        // Completed yesterday, extend streak
        streak.update(val => val + 1);
      } else if (lastDate === '') {
        // First completion ever
        streak.set(1);
      } else {
        // Missed a day! Check if they have a Streak Freeze Shield
        const inv = get(inventory);
        if (inv.streakFreezes > 0) {
          inv.streakFreezes--;
          inventory.set(inv);
          alert("🛡️ Streak Shield Activated! One Streak Freeze Shield has been consumed to preserve your daily streak.");
        } else {
          // Missed a day, reset to 1
          streak.set(1);
        }
      }
      lastCompletedDate.set(today);
    }

    // Trigger achievement evaluations
    return checkAchievements();
  }
  return [];
}
