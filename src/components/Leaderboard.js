import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../utils/scoring";

const GAME_LABELS = {
  dots: "Connect the Dots",
  cipher: "Cipher Decoder",
  memory: "Memory Match",
  scramble: "Word Scramble",
};

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
      setScores(filtered.sort((a, b) => b.score - a.score).slice(0, 50));
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
        const res = await fetch(url, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
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
