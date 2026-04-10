import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import Confetti from "../components/Confetti";
import ScoreDisplay from "../components/ScoreDisplay";
import {
  scoreCipher,
  submitScore,
  markGameCompleted,
  API_BASE_URL,
  authFetch,
  saveProgress,
  getUserProgress,
} from "../utils/scoring";

const CipherDecoder = () => {
  const navigate = useNavigate();

  const [puzzles, setPuzzles] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing");
  const [feedback, setFeedback] = useState(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [roundResults, setRoundResults] = useState([]);

  const progress = getUserProgress();
  const savedScore = progress.cipher?.score || 0;
  const totalRounds = puzzles.length || 7;

  const fetchPuzzles = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cipher`);
      const data = await res.json();
      setPuzzles(data);

      // Restore progress if any
      const prog = getUserProgress();
      if (prog.cipher && prog.cipher.currentRound > 0 && !prog.cipher.completed) {
        setCurrentRound(prog.cipher.currentRound);
        setCorrectCount(prog.cipher.correctCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch puzzles", err);
    }
  };
// tyu
  useEffect(() => {
    fetchPuzzles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPuzzle = puzzles[currentRound];
  const encryptedText = currentPuzzle ? currentPuzzle.encrypted : "";

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentPuzzle || gameStatus !== "playing") return;

      const guess = userInput.trim().toUpperCase();

      try {
        const res = await authFetch(`${API_BASE_URL}/api/cipher/verify`, {
          method: "POST",
          body: JSON.stringify({ id: currentPuzzle.id, guess }),
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

        let newCorrect = correctCount;
        if (isCorrect) {
          newCorrect = correctCount + 1;
          setCorrectCount(newCorrect);
          setFeedback({ text: "Correct! Well decoded!", isError: false });
        } else {
          setFeedback({
            text: `Wrong! The answer was: ${data.answer || "incorrect"}`,
            isError: true,
          });
        }

        setTimeout(() => {
          setFeedback(null);
          setUserInput("");

          if (currentRound + 1 >= totalRounds) {
            setGameStatus("finished");
            setTimerRunning(false);
            const score = scoreCipher(newCorrect, totalRounds, elapsedTime);
            setFinalScore(score);
            if (newCorrect >= 3) {
              setShowConfetti(true);
              markGameCompleted("cipher");
            }
            saveProgress("cipher", {
              currentRound: currentRound + 1,
              correctCount: newCorrect,
              completed: true,
              score,
            });
            submitScore("cipher", score, elapsedTime);
          } else {
            setCurrentRound((prev) => prev + 1);
            saveProgress("cipher", {
              currentRound: currentRound + 1,
              correctCount: newCorrect,
              completed: false,
            });
          }
        }, 2000);
      } catch (err) {
        console.error("Verification error", err);
      }
    },
    [currentPuzzle, userInput, currentRound, correctCount, elapsedTime, encryptedText, gameStatus, totalRounds]
  );



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

      {/* Score + Stats */}
      <div className="game-header-row">
        <div className="attempts-badge attempts-badge--score">
          Best: {savedScore}
        </div>
        <Timer running={timerRunning} onTick={setElapsedTime} mode="up" startFrom={0} />
        <div className="attempts-badge">
          Round {Math.min(currentRound + 1, totalRounds)}/{totalRounds}
        </div>
        <div className="attempts-badge">
          {correctCount} correct
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ width: `${(currentRound / totalRounds) * 100}%` }}
        />
      </div>

      {/* Rules */}
      <div className="instructions-card">
        <h2 className="instructions-card-header">Rules</h2>
        <ol className="instructions-list">
          <li>
            <span className="instruction-number">1</span>
            <span>Each message is encrypted using a Caesar cipher (letters shifted by N positions).</span>
          </li>
          <li>
            <span className="instruction-number">2</span>
            <span>Example: With shift 3, "D" becomes "A", "E" becomes "B", etc.</span>
          </li>
          <li>
            <span className="instruction-number">3</span>
            <span>Type the decoded message in ALL CAPS. Spaces and punctuation stay the same.</span>
          </li>
        </ol>
      </div>

      {gameStatus === "playing" && currentPuzzle && (
        <div className="cipher-card">
          <div className="cipher-label">Encrypted Message:</div>
          <div className="cipher-text">{encryptedText}</div>

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
            You decoded {correctCount} out of {totalRounds} messages.
          </p>

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
              { label: "Accuracy", value: Math.round(800 * (correctCount / totalRounds)) },
              { label: "Time Bonus", value: Math.max(0, 200 - Math.floor(elapsedTime / 3)) },
            ]}
          />

        </div>
      )}

      <Confetti active={showConfetti} />
    </div>
  );
};

export default CipherDecoder;
