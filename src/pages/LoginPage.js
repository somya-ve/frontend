import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_BASE_URL,
  setAuthToken,
  savePlayerName,
  setUserProgress,
} from "../utils/scoring";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };
    
    if (isRegister) {
      payload.username = displayName.trim();
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Save auth data
      setAuthToken(data.token);
      savePlayerName(data.username);
      setUserProgress(data.progress);

      navigate("/");
    } catch (err) {
      setError("Could not connect to server. Please try again.");
      setLoading(false);
    }
  };

  const isValidEmail = email.trim().toLowerCase().endsWith("@nith.ac.in");
  const canSubmit = isValidEmail && password.length >= 4 && (!isRegister || displayName.trim().length >= 2);

  return (
    <div className="login-page" id="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Cryptic Hunt</h1>
          <p className="login-subtitle">Team OJAS</p>
          <span className="page-title-accent" />
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button
              className={`login-tab ${!isRegister ? "login-tab--active" : ""}`}
              onClick={() => { setIsRegister(false); setError(""); }}
            >
              Login
            </button>
            <button
              className={`login-tab ${isRegister ? "login-tab--active" : ""}`}
              onClick={() => { setIsRegister(true); setError(""); }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">College Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@nith.ac.in"
                className="modal-input"
                autoFocus
                id="login-email"
              />
              {email.length > 0 && !isValidEmail && (
                <span className="login-email-hint">Only rollno@nith.ac.in emails are allowed</span>
              )}
            </div>

            {isRegister && (
              <div className="login-field">
                <label className="login-label">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Name to show on leaderboard"
                  className="modal-input"
                  maxLength={20}
                  id="login-displayname"
                />
              </div>
            )}

            <div className="login-field">
              <label className="login-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="modal-input"
                id="login-password"
              />
            </div>

            {error && (
              <div className="login-error">{error}</div>
            )}

            <button
              type="submit"
              className="btn btn--submit login-btn"
              disabled={loading || !canSubmit}
            >
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
            </button>
          </form>

          <p className="login-note">
            {isRegister
              ? "Register with your NIT Hamirpur email to save progress across the 2-day event."
              : "Login to continue your game from where you left off."}
          </p>
        </div>

        <div className="login-rules">
          <h3 className="login-rules-title">Event Rules</h3>
          <ul className="login-rules-list">
            <li>You have 2 days to complete all challenges</li>
            <li>Only NIT Hamirpur students can participate (@nith.ac.in)</li>
            <li>Each player gets a unique set of questions</li>
            <li>Your progress is saved automatically</li>
            <li>No sharing answers -- each person's questions are different</li>
            <li>Top scorers will be displayed on the leaderboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
