import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/scoring";

const GameNotActivePage = ({ children }) => {
  const [isActive, setIsActive] = useState(null); // null = loading
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/config`);
        const data = await res.json();
        setIsActive(data.isGameActive);
        setMessage(data.activeMessage || "The game is currently not active.");
      } catch {
        // If backend is down, allow access (so dev works)
        setIsActive(true);
      }
    };

    checkStatus();
    // Re-check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isActive === null) {
    return (
      <div className="game-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="leaderboard-loading">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="game-page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", textAlign: "center", padding: "24px" }}>
        <div className="secret-puzzle-card" style={{ maxWidth: "500px", padding: "40px 32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>--</div>
          <h1 style={{ color: "var(--color-orange-400)", fontSize: "1.8rem", marginBottom: "16px" }}>
            Game Not Active
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem", lineHeight: "1.7", marginBottom: "24px" }}>
            {message}
          </p>
          <div style={{ 
            background: "rgba(249, 115, 22, 0.1)", 
            border: "1px solid rgba(249, 115, 22, 0.3)", 
            borderRadius: "12px", 
            padding: "16px", 
            color: "var(--color-orange-400)",
            fontSize: "1rem"
          }}>
            <strong>Event Schedule</strong>
            <br />
            2:00 PM - 7:00 PM
          </div>
        </div>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "24px", fontSize: "0.9rem" }}>
          Team OJAS -- Cryptic Hunt
        </p>
      </div>
    );
  }

  return children;
};

export default GameNotActivePage;
