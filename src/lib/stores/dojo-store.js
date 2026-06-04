import { writable, get } from 'svelte/store';
import { pythonExercises } from '../data/python-exercises.js';
import { sqlExercises } from '../data/sql-exercises.js';

// Helper to get from localstorage with fallback
function getStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(`dojo_${key}`);
  if (val === null) return fallback;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

// Helper to set localstorage
function setStorage(key, val) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`dojo_${key}`, JSON.stringify(val));
  }
}

export const language = writable(getStorage('language', 'python'));
export const pythonChallengeIndex = writable(getStorage('python_challenge_index', 0));
export const sqlChallengeIndex = writable(getStorage('sql_challenge_index', 0));

export const userPythonCode = writable(getStorage('user_python_code', {}));
export const userSqlCode = writable(getStorage('user_sql_code', {}));

export const xp = writable(getStorage('xp', 0));
export const streak = writable(getStorage('streak', 0));
export const lastCompletedDate = writable(getStorage('last_completed_date', ''));
export const completedChallenges = writable(getStorage('completed_challenges', []));
export const completionDates = writable(getStorage('completion_dates', {}));

// Keep track of level based on XP (every 100 XP is a level)
export const level = writable(1);

// Subscribe to store updates and save to localStorage
language.subscribe(val => setStorage('language', val));
pythonChallengeIndex.subscribe(val => setStorage('python_challenge_index', val));
sqlChallengeIndex.subscribe(val => setStorage('sql_challenge_index', val));
userPythonCode.subscribe(val => setStorage('user_python_code', val));
userSqlCode.subscribe(val => setStorage('user_sql_code', val));
xp.subscribe(val => {
  setStorage('xp', val);
  level.set(Math.floor(val / 100) + 1);
});
streak.subscribe(val => setStorage('streak', val));
lastCompletedDate.subscribe(val => setStorage('last_completed_date', val));
completedChallenges.subscribe(val => setStorage('completed_challenges', val));
completionDates.subscribe(val => setStorage('completion_dates', val));

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

    // Add XP: 15 for easy, 30 for medium, 50 for hard
    const reward = isEasy === 'easy' ? 15 : isEasy === 'medium' ? 30 : 50;
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
        // Missed a day, reset to 1
        streak.set(1);
      }
      lastCompletedDate.set(today);
    }
  }
}
