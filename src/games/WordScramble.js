import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import Confetti from "../components/Confetti";
import ScoreDisplay from "../components/ScoreDisplay";
import PlayerNameModal from "../components/PlayerNameModal";
import { scoreScramble, submitScore, markGameCompleted, API_BASE_URL } from "../utils/scoring";

const WordScramble = () => {
  const navigate = useNavigate();
  const TOTAL_WORDS = 8;

  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing");
  const [feedback, setFeedback] = useState(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [roundResults, setRoundResults] = useState([]);
  const [shakeInput, setShakeInput] = useState(false);

  const fetchWords = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scramble?count=${TOTAL_WORDS}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      const data = await res.json();
      setWords(data);
    } catch (err) {
      console.error("Failed to fetch words", err);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const currentWord = words[currentIndex];

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentWord || gameStatus !== "playing") return;

      const guess = userInput.trim().toUpperCase();
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/scramble/verify`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify({ id: currentWord.id, guess })
        });
        const data = await res.json();
        
        const isCorrect = data.correct;

        setRoundResults((prev) => [
          ...prev,
          {
            word: isCorrect ? data.answer : guess,
            scrambled: currentWord.scrambled,
            userAnswer: guess,
            correct: isCorrect,
          },
        ]);

        let newStreak = streak;
        let newCorrect = correctCount;

        if (isCorrect) {
          newCorrect = correctCount + 1;
          setCorrectCount(newCorrect);
          newStreak = streak + 1;
          setStreak(newStreak);
          if (newStreak > maxStreak) setMaxStreak(newStreak);
          setFeedback({ text: "Correct!", isError: false });
        } else {
          setStreak(0);
          newStreak = 0;
          setFeedback({
            text: `Wrong! The word was: ${data.answer || "incorrect"}`,
            isError: true,
          });
          setShakeInput(true);
          setTimeout(() => setShakeInput(false), 500);
        }

        setTimeout(() => {
          setFeedback(null);
          setUserInput("");
          setShowHint(false);

          if (currentIndex + 1 >= TOTAL_WORDS) {
            setGameStatus("finished");
            setTimerRunning(false);
            const bestStreak = Math.max(maxStreak, newStreak);
            const score = scoreScramble(newCorrect, TOTAL_WORDS, elapsedTime, bestStreak);
            setFinalScore(score);
            if (newCorrect >= 5) {
              setShowConfetti(true);
              markGameCompleted("scramble");
            }
            setTimeout(() => setShowNameModal(true), 1500);
          } else {
            setCurrentIndex((prev) => prev + 1);
          }
        }, 1500);
      } catch (err) {
        console.error("Verification failed", err);
      }
    },
    [currentWord, userInput, currentIndex, correctCount, streak, maxStreak, elapsedTime, gameStatus]
  );

  const skipWord = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scramble/skip`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ id: currentWord.id })
      });
      const data = await res.json();
      
      setRoundResults((prev) => [
        ...prev,
        {
          word: data.answer || "(skipped)",
          scrambled: currentWord.scrambled,
          userAnswer: "(skipped)",
          correct: false,
        },
      ]);
      setStreak(0);
      setUserInput("");
      setShowHint(false);

      if (currentIndex + 1 >= TOTAL_WORDS) {
        setGameStatus("finished");
        setTimerRunning(false);
        const score = scoreScramble(correctCount, TOTAL_WORDS, elapsedTime, maxStreak);
        setFinalScore(score);
        if (correctCount >= 5) {
          setShowConfetti(true);
          markGameCompleted("scramble");
        }
        setTimeout(() => setShowNameModal(true), 1500);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetGame = () => {
    fetchWords();
    setCurrentIndex(0);
    setUserInput("");
    setCorrectCount(0);
    setStreak(0);
    setMaxStreak(0);
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
    await submitScore(playerName, "scramble", finalScore, elapsedTime);
  };

  if (words.length === 0) return null;

  return (
    <div id="scramble-game" className="game-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="page-title">
        <h1>Word Scramble</h1>
        <span className="page-title-accent" />
      </div>

      <div className="game-header-row">
        <Timer running={timerRunning} onTick={setElapsedTime} mode="up" startFrom={0} />
        <div className="attempts-badge">
          {currentIndex + 1}/{TOTAL_WORDS}
        </div>
        {streak > 1 && (
          <div className="streak-badge">
            Streak: {streak}x
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ width: `${(currentIndex / TOTAL_WORDS) * 100}%` }}
        />
      </div>

      {gameStatus === "playing" && currentWord && (
        <div className="scramble-card">
          <div className="scramble-label">Unscramble this word:</div>
          <div className="scramble-letters">
            {currentWord.scrambled.split("").map((letter, i) => (
              <span key={i} className="scramble-letter" style={{ animationDelay: `${i * 0.05}s` }}>
                {letter}
              </span>
            ))}
          </div>

          <button
            className="hint-btn"
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? "Hide Hint" : "Show Hint"}
          </button>

          {showHint && (
            <div className="cipher-hint">
              Hint: {currentWord.hint}
            </div>
          )}

          <form onSubmit={handleSubmit} className="cipher-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              placeholder="Type your answer..."
              className={`modal-input ${shakeInput ? "shake" : ""}`}
              maxLength={15}
              autoFocus
              id="scramble-answer-input"
            />
            <div className="scramble-actions">
              <button
                type="button"
                className="btn btn--reset"
                onClick={skipWord}
              >
                Skip
              </button>
              <button
                type="submit"
                className="btn btn--submit"
                disabled={userInput.trim().length === 0}
              >
                Submit
              </button>
            </div>
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

      {gameStatus === "finished" && (
        <div className="success-card">
          <h2 className="success-card-title">
            {correctCount >= 5 ? "Excellent!" : "Game Over"}
          </h2>
          <p className="success-card-subtitle">
            You unscrambled {correctCount} out of {TOTAL_WORDS} words.
            {maxStreak > 1 && ` Best streak: ${maxStreak}x`}
          </p>

          <div className="round-summary">
            {roundResults.map((r, i) => (
              <div key={i} className={`round-result ${r.correct ? "round-result--correct" : "round-result--wrong"}`}>
                <span className="round-num">{r.word}</span>
                <span className="round-status">{r.correct ? "Correct" : "Wrong"}</span>
              </div>
            ))}
          </div>

          <ScoreDisplay
            score={finalScore}
            visible={finalScore !== null}
            breakdown={[
              { label: "Accuracy", value: Math.round(500 * (correctCount / TOTAL_WORDS)) },
              { label: "Time Bonus", value: Math.max(0, 200 - Math.floor(elapsedTime / 2)) },
              { label: "Streak Bonus", value: maxStreak * 30 },
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

export default WordScramble;
