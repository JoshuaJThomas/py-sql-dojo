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
export const starredChallenges = writable(getStorageSanitized('starred_challenges', [], 'array'));

export const theme = writable(getStorageSanitized('theme', 'obsidian', 'string'));
export const soundEnabled = writable(getStorage('sound_enabled', true));
export const musicEnabled = writable(getStorage('music_enabled', false));
export const soundVolume = writable(getStorageSanitized('sound_volume', 0.5, 'number'));
export const musicVolume = writable(getStorageSanitized('music_volume', 0.3, 'number'));
export const soundStyle = writable(getStorageSanitized('sound_style', 'retro', 'string'));
export const ambientTrack = writable(getStorageSanitized('ambient_track', 'zen', 'string'));
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
starredChallenges.subscribe(val => setStorage('starred_challenges', val));

theme.subscribe(val => {
  setStorage('theme', val);
  if (typeof document !== 'undefined') {
    document.body.classList.remove('theme-obsidian', 'theme-cyberpunk', 'theme-matrix', 'theme-classic', 'theme-light');
    document.body.classList.add(`theme-${val}`);
  }
});
soundEnabled.subscribe(val => setStorage('sound_enabled', val));
musicEnabled.subscribe(val => setStorage('music_enabled', val));
soundVolume.subscribe(val => setStorage('sound_volume', val));
musicVolume.subscribe(val => setStorage('music_volume', val));
soundStyle.subscribe(val => setStorage('sound_style', val));
ambientTrack.subscribe(val => setStorage('ambient_track', val));
inventory.subscribe(val => setStorage('inventory', val));
unlockedBadges.subscribe(val => setStorage('unlocked_badges', val));

// Initialize starter code for all challenges and perform self-healing for polluted entries
function initializeStarterCode() {
  const currentPyCodes = get(userPythonCode);
  let pyUpdated = false;

  const PY_BOILERPLATE = '# Write your python notebook cell here\nimport numpy as np\narr = np.array([1, 2, 3, 4])\nprint("Array multiplied by 3:")\narr * 3';
  const PY_BOILERPLATE_CLEANED = PY_BOILERPLATE.replace(/\s/g, '');

  pythonExercises.forEach(ex => {
    const savedCode = currentPyCodes[ex.id];
    // Check if the saved code matches the boilerplate code
    const isBoilerplate = savedCode && (
      savedCode === PY_BOILERPLATE || 
      savedCode.replace(/\s/g, '') === PY_BOILERPLATE_CLEANED ||
      (savedCode.includes('arr = np.array([1, 2, 3, 4])') && ex.id !== 'ch02-numpy-basic')
    );

    if (!savedCode || (isBoilerplate && ex.starterCode !== savedCode)) {
      currentPyCodes[ex.id] = ex.starterCode;
      pyUpdated = true;
    }
  });
  if (pyUpdated) userPythonCode.set(currentPyCodes);

  const currentSqlCodes = get(userSqlCode);
  let sqlUpdated = false;

  const SQL_BOILERPLATE = '-- Write your SQL query here\nSELECT * FROM employees LIMIT 3;\n';
  const SQL_BOILERPLATE_CLEANED = SQL_BOILERPLATE.replace(/\s/g, '');

  sqlExercises.forEach(ex => {
    const savedCode = currentSqlCodes[ex.id];
    const isBoilerplate = savedCode && (
      savedCode === SQL_BOILERPLATE || 
      savedCode.replace(/\s/g, '') === SQL_BOILERPLATE_CLEANED ||
      (savedCode.includes('SELECT * FROM employees LIMIT 3;') && ex.id !== 'sql-basic-select')
    );

    if (!savedCode || (isBoilerplate && ex.starterCode !== savedCode)) {
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

    // Track daily XP earned (Item 122)
    if (typeof window !== 'undefined') {
      const todayStr = new Date().toDateString();
      const lastXpDate = localStorage.getItem('dojo_last_xp_date');
      let earnedToday = 0;
      if (lastXpDate === todayStr) {
        earnedToday = Number(localStorage.getItem('dojo_daily_xp_earned') || '0');
      }
      earnedToday += reward;
      localStorage.setItem('dojo_daily_xp_earned', String(earnedToday));
      localStorage.setItem('dojo_last_xp_date', todayStr);
    }

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
    const newlyUnlocked = checkAchievements();

    // Auto-sync if enabled
    if (typeof window !== 'undefined' && localStorage.getItem('dojo_auto_sync_enabled') === 'true') {
      const currentUser = get(syncUser);
      if (currentUser) {
        setTimeout(() => {
          syncProfileData(true);
        }, 500);
      }
    }

    return newlyUnlocked;
  }
  return [];
}

// Cloud Sync stores and mock database implementation
export const syncUser = writable(getStorageSanitized('sync_user', null, 'object'));
syncUser.subscribe(val => setStorage('sync_user', val));

// Mock cloud database database state
export function getMockCloudDb() {
  if (typeof window === 'undefined') return { users: [], profiles: [], completions: [], inventory: [], starred: [] };
  const val = localStorage.getItem('dojo_mock_cloud_db');
  if (!val) {
    // Seed database with some dummy entries for visual preview
    const db = {
      users: [
        { id: 'u_wizard', username: 'sql_sorcerer', password: 'password123', created_at: new Date().toISOString() },
        { id: 'u_pandas', username: 'pandas_expert', password: 'password123', created_at: new Date().toISOString() }
      ],
      profiles: [
        { user_id: 'u_wizard', xp: 1250, level: 13, streak: 5, last_completed_date: new Date().toDateString() },
        { user_id: 'u_pandas', xp: 950, level: 10, streak: 3, last_completed_date: new Date().toDateString() }
      ],
      completions: [
        { user_id: 'u_wizard', challenge_id: 'sql-basic-select' },
        { user_id: 'u_wizard', challenge_id: 'sql-join-inner' },
        { user_id: 'u_pandas', challenge_id: 'ch01-pandas-intro' }
      ],
      inventory: [
        { user_id: 'u_wizard', streakFreezes: 2, xpBoosts: 1 },
        { user_id: 'u_pandas', streakFreezes: 0, xpBoosts: 0 }
      ],
      starred: [
        { user_id: 'u_wizard', challenge_id: 'sql-basic-select' }
      ]
    };
    localStorage.setItem('dojo_mock_cloud_db', JSON.stringify(db));
    return db;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return { users: [], profiles: [], completions: [], inventory: [], starred: [] };
  }
}

export function saveMockCloudDb(db) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dojo_mock_cloud_db', JSON.stringify(db));
  }
}

