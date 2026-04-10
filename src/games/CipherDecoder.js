import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import Confetti from "../components/Confetti";
import ScoreDisplay from "../components/ScoreDisplay";
import PlayerNameModal from "../components/PlayerNameModal";
import { scoreCipher, submitScore, markGameCompleted, API_BASE_URL } from "../utils/scoring";

const CipherDecoder = () => {
  const navigate = useNavigate();
  const TOTAL_ROUNDS = 5;

  const [puzzles, setPuzzles] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing"); // playing, finished
  const [feedback, setFeedback] = useState(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [roundResults, setRoundResults] = useState([]);

  const fetchPuzzles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cipher?count=${TOTAL_ROUNDS}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      const data = await res.json();
      setPuzzles(data);
    } catch (err) {
      console.error("Failed to fetch puzzles", err);
    }
  };

  // Initialize puzzles
  useEffect(() => {
    fetchPuzzles();
  }, []);

  const currentPuzzle = puzzles[currentRound];
  const encryptedText = currentPuzzle ? currentPuzzle.encrypted : "";

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!currentPuzzle || gameStatus !== "playing") return;

    const guess = userInput.trim().toUpperCase();

    try {
      const res = await fetch(`${API_BASE_URL}/api/cipher/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ id: currentPuzzle.id, guess })
      });
      const data = await res.json();
      const isCorrect = data.correct;

      const result = {
        encrypted: encryptedText,
        answer: isCorrect ? data.answer : guess,
        userAnswer: guess,
        correct: isCorrect,
      };

      setRoundResults((prev) => [...prev, result]);

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
        setFeedback({ text: "Correct! Well decoded!", isError: false });
      } else {
        setFeedback({
          text: `Wrong! The answer was: ${data.answer || "incorrect"}`,
          isError: true,
        });
      }

      // Move to next round after delay
      setTimeout(() => {
        setFeedback(null);
        setUserInput("");
        setShowHint(false);

        if (currentRound + 1 >= TOTAL_ROUNDS) {
          // Game over
          setGameStatus("finished");
          setTimerRunning(false);
          const newCorrect = isCorrect ? correctCount + 1 : correctCount;
          const score = scoreCipher(newCorrect, TOTAL_ROUNDS, elapsedTime);
          setFinalScore(score);
          if (newCorrect >= 3) {
            setShowConfetti(true);
            markGameCompleted("cipher");
          }
          setTimeout(() => setShowNameModal(true), 1500);
        } else {
          setCurrentRound((prev) => prev + 1);
        }
      }, 2000);
    } catch (err) {
      console.error("Verification error", err);
    }
  }, [currentPuzzle, userInput, currentRound, correctCount, elapsedTime, encryptedText, gameStatus]);

  const resetGame = () => {
    fetchPuzzles();
    setCurrentRound(0);
    setUserInput("");
    setCorrectCount(0);
    setGameStatus("playing");
    setFeedback(null);
    setTimerRunning(true);
    setElapsedTime(0);
    setShowConfetti(false);
    setFinalScore(null);
    setShowHint(false);
    setRoundResults([]);
  };

  const handleScoreSubmit = async (playerName) => {
    setShowNameModal(false);
    await submitScore(playerName, "cipher", finalScore, elapsedTime);
  };

  if (puzzles.length === 0) return null;

  return (
    <div id="cipher-game" className="game-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="page-title">
        <h1>Cipher Decoder</h1>
        <span className="page-title-accent" />
      </div>

      <div className="game-header-row">
        <Timer running={timerRunning} onTick={setElapsedTime} mode="up" startFrom={0} />
        <div className="attempts-badge">
          Round {Math.min(currentRound + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
        </div>
        <div className="attempts-badge attempts-badge--score">
          {correctCount} correct
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentRound) / TOTAL_ROUNDS) * 100}%` }}
        />
      </div>

      {gameStatus === "playing" && currentPuzzle && (
        <div className="cipher-card">
          <div className="cipher-label">Encrypted Message:</div>
          <div className="cipher-text">{encryptedText}</div>

          <button
            className="hint-btn"
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? "Hide Hint" : "Show Hint"}
          </button>

          {showHint && (
            <div className="cipher-hint">
              Hint: {currentPuzzle.hint} | Shift: {currentPuzzle.shift}
            </div>
          )}

          <form onSubmit={handleSubmit} className="cipher-form">
            <label className="cipher-input-label">Your Decoded Message:</label>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              placeholder="Type the decoded text..."
              className="modal-input cipher-input"
              autoFocus
              id="cipher-answer-input"
            />
            <button
              type="submit"
              className="btn btn--submit"
              disabled={userInput.trim().length === 0}
            >
              Submit Answer
            </button>
          </form>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`feedback-banner ${
            feedback.isError ? "feedback-banner--error" : "feedback-banner--success"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Game Over */}
      {gameStatus === "finished" && (
        <div className="success-card">
          <h2 className="success-card-title">
            {correctCount >= 3 ? "Great Job!" : "Game Over"}
          </h2>
          <p className="success-card-subtitle">
            You decoded {correctCount} out of {TOTAL_ROUNDS} messages.
          </p>

          {/* Round summary */}
          <div className="round-summary">
            {roundResults.map((r, i) => (
              <div key={i} className={`round-result ${r.correct ? "round-result--correct" : "round-result--wrong"}`}>
                <span className="round-num">R{i + 1}</span>
                <span className="round-status">{r.correct ? "Correct" : "Wrong"}</span>
              </div>
            ))}
          </div>

          <ScoreDisplay
            score={finalScore}
            visible={finalScore !== null}
            breakdown={[
              { label: "Accuracy", value: Math.round(800 * (correctCount / TOTAL_ROUNDS)) },
              { label: "Time Bonus", value: Math.max(0, 200 - Math.floor(elapsedTime / 3)) },
            ]}
          />
          <button className="btn btn--submit" onClick={resetGame} style={{ marginTop: "16px" }}>
            Play Again
          </button>
        </div>
      )}

      <Confetti active={showConfetti} />
      <PlayerNameModal
        visible={showNameModal}
        onSubmit={handleScoreSubmit}
        onClose={() => setShowNameModal(false)}
      />
    </div>
  );
};

export default CipherDecoder;
