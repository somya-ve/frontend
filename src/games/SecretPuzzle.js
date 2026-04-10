import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "../components/Confetti";
import {
  API_BASE_URL,
  authFetch,
  submitScore,
  markGameCompleted,
  getUserProgress,
} from "../utils/scoring";

const SecretPuzzle = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [clue, setClue] = useState("");
  const [inputType, setInputType] = useState("text");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const progress = getUserProgress();
  const currentScore = progress.secret?.score || 0;

  const fetchCurrentClue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/secret`);
      const data = await res.json();

      if (data.completed) {
        setCompleted(true);
        setCurrentStep(data.currentStep);
        setTotalSteps(data.totalSteps);
      } else {
        setClue(data.clue);
        setInputType(data.type || "text");
        setCurrentStep(data.currentStep);
        setTotalSteps(data.totalSteps);
      }
    } catch (err) {
      console.error("Failed to load clue", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCurrentClue();
  }, [fetchCurrentClue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/secret/verify`, {
        method: "POST",
        body: JSON.stringify({ answer: userAnswer.trim() }),
      });
      const data = await res.json();

      if (data.correct) {
        setFeedback({ text: "Correct! Moving to next clue...", isError: false });

        if (data.completed) {
          setCompleted(true);
          setShowConfetti(true);
          markGameCompleted("secret");
          await submitScore("secret", data.totalSteps * 200, 0);
        }

        setTimeout(() => {
          setFeedback(null);
          setUserAnswer("");
          if (!data.completed) {
            fetchCurrentClue();
          }
        }, 1500);
      } else {
        setFeedback({ text: "Incorrect. Try again.", isError: true });
        setTimeout(() => setFeedback(null), 2000);
      }
    } catch (err) {
      console.error("Verification error", err);
      setFeedback({ text: "Network error. Try again.", isError: true });
      setTimeout(() => setFeedback(null), 2000);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="game-page">
        <div className="leaderboard-loading">
          <div className="spinner" />
          <span>Loading puzzle...</span>
        </div>
      </div>
    );
  }

  return (
    <div id="secret-game" className="game-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="page-title">
        <h1>Secret Puzzle</h1>
        <span className="page-title-accent" />
      </div>

      {/* Score display */}
      <div className="game-header-row">
        <div className="attempts-badge attempts-badge--score">
          Score: {currentScore}
        </div>
        <div className="attempts-badge">
          Step {Math.min(currentStep + 1, totalSteps)}/{totalSteps}
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Rules */}
      <div className="instructions-card">
        <h2 className="instructions-card-header">Rules</h2>
        <ol className="instructions-list">
          <li>
            <span className="instruction-number">1</span>
            <span>Each clue leads to the next. You must solve them in order.</span>
          </li>
          <li>
            <span className="instruction-number">2</span>
            <span>Clues may require you to physically explore the venue.</span>
          </li>
          <li>
            <span className="instruction-number">3</span>
            <span>200 points are awarded for each step completed.</span>
          </li>
          <li>
            <span className="instruction-number">4</span>
            <span>No hints available. Work with your team or explore carefully.</span>
          </li>
        </ol>
      </div>

      {completed ? (
        <div className="success-card">
          <h2 className="success-card-title">Puzzle Completed!</h2>
          <p className="success-card-subtitle">
            You have solved all {totalSteps} clues in the chain.
          </p>
          <div className="score-display">
            <div className="score-display-main">
              <span className="score-label">Total Score</span>
              <span className="score-value">{totalSteps * 200}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="secret-puzzle-card">
          <div className="secret-step-label">Clue #{currentStep + 1}</div>
          <div className="secret-clue-text">{clue}</div>

          <form onSubmit={handleSubmit} className="cipher-form">
            <label className="cipher-input-label">Your Answer:</label>
            <input
              type={inputType === "number" ? "number" : "text"}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="modal-input"
              autoFocus
              id="secret-answer-input"
            />
            <button
              type="submit"
              className="btn btn--submit"
              disabled={!userAnswer.trim() || submitting}
            >
              {submitting ? "Checking..." : "Submit Answer"}
            </button>
          </form>
        </div>
      )}

      {feedback && (
        <div
          className={`feedback-banner ${
            feedback.isError ? "feedback-banner--error" : "feedback-banner--success"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <Confetti active={showConfetti} />
    </div>
  );
};

export default SecretPuzzle;