// Signup function
export function registerCloudUser(username, password) {
  const db = getMockCloudDb();
  const exists = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    throw new Error("Username is already taken in mock cloud database.");
  }
  const newUser = {
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    username,
    password,
    created_at: new Date().toISOString()
  };
  db.users.push(newUser);
  
  // Create initial profile
  db.profiles.push({
    user_id: newUser.id,
    xp: 0,
    level: 1,
    streak: 0,
    last_completed_date: ''
  });

  saveMockCloudDb(db);
  syncUser.set(newUser);
  return newUser;
}

// Login function
export function loginCloudUser(username, password) {
  const db = getMockCloudDb();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user || user.password !== password) {
    throw new Error("Invalid username or password credentials.");
  }
  syncUser.set(user);
  return user;
}

// Background / foreground sync function
export async function syncProfileData(silent = false) {
  const currentUser = get(syncUser);
  if (!currentUser) return;

  const db = getMockCloudDb();
  const userId = currentUser.id;

  // Retrieve cloud records
  let cloudProfile = db.profiles.find(p => p.user_id === userId);
  if (!cloudProfile) {
    cloudProfile = { user_id: userId, xp: 0, level: 1, streak: 0, last_completed_date: '' };
    db.profiles.push(cloudProfile);
  }

  const cloudCompletions = db.completions.filter(c => c.user_id === userId).map(c => c.challenge_id);
  const cloudStarred = db.starred.filter(s => s.user_id === userId).map(s => s.challenge_id);
  
  let cloudInv = db.inventory.find(i => i.user_id === userId);
  if (!cloudInv) {
    cloudInv = { user_id: userId, streakFreezes: 0, xpBoosts: 0 };
    db.inventory.push(cloudInv);
  }

  // Local values
  const localXp = get(xp);
  const localCompleted = get(completedChallenges);
  const localStarred = get(starredChallenges) || [];
  const localInv = get(inventory) || { streakFreezes: 0, xpBoosts: 0 };
  const localStreak = get(streak);
  const localLastDate = get(lastCompletedDate);

  const policy = typeof window !== 'undefined' ? localStorage.getItem('dojo_conflict_policy') || 'merge' : 'merge';

  if (policy === 'merge') {
    // Merge completions (union)
    const mergedCompleted = Array.from(new Set([...localCompleted, ...cloudCompletions]));
    completedChallenges.set(mergedCompleted);

    // Merge starred (union)
    const mergedStarred = Array.from(new Set([...localStarred, ...cloudStarred]));
    starredChallenges.set(mergedStarred);

    // Merge XP (max)
    const finalXp = Math.max(localXp, cloudProfile.xp);
    xp.set(finalXp);

    // Merge streak and inventory items
    const finalStreak = Math.max(localStreak, cloudProfile.streak);
    streak.set(finalStreak);

    const finalInv = {
      ...localInv,
      streakFreezes: Math.max(localInv.streakFreezes || 0, cloudInv.streakFreezes || 0),
      xpBoosts: Math.max(localInv.xpBoosts || 0, cloudInv.xpBoosts || 0)
    };
    inventory.set(finalInv);

    const finalLastDate = localXp >= cloudProfile.xp ? localLastDate : cloudProfile.last_completed_date;
    lastCompletedDate.set(finalLastDate);

    // Write back to cloud database tables
    cloudProfile.xp = finalXp;
    cloudProfile.level = Math.floor(finalXp / 100) + 1;
    cloudProfile.streak = finalStreak;
    cloudProfile.last_completed_date = finalLastDate;
    
    cloudInv.streakFreezes = finalInv.streakFreezes;
    cloudInv.xpBoosts = finalInv.xpBoosts;
    if (localInv.hasLeaderboardFlair || cloudInv.hasLeaderboardFlair) {
      cloudInv.hasLeaderboardFlair = true;
      finalInv.hasLeaderboardFlair = true;
    }
    if (localInv.advancedCheatsUnlocked || cloudInv.advancedCheatsUnlocked) {
      cloudInv.advancedCheatsUnlocked = true;
      finalInv.advancedCheatsUnlocked = true;
    }
    inventory.set(finalInv);

    // Clear and re-fill completions and starred cloud tables for user
    db.completions = db.completions.filter(c => c.user_id !== userId);
    mergedCompleted.forEach(id => {
      db.completions.push({ user_id: userId, challenge_id: id });
    });

    db.starred = db.starred.filter(s => s.user_id !== userId);
    mergedStarred.forEach(id => {
      db.starred.push({ user_id: userId, challenge_id: id });
    });

  } else if (policy === 'local') {
    // Local overwrites cloud
    cloudProfile.xp = localXp;
    cloudProfile.level = Math.floor(localXp / 100) + 1;
    cloudProfile.streak = localStreak;
    cloudProfile.last_completed_date = localLastDate;

    cloudInv.streakFreezes = localInv.streakFreezes || 0;
    cloudInv.xpBoosts = localInv.xpBoosts || 0;
    cloudInv.hasLeaderboardFlair = localInv.hasLeaderboardFlair || false;
    cloudInv.advancedCheatsUnlocked = localInv.advancedCheatsUnlocked || false;

    db.completions = db.completions.filter(c => c.user_id !== userId);
    localCompleted.forEach(id => {
      db.completions.push({ user_id: userId, challenge_id: id });
    });

    db.starred = db.starred.filter(s => s.user_id !== userId);
    localStarred.forEach(id => {
      db.starred.push({ user_id: userId, challenge_id: id });
    });

  } else if (policy === 'cloud') {
    // Cloud overwrites local
    xp.set(cloudProfile.xp);
    completedChallenges.set(cloudCompletions);
    starredChallenges.set(cloudStarred);
    streak.set(cloudProfile.streak);
    lastCompletedDate.set(cloudProfile.last_completed_date);
    
    inventory.set({
      ...localInv,
      streakFreezes: cloudInv.streakFreezes,
      xpBoosts: cloudInv.xpBoosts,
      hasLeaderboardFlair: cloudInv.hasLeaderboardFlair || false,
      advancedCheatsUnlocked: cloudInv.advancedCheatsUnlocked || false
    });
  }

  saveMockCloudDb(db);
  updateSignature();

  if (typeof window !== 'undefined') {
    localStorage.setItem('dojo_last_sync_time', new Date().toLocaleTimeString());
  }
}
