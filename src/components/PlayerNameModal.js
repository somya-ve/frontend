import React, { useState } from "react";
import { getPlayerName, savePlayerName } from "../utils/scoring";

const PlayerNameModal = ({ visible, onSubmit, onClose }) => {
  const [name, setName] = useState(getPlayerName());

  if (!visible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    savePlayerName(trimmed);
    onSubmit(trimmed);
  };

  return (
    <div className="modal-overlay" id="player-name-modal">
      <div className="modal-card">
        <h2 className="modal-title">Enter Your Name</h2>
        <p className="modal-subtitle">
          Your score will be saved to the leaderboard
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            className="modal-input"
            maxLength={20}
            autoFocus
            id="player-name-input"
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--reset"
              onClick={onClose}
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn btn--submit"
              disabled={name.trim().length < 2}
            >
              Submit Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerNameModal;
