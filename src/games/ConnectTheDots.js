import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import Confetti from "../components/Confetti";
import ScoreDisplay from "../components/ScoreDisplay";
import {
  submitScore,
  markGameCompleted,
  API_BASE_URL,
  authFetch,
  saveProgress,
  getUserProgress,
} from "../utils/scoring";


// ────────────────────────────────────────────
// Instructions Component
// ────────────────────────────────────────────
const Instructions = () => (
  <div className="instructions-card">
    <h2 className="instructions-card-header">Rules</h2>
    <ol className="instructions-list">
      <li>
        <span className="instruction-number">1</span>
        <span>Select a side/pattern from the buttons below.</span>
      </li>
      <li>
        <span className="instruction-number">2</span>
        <span>Click exactly 6 dots on the grid to form the correct pattern.</span>
      </li>
      <li>
        <span className="instruction-number">3</span>
        <span>Solve the riddle to identify the starting coordinate. You can reveal hints that guide you to the remaining dots.</span>
      </li>
      <li>
        <span className="instruction-number">4</span>
        <span>Grid uses rows A-J (top to bottom) and columns 1-10 (left to right). Example: "B3" means row B, column 3. Revealing hints costs 50 points each.</span>
      </li>
      <li>
        <span className="instruction-number">5</span>
        <span>Click a selected dot to deselect it. Click Reset to start over.</span>
      </li>
    </ol>
  </div>
);

// ────────────────────────────────────────────
// Challenge Selection Component
// ────────────────────────────────────────────
const ChallengeSelector = ({ onSelectChallenge, currentChallenge, patternsList }) => {
  if (!patternsList) return null;
  return (
    <div className="challenge-selector">
      {Object.entries(patternsList).map(([key, pattern]) => (
        <button
          key={key}
          onClick={() => onSelectChallenge(key)}
          className={`challenge-btn ${
            currentChallenge === key ? "challenge-btn--active" : ""
          }`}
        >
          <span>{pattern.displayName}</span>
        </button>
      ))}
    </div>
  );
};

// ────────────────────────────────────────────
// Selection Trail Component
// ────────────────────────────────────────────
const SelectionTrail = ({ selectedDots }) => (
  <div className="selection-trail">
    <span className="selection-trail-label">Path:</span>
    {selectedDots.length === 0 ? (
      <span className="selection-trail-empty">Select dots to begin</span>
    ) : (
      selectedDots.map((dot, idx) => (
        <React.Fragment key={dot}>
          <span className="selection-trail-dot">{dot}</span>
          {idx < selectedDots.length - 1 && (
            <span className="selection-trail-arrow">&rarr;</span>
          )}
        </React.Fragment>
      ))
    )}
  </div>
);

// ────────────────────────────────────────────
// Row Labels Component
// ────────────────────────────────────────────
const RowLabels = ({ cellSize }) => {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const labelSize = Math.max(Math.floor(cellSize / 2), 20);

  return (
    <div
      className="row-labels"
      style={{ top: "20px", marginLeft: `-${labelSize}px` }}
    >
      {rows.map((row) => (
        <div
          key={row}
          className="row-label"
          style={{
            width: `${labelSize}px`,
            height: `${cellSize}px`,
          }}
        >
          {row}
        </div>
      ))}
    </div>
  );
};

// ────────────────────────────────────────────
// Column Labels Component
// ────────────────────────────────────────────
const ColumnLabels = ({ cellSize }) => {
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="col-labels">
      {columns.map((col) => (
        <div
          key={col}
          className="col-label"
          style={{ width: `${cellSize}px`, height: "20px" }}
        >
          {col}
        </div>
      ))}
    </div>
  );
};

