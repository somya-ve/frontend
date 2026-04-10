import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCompletedGames,
  getPlayerName,
  getTotalScore,
  fetchUserInfo,
  clearAuth,
} from "../utils/scoring";

const GAMES = [
  {
    id: "dots",
    title: "Connect the Dots",
    description: "Decode coordinates from the pillar and connect 6 dots in the correct pattern.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <circle cx="40" cy="8" r="3" fill="currentColor" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <circle cx="8" cy="40" r="3" fill="currentColor" />
        <circle cx="40" cy="40" r="3" fill="currentColor" />
        <line x1="8" y1="8" x2="40" y2="8" strokeWidth="1.5" opacity="0.4" />
        <line x1="40" y1="8" x2="24" y2="24" strokeWidth="1.5" opacity="0.4" />
        <line x1="24" y1="24" x2="8" y2="40" strokeWidth="1.5" opacity="0.4" />
        <line x1="8" y1="40" x2="40" y2="40" strokeWidth="1.5" opacity="0.4" />
      </svg>
    ),
    path: "/dots",
    color: "#f97316",
    difficulty: "Medium",
  },
  {
    id: "cipher",
    title: "Cipher Decoder",
    description: "Crack Caesar-cipher encrypted messages by shifting letters backward.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="10" width="36" height="28" rx="3" />
        <path d="M6 18h36" />
        <text x="13" y="34" fontSize="12" fontWeight="bold" fill="currentColor" stroke="none">A=D</text>
      </svg>
    ),
    path: "/cipher",
    color: "#3b82f6",
    difficulty: "Hard",
  },
  {
    id: "memory",
    title: "Memory Match",
    description: "Flip cards and find matching pairs of cryptic symbols. Fewest moves wins.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="6" width="16" height="20" rx="2" />
        <rect x="28" y="6" width="16" height="20" rx="2" />
        <rect x="4" y="22" width="16" height="20" rx="2" opacity="0.4" />
        <rect x="28" y="22" width="16" height="20" rx="2" opacity="0.4" />
        <text x="8" y="20" fontSize="12" fill="currentColor" stroke="none">?</text>
        <text x="32" y="20" fontSize="12" fill="currentColor" stroke="none">?</text>
      </svg>
    ),
    path: "/memory",
    color: "#a855f7",
    difficulty: "Easy",
  },
  {
    id: "scramble",
    title: "Word Scramble",
    description: "Unscramble jumbled letters to reveal hidden words. Build streaks for bonus points.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="16" width="12" height="16" rx="2" />
        <rect x="18" y="16" width="12" height="16" rx="2" />
        <rect x="34" y="16" width="12" height="16" rx="2" />
        <text x="5" y="28" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none">C</text>
        <text x="21" y="28" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none">A</text>
        <text x="37" y="28" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none">B</text>
        <path d="M8 12l4-4 4 4" strokeWidth="1.5" opacity="0.5" />
        <path d="M32 36l4 4 4-4" strokeWidth="1.5" opacity="0.5" />
      </svg>
    ),
    path: "/scramble",
    color: "#22c55e",
    difficulty: "Medium",
  },
  {
    id: "secret",
    title: "Secret Puzzle",
    description: "A chain of clues where each answer reveals the next. Explore the venue to solve them.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="20" r="10" />
        <path d="M24 16v4l3 3" strokeWidth="2.5" />
        <rect x="20" y="34" width="8" height="6" rx="1" />
        <path d="M22 40v4M26 40v4" />
        <circle cx="24" cy="20" r="3" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    path: "/secret",
    color: "#ef4444",
    difficulty: "Expert",
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [playerName, setPlayerNameLocal] = useState("");

  useEffect(() => {
    // Refresh user info from server
    fetchUserInfo().then(() => {
      setCompleted(getCompletedGames());
      setTotalScore(getTotalScore());
      setPlayerNameLocal(getPlayerName());
    });
  }, []);

  const progressPercent = (completed.length / GAMES.length) * 100;

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="home-page" id="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Cryptic Hunt</h1>
        <p className="hero-subtitle">
          Solve puzzles, crack codes, and climb the leaderboard
        </p>
        <span className="page-title-accent" />
      </div>

      {/* User Info Bar */}
      <div className="user-info-bar">
        <div className="user-info-left">
          <span className="user-info-name">Welcome, {playerName}</span>
          <span className="user-info-score">Total Score: {totalScore}</span>
        </div>
        <button className="btn btn--reset user-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Overall Progress */}
      <div className="overall-progress">
        <div className="progress-header">
          <span className="progress-label">Hunt Progress</span>
          <span className="progress-value">{completed.length}/{GAMES.length} completed</span>
        </div>
        <div className="progress-bar-wrapper progress-bar-wrapper--large">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Game Cards */}
      <div className="game-cards-grid">
        {GAMES.map((game, index) => {
          const isCompleted = completed.includes(game.id);

          return (
            <button
              key={game.id}
              className={`game-card ${isCompleted ? "game-card--completed" : ""}`}
              onClick={() => navigate(game.path)}
              style={{
                "--card-color": game.color,
                animationDelay: `${index * 0.1}s`,
              }}
              id={`game-card-${game.id}`}
            >
              <div className="game-card-icon">{game.icon}</div>
              <div className="game-card-content">
                <h3 className="game-card-title">{game.title}</h3>
                <p className="game-card-desc">{game.description}</p>
                <div className="game-card-footer">
                  <span className={`difficulty-badge difficulty-${game.difficulty.toLowerCase()}`}>
                    {game.difficulty}
                  </span>
                  {isCompleted && (
                    <span className="completed-badge">Completed</span>
                  )}
                </div>
              </div>
              <div className="game-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Leaderboard CTA */}
      <button
        className="leaderboard-cta"
        onClick={() => navigate("/leaderboard")}
        id="leaderboard-cta"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>View Leaderboard</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default HomePage;
