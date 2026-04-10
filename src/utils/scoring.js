// ─── Scoring Utilities ───

const BASE_POINTS = {
  dots: 1000,
  cipher: 800,
  memory: 600,
  scramble: 500,
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

/**
 * Submit score to backend
 */
export async function submitScore(playerName, game, score, time) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leaderboard`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ playerName, game, score, time }),
    });
    return await res.json();
  } catch (err) {
    console.warn("Could not submit score:", err);
    // Save locally as fallback
    const local = JSON.parse(localStorage.getItem("cryptic_scores") || "[]");
    local.push({ playerName, game, score, time, date: new Date().toISOString() });
    localStorage.setItem("cryptic_scores", JSON.stringify(local));
    return null;
  }
}