// ────────────────────────────────────────────
// Grid Component
// ────────────────────────────────────────────
const Grid = ({
  selectedDots,
  onDotClick,
  gridSize,
  cellSize,
  dotSize,
}) => {
  const rows = "ABCDEFGHIJ";

  return (
    <div
      className="dots-grid"
      style={{
        gridTemplateColumns: `repeat(10, ${cellSize}px)`,
        gridTemplateRows: `repeat(10, ${cellSize}px)`,
        width: `${gridSize.width}px`,
        height: `${gridSize.height}px`,
        top: "20px",
        left: "0",
      }}
    >
      {Array.from({ length: 10 }, (_, i) =>
        Array.from({ length: 10 }, (_, j) => {
          const coord = `${rows[i]}${j + 1}`;
          const isSelected = selectedDots.includes(coord);

          let dotClass = "dot-btn dot-btn--default";
          if (isSelected) {
            dotClass = "dot-btn dot-btn--correct";
          }

          const actualDotSize = dotSize * 2;

          return (
            <div
              key={coord}
              className="dot-cell"
              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
            >
              <button
                className={dotClass}
                style={{
                  width: `${actualDotSize}px`,
                  height: `${actualDotSize}px`,
                }}
                onClick={() => onDotClick(coord)}
                aria-label={`Dot ${coord}`}
              />
            </div>
          );
        })
      ).flat()}
    </div>
  );
};

