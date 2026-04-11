import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, authFetch } from "../utils/scoring";

const GAME_LABELS = {
  dots: "Connect the Dots",
  cipher: "Cipher Decoder",
  memory: "Memory Match",
  scramble: "Word Scramble",
  secret: "Secret Puzzle",
};

// ─── Winner Banner ─────────────────────────────────────────────────────────
const WinnerBanner = () => {
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinner = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/winner`);
        if (res.ok) {
          const data = await res.json();
          setWinner(data);
        }
      } catch {
        /* silently skip if backend unavailable */
      }
      setLoading(false);
    };
    fetchWinner();
  }, []);

  if (loading) return null;
  if (!winner) return null;

  return (
    <div className="winner-banner" id="winner-banner">
      {/* Animated sparkles */}
      <div className="winner-sparkle winner-sparkle--1" aria-hidden="true" />
      <div className="winner-sparkle winner-sparkle--2" aria-hidden="true" />
      <div className="winner-sparkle winner-sparkle--3" aria-hidden="true" />

      <div className="winner-crown" aria-label="Crown">👑</div>

      <div className="winner-label">Cryptic Hunt Champion</div>

      <div className="winner-name">{winner.username}</div>

      <div className="winner-meta">
        <span className="winner-email">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 7 10-7" />
          </svg>
          {winner.email}
        </span>
        <span className="winner-score-pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {winner.score.toLocaleString()} pts
        </span>
      </div>
    </div>
  );
};

// ─── Main Leaderboard ───────────────────────────────────────────────────────
const Leaderboard = () => {
  const [scores, setScores] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadLocalScores = useCallback((currentFilter) => {
    try {
      const local = JSON.parse(localStorage.getItem("cryptic_scores") || "[]");
      const filtered =
        currentFilter === "all"
          ? local
          : local.filter((s) => s.game === currentFilter);
      setScores(filtered.sort((a, b) => b.score - a.score).slice(0, 200));
    } catch {
      setScores([]);
    }
  }, []);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        const url =
          filter === "all"
            ? `${API_BASE_URL}/api/leaderboard`
            : `${API_BASE_URL}/api/leaderboard/${filter}`;
        const res = await authFetch(url);
        if (res.ok) {
          const data = await res.json();
          setScores(data);
        } else {
          loadLocalScores(filter);
        }
      } catch {
        loadLocalScores(filter);
      }
      setLoading(false);
    };

    fetchScores();
  }, [filter, loadLocalScores]);

  const getMedal = (index) => {
    if (index === 0) return "medal-gold";
    if (index === 1) return "medal-silver";
    if (index === 2) return "medal-bronze";
    return "";
  };

  const getMedalIcon = (index) => {
    if (index === 0) return "1st";
    if (index === 1) return "2nd";
    if (index === 2) return "3rd";
    return `${index + 1}`;
  };

  return (
    <div className="leaderboard-page" id="leaderboard">
      <div className="page-title">
        <h1>Leaderboard</h1>
        <span className="page-title-accent" />
      </div>

      {/* Winner Banner */}
      <WinnerBanner />

      {/* Filter Tabs */}
      <div className="leaderboard-filters">
        <button
          className={`filter-btn ${filter === "all" ? "filter-btn--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Games
        </button>
        {Object.entries(GAME_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn ${filter === key ? "filter-btn--active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scores Table */}
      {loading ? (
        <div className="leaderboard-loading">
          <div className="spinner" />
          <span>Loading scores...</span>
        </div>
      ) : scores.length === 0 ? (
        <div className="leaderboard-empty">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No scores recorded yet.</p>
          <p className="leaderboard-empty-sub">Be the first to play and claim the top spot!</p>
        </div>
      ) : (
        <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Game</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((entry, idx) => (
                <tr key={entry.id || idx} className={`leaderboard-row ${getMedal(idx)}`}>
                  <td className="rank-cell">
                    <span className={`rank-badge ${getMedal(idx)}`}>
                      {getMedalIcon(idx)}
                    </span>
                  </td>
                  <td className="player-cell">{entry.playerName}</td>
                  <td className="game-cell">
                    {GAME_LABELS[entry.game] || entry.game}
                  </td>
                  <td className="score-cell">{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
