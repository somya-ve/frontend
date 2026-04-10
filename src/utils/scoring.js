// ─── Scoring Utilities ───

const BASE_POINTS = {
  dots: 1000,
  cipher: 800,
  memory: 600,
  scramble: 500,
  secret: 1000,
};

/**
 * Calculate score for Connect the Dots
 * @param {number} attempts - number of incorrect attempts before solving
 * @param {number} timeSeconds - time taken in seconds
 */
export function scoreDots(attempts, timeSeconds) {
  const base = BASE_POINTS.dots;
  const attemptPenalty = Math.max(0, (attempts - 1) * 150);
  const timeBonus = Math.max(0, 300 - Math.floor(timeSeconds / 2));
  return Math.max(50, base - attemptPenalty + timeBonus);
}

/**
 * Calculate score for Cipher Decoder
 * @param {number} correctRounds - rounds answered correctly
 * @param {number} totalRounds - total rounds
 * @param {number} timeSeconds - time taken in seconds
 */
export function scoreCipher(correctRounds, totalRounds, timeSeconds) {
  const base = BASE_POINTS.cipher;
  const accuracy = correctRounds / totalRounds;
  const timeBonus = Math.max(0, 200 - Math.floor(timeSeconds / 3));
  return Math.max(50, Math.round(base * accuracy + timeBonus));
}

/**
 * Calculate score for Memory Match
 * @param {number} moves - number of card flip pairs
 * @param {number} timeSeconds - time taken in seconds
 */
export function scoreMemory(moves, timeSeconds) {
  const base = BASE_POINTS.memory;
  const movePenalty = Math.max(0, (moves - 8) * 25); // 8 is perfect (8 pairs)
  const timeBonus = Math.max(0, 300 - Math.floor(timeSeconds));
  return Math.max(50, base - movePenalty + timeBonus);
}

/**
 * Calculate score for Word Scramble
 * @param {number} correctWords - words solved
 * @param {number} totalWords - total words
 * @param {number} timeSeconds - time taken
 * @param {number} streak - max consecutive correct
 */
export function scoreScramble(correctWords, totalWords, timeSeconds, streak) {
  const base = BASE_POINTS.scramble;
  const accuracy = correctWords / totalWords;
  const timeBonus = Math.max(0, 200 - Math.floor(timeSeconds / 2));
  const streakBonus = streak * 30;
  return Math.max(50, Math.round(base * accuracy + timeBonus + streakBonus));
}

/**
 * Get completed games from localStorage
 */
export function getCompletedGames() {
  try {
    return JSON.parse(localStorage.getItem("cryptic_completed") || "[]");
  } catch {
    return [];
  }
}

/**
 * Mark a game as completed
 */
export function markGameCompleted(gameId) {
  const completed = getCompletedGames();
  if (!completed.includes(gameId)) {
    completed.push(gameId);
    localStorage.setItem("cryptic_completed", JSON.stringify(completed));
  }
}

/**
 * Get saved player name
 */
export function getPlayerName() {
  return localStorage.getItem("cryptic_player_name") || "";
}

/**
 * Save player name
 */
export function savePlayerName(name) {
  localStorage.setItem("cryptic_player_name", name);
}

export const API_BASE_URL = process.env.REACT_APP_API_URL || import.meta.env?.VITE_API_URL || "https://outbreak-certified-carefully.ngrok-free.dev";

// ─── Auth Helpers ───

export function getAuthToken() {
  return localStorage.getItem("cryptic_auth_token") || "";
}

export function setAuthToken(token) {
  localStorage.setItem("cryptic_auth_token", token);
}

export function clearAuth() {
  localStorage.removeItem("cryptic_auth_token");
  localStorage.removeItem("cryptic_player_name");
  localStorage.removeItem("cryptic_completed");
  localStorage.removeItem("cryptic_user_progress");
}

export function isLoggedIn() {
  return !!getAuthToken();
}

export function getUserProgress() {
  try {
    return JSON.parse(localStorage.getItem("cryptic_user_progress") || "{}");
  } catch {
    return {};
  }
}

export function setUserProgress(progress) {
  localStorage.setItem("cryptic_user_progress", JSON.stringify(progress));
}

export function getTotalScore() {
  const progress = getUserProgress();
  return ["dots", "cipher", "memory", "scramble", "secret"].reduce(
    (sum, g) => sum + (progress[g]?.score || 0),
    0
  );
}

/**
 * Authenticated fetch helper
 */
export function authFetch(url, options = {}) {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { "x-auth-token": token } : {}),
    },
  });
}

/**
 * Submit score to backend
 */
export async function submitScore(game, score, time) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/leaderboard`, {
      method: "POST",
      body: JSON.stringify({ game, score, time }),
    });
    return await res.json();
  } catch (err) {
    console.warn("Could not submit score:", err);
    const local = JSON.parse(localStorage.getItem("cryptic_scores") || "[]");
    const playerName = getPlayerName();
    local.push({ playerName, game, score, time, date: new Date().toISOString() });
    localStorage.setItem("cryptic_scores", JSON.stringify(local));
    return null;
  }
}

/**
 * Save game progress to server
 */
export async function saveProgress(game, progressData) {
  try {
    await authFetch(`${API_BASE_URL}/api/${game}/progress`, {
      method: "POST",
      body: JSON.stringify(progressData),
    });
  } catch (err) {
    console.warn("Could not save progress:", err);
  }
}

/**
 * Fetch user info from server
 */
export async function fetchUserInfo() {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/auth/me`);
    if (res.ok) {
      const data = await res.json();
      savePlayerName(data.username);
      setUserProgress(data.progress);
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