// ────────────────────────────────────────────
// Main Game Component
// ────────────────────────────────────────────
const ConnectTheDots = () => {
  const navigate = useNavigate();

  const [selectedDots, setSelectedDots] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState("INFINITY");
  const [gameStatus, setGameStatus] = useState("drawing");
  const [feedback, setFeedback] = useState({ text: "", isError: false });
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [gridSize, setGridSize] = useState({ width: 320, height: 320 });
  const [dotSize, setDotSize] = useState(6);
  const [cellSize, setCellSize] = useState(32);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [patternsList, setPatternsList] = useState(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const questionStateRef = useRef({});

  const progress = getUserProgress();
  const savedScore = progress.dots?.score || 0;
  const solvedQuestions = progress.dots?.solvedQuestions || [];
  const savedQuestionState = progress.dots?.questionState || {};
  const isCurrentlySolved = solvedQuestions.includes(currentChallenge) || gameStatus === "riddle";

  // Initialize liveScore and questionState from saved progress on mount
  useEffect(() => {
    setLiveScore(savedScore);
    questionStateRef.current = { ...savedQuestionState };
    // Restore state for first question (INFINITY)
    const initState = savedQuestionState["INFINITY"];
    if (initState) {
      setHintsRevealed(initState.hints || 0);
      setAttemptsCount(initState.attempts || 0);
      setElapsedTime(initState.timer || 0);
      setTimerKey(k => k + 1);
    }
    if (!solvedQuestions.includes("INFINITY")) {
      setTimerRunning(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPatterns = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/dots`);
      const data = await res.json();
      setPatternsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPatterns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canvasRef = useRef(null);
  const dotsRef = useRef({});
  const gridContainerRef = useRef(null);

  useEffect(() => {
    const updateGridSize = () => {
      if (gridContainerRef.current) {
        const containerWidth = gridContainerRef.current.clientWidth;
        const size = Math.min(containerWidth, 400);
        setGridSize({ width: size, height: size });

        const newCellSize = Math.floor(size / 10);
        setCellSize(newCellSize);
        setDotSize(Math.max(6, Math.floor(newCellSize / 8)));
      }
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  useEffect(() => {
    const rows = "ABCDEFGHIJ";
    const dots = {};

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const coord = `${rows[i]}${j + 1}`;
        dots[coord] = {
          x: j * cellSize + cellSize / 2,
          y: i * cellSize + cellSize / 2,
          row: i,
          col: j,
        };
      }
    }

    dotsRef.current = dots;
  }, [cellSize]);

  const clearLines = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const drawLine = useCallback((x1, y1, x2, y2, isCorrect = null) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (isCorrect === true) {
        ctx.strokeStyle = "#22c55e";
      } else if (isCorrect === false) {
        ctx.strokeStyle = "#ef4444";
      } else {
        ctx.strokeStyle = "#f97316";
      }

      const lineWidth = Math.max(2, Math.floor(gridSize.width / 150));
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }, [gridSize.width]);

  const redrawLines = useCallback(() => {
    clearLines();
    for (let i = 0; i < selectedDots.length - 1; i++) {
      const dot1 = dotsRef.current[selectedDots[i]];
      const dot2 = dotsRef.current[selectedDots[i + 1]];

      if (dot1 && dot2) {
        drawLine(dot1.x, dot1.y, dot2.x, dot2.y, true);
      }
    }
  }, [clearLines, drawLine, selectedDots]);

  useEffect(() => {
    redrawLines();
  }, [redrawLines, gridSize]);

  const handleDotClick = (coord) => {
    if (gameStatus !== "drawing" || isCurrentlySolved) return;

    if (selectedDots.includes(coord)) {
      const index = selectedDots.indexOf(coord);
      setSelectedDots((prev) => prev.slice(0, index));
    } else if (selectedDots.length < 6) {
      setSelectedDots((prev) => [...prev, coord]);
    } else {
      setFeedback({
        text: "You can only select 6 dots. Reset to start over.",
        isError: true,
      });
      setTimeout(() => setFeedback({ text: "", isError: false }), 3000);
    }
  };

  const resetGame = () => {
    setSelectedDots([]);
    setGameStatus("drawing");
    setFeedback({ text: "", isError: false });
    setShowConfetti(false);
    setFinalScore(null);
    clearLines();
  };

  // Save current question's timer/hints/attempts before switching
  const saveCurrentQuestionState = useCallback(() => {
    questionStateRef.current[currentChallenge] = {
      timer: elapsedTime,
      hints: hintsRevealed,
      attempts: attemptsCount,
    };
    // Persist to backend
    saveProgress("dots", {
      score: liveScore,
      questionState: { [currentChallenge]: questionStateRef.current[currentChallenge] }
    });
  }, [currentChallenge, elapsedTime, hintsRevealed, attemptsCount, liveScore]);

  const handleSelectChallenge = (challengeKey) => {
    // Save state of current question
    saveCurrentQuestionState();

    // Switch to new question
    setCurrentChallenge(challengeKey);
    resetGame();

    // Restore saved state for the new question
    const saved = questionStateRef.current[challengeKey];
    if (saved) {
      setHintsRevealed(saved.hints || 0);
      setAttemptsCount(saved.attempts || 0);
      setElapsedTime(saved.timer || 0);
    } else {
      setHintsRevealed(0);
      setAttemptsCount(0);
      setElapsedTime(0);
    }
    setTimerKey(k => k + 1);

    // Only start timer if question is not already solved
    if (!solvedQuestions.includes(challengeKey)) {
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
    }
  };

  const checkPattern = async () => {
    if (selectedDots.length !== 6) {
      setFeedback({
        text: "You must select exactly 6 dots.",
        isError: true,
      });
      setTimeout(() => setFeedback({ text: "", isError: false }), 3000);
      return;
    }

    setAttemptsCount((prev) => prev + 1);

    try {
      const res = await authFetch(`${API_BASE_URL}/api/dots/verify`, {
        method: "POST",
        body: JSON.stringify({ id: currentChallenge, selectedDots }),
      });
      const data = await res.json();
      const isCorrect = data.correct;

      if (isCorrect) {
        setGameStatus("riddle");
        setTimerRunning(false);
        setShowConfetti(true);

        const attemptPenalty = Math.max(0, (attemptsCount - 1) * 25);
        const timeBonus = Math.max(0, 100 - Math.floor(elapsedTime / 4));
        // Hint penalty already deducted from liveScore, so just calc base + time - attempts
        const questionScore = Math.max(0, 250 - attemptPenalty + timeBonus - (hintsRevealed * 50));
        
        // The score to add is questionScore (hints already deducted from liveScore,
        // so we add back the base amount minus hint cost)
        const accumulatedScore = liveScore + 250 - (hintsRevealed * 50) + timeBonus - attemptPenalty;
        const finalAccumulated = Math.max(0, accumulatedScore);

        setFinalScore(questionScore);
        setLiveScore(finalAccumulated);
        markGameCompleted("dots");

        setFeedback({
          text: "Pattern correct -- Question solved!",
          isError: false,
        });

        saveProgress("dots", {
          score: finalAccumulated,
          attempts: attemptsCount + 1,
          solvedQuestion: currentChallenge
        });
        
        submitScore("dots", finalAccumulated, elapsedTime);
      } else {
        setFeedback({
          text: `Incorrect pattern. Try again. (Attempt ${attemptsCount + 1})`,
          isError: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="game-root" className="game-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="page-title">
        <h1>Connect the Dots Challenge</h1>
        <span className="page-title-accent" />
      </div>

      <div className="game-header-row">
        <div className="attempts-badge attempts-badge--score">
          Score: {liveScore}
        </div>
        <Timer key={timerKey} running={timerRunning} onTick={setElapsedTime} mode="up" startFrom={elapsedTime} />
        <div className="attempts-badge">
          Attempts: {attemptsCount}
        </div>
      </div>

      <Instructions />

      <ChallengeSelector
        onSelectChallenge={handleSelectChallenge}
        currentChallenge={currentChallenge}
        patternsList={patternsList}
      />

      {patternsList && patternsList[currentChallenge] && (
        <div className="secret-puzzle-card" style={{ marginBottom: "20px" }}>
          <div className="secret-clue-text" style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
            <strong>Question: </strong>{patternsList[currentChallenge].riddleText}
          </div>
          
          <div className="hints-section" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {patternsList[currentChallenge].hints?.slice(0, hintsRevealed).map((hint, i) => (
              <div key={i} className="hint-banner" style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.3)", padding: "10px", borderRadius: "8px", color: "var(--color-orange-400)" }}>
                <strong>Hint {i + 1}:</strong> {hint}
              </div>
            ))}
            
            {hintsRevealed < (patternsList[currentChallenge].hints?.length || 0) && gameStatus === "drawing" && !isCurrentlySolved && (
              <button 
                className="btn btn--reset" 
                onClick={() => {
                  setHintsRevealed(h => h + 1);
                  const newScore = Math.max(0, liveScore - 50);
                  setLiveScore(newScore);
                  // Immediately persist the deduction
                  saveProgress("dots", {
                    score: newScore,
                    questionState: { [currentChallenge]: {
                      timer: elapsedTime,
                      hints: hintsRevealed + 1,
                      attempts: attemptsCount,
                    }}
                  });
                  submitScore("dots", newScore, elapsedTime);
                }}
                style={{ alignSelf: "flex-start", marginTop: "8px" }}
              >
                Reveal Hint (-50 pts)
              </button>
            )}
          </div>
        </div>
      )}

      <div ref={gridContainerRef} className="grid-wrapper">
        <div className="grid-frame">
          <div
            className="grid-inner"
            style={{
              width: `${gridSize.width}px`,
              height: `${gridSize.height + 25}px`,
            }}
          >
            <RowLabels cellSize={cellSize} />
            <ColumnLabels cellSize={cellSize} />

            <canvas
              ref={canvasRef}
              width={gridSize.width}
              height={gridSize.height}
              className="grid-canvas"
              style={{ top: "20px", left: "0" }}
            />

            <Grid
              selectedDots={selectedDots}
              onDotClick={handleDotClick}
              gridSize={gridSize}
              cellSize={cellSize}
              dotSize={dotSize}
            />
          </div>
        </div>
      </div>

      <SelectionTrail selectedDots={selectedDots} />

      {isCurrentlySolved && (
        <div className="feedback-banner feedback-banner--success" style={{ marginTop: "16px" }}>
          You have already solved this question. Great job!
        </div>
      )}

      {!isCurrentlySolved && gameStatus === "drawing" && (
        <div className="controls">
          <button onClick={resetGame} className="btn btn--reset">
            Reset
          </button>
          <button
            onClick={checkPattern}
            disabled={selectedDots.length !== 6}
            className={`btn ${
              selectedDots.length !== 6 ? "btn--disabled" : "btn--submit"
            }`}
          >
            Check Pattern
          </button>
        </div>
      )}

      {feedback.text && (
        <div
          className={`feedback-banner ${
            feedback.isError
              ? "feedback-banner--error"
              : "feedback-banner--success"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {gameStatus === "riddle" && (
        <div className="success-card">
          <h2 className="success-card-title">Well Done</h2>
          <p className="success-card-subtitle">
            You have solved the {patternsList?.[currentChallenge]?.displayName}{" "}
            challenge.
          </p>

          <ScoreDisplay
            score={finalScore}
            visible={finalScore !== null}
            breakdown={[
              { label: "Base Score", value: 1000 },
              { label: "Attempt Penalty", value: -Math.max(0, (attemptsCount - 1) * 150) },
              { label: "Time Bonus", value: Math.max(0, 300 - Math.floor(elapsedTime / 2)) },
              { label: "Hint Penalty", value: -(hintsRevealed * 50) },
            ]}
          />

        </div>
      )}

      <Confetti active={showConfetti} />
    </div>
  );
};

export default ConnectTheDots;
