import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import Confetti from "../components/Confetti";
import ScoreDisplay from "../components/ScoreDisplay";
import PlayerNameModal from "../components/PlayerNameModal";
import { scoreDots, submitScore, markGameCompleted, API_BASE_URL } from "../utils/scoring";
import side2 from "../images/Side2.png";
import side3 from "../images/Side3.png";
import side4 from "../images/Side4.png";
import side5 from "../images/Side5.png";

const SUCCESS_IMAGES = {
  INFINITY: side5,
  LIGHTNING_BOLT: side2,
  S: side3,
  M: side4,
};

// ────────────────────────────────────────────
// Instructions Component
// ────────────────────────────────────────────
const Instructions = () => (
  <div className="instructions-card">
    <h2 className="instructions-card-header">How to Play</h2>
    <ol className="instructions-list">
      <li>
        <span className="instruction-number">1</span>
        <span>Create your own pattern by connecting 6 dots on the grid.</span>
      </li>
      <li>
        <span className="instruction-number">2</span>
        <span>Once you have selected 6 dots, submit your pattern to check.</span>
      </li>
      <li>
        <span className="instruction-number">3</span>
        <span>
          Coordinates for each pattern can be found on each side of the pillar
          in LH.
        </span>
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
  currentChallenge,
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
          // For the guessing phase, we don't know correctCoords immediately since backend returns it later.
          // The line drawing just works as selection.
          const isSelected = selectedDots.includes(coord);

          // Determine dot variant
          let dotClass = "dot-btn dot-btn--default";
          if (isSelected) {
            dotClass = "dot-btn dot-btn--correct"; // Or just highlight as selected
          }

          // Calculate dot size based on cell size
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
  
  // Game state
  const [selectedDots, setSelectedDots] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState("INFINITY");
  const [gameStatus, setGameStatus] = useState("drawing"); // drawing, riddle, success
  const [feedback, setFeedback] = useState({ text: "", isError: false });
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [gridSize, setGridSize] = useState({ width: 320, height: 320 });
  const [dotSize, setDotSize] = useState(6);
  const [cellSize, setCellSize] = useState(32);
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [patternsList, setPatternsList] = useState(null);

  const fetchPatterns = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dots`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      const data = await res.json();
      setPatternsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const canvasRef = useRef(null);
  const dotsRef = useRef({});
  const gridContainerRef = useRef(null);

  // Calculate responsive grid size
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

  // Initialize dots data
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

  // Drawing functions
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
        drawLine(dot1.x, dot1.y, dot2.x, dot2.y, true); // True just for color visibility
      }
    }
  }, [clearLines, drawLine, selectedDots]);

  // Redraw lines when selected dots change or when grid size changes
  useEffect(() => {
    redrawLines();
  }, [redrawLines, gridSize]);

  const handleDotClick = (coord) => {
    if (gameStatus !== "drawing") return;

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
    setTimerRunning(true);
    setElapsedTime(0);
    setShowConfetti(false);
    setFinalScore(null);
    clearLines();
  };

  const handleSelectChallenge = (challengeKey) => {
    setCurrentChallenge(challengeKey);
    resetGame();
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
      const res = await fetch(`${API_BASE_URL}/api/dots/verify`, {
        method: "POST",
        headers: { 
          "Content-Type" : "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ id: currentChallenge, selectedDots })
      });
      const data = await res.json();
      const isCorrect = data.correct;

      if (isCorrect) {
        setGameStatus("riddle");
        setTimerRunning(false);
        setShowConfetti(true);

        const score = scoreDots(attemptsCount, elapsedTime);
        setFinalScore(score);
        markGameCompleted("dots");

        setFeedback({
          text: "Pattern correct -- here is one part of the QR Code.",
          isError: false,
        });

        // Show name modal after a short delay
        setTimeout(() => setShowNameModal(true), 2000);
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

  const handleScoreSubmit = async (playerName) => {
    setShowNameModal(false);
    await submitScore(playerName, "dots", finalScore, elapsedTime);
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
        <Timer running={timerRunning} onTick={setElapsedTime} mode="up" startFrom={0} />
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
              currentChallenge={currentChallenge}
              gridSize={gridSize}
              cellSize={cellSize}
              dotSize={dotSize}
            />
          </div>
        </div>
      </div>

      <SelectionTrail selectedDots={selectedDots} />

      {gameStatus === "drawing" && (
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
          <div className="success-card-image-wrapper">
            <img
              src={SUCCESS_IMAGES[currentChallenge]}
              alt={`${patternsList?.[currentChallenge]?.displayName} QR fragment`}
              className="success-card-image"
            />
          </div>
          <ScoreDisplay
            score={finalScore}
            visible={finalScore !== null}
            breakdown={[
              { label: "Base Score", value: 1000 },
              { label: "Attempt Penalty", value: -Math.max(0, (attemptsCount - 1) * 150) },
              { label: "Time Bonus", value: Math.max(0, 300 - Math.floor(elapsedTime / 2)) },
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

export default ConnectTheDots;
