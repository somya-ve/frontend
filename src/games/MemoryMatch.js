import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import Confetti from "../components/Confetti";
import ScoreDisplay from "../components/ScoreDisplay";
import {
  scoreMemory,
  submitScore,
  markGameCompleted,
  saveProgress,
  getUserProgress,
} from "../utils/scoring";

// Card symbols (cryptic/puzzle themed)
const SYMBOLS = [
  { icon: "\u2660", name: "Spade" },
  { icon: "\u2666", name: "Diamond" },
  { icon: "\u2663", name: "Club" },
  { icon: "\u2665", name: "Heart" },
  { icon: "\u2605", name: "Star" },
  { icon: "\u263E", name: "Moon" },
  { icon: "\u2622", name: "Atom" },
  { icon: "\u2693", name: "Anchor" },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards() {
  const pairs = SYMBOLS.map((sym, idx) => [
    { id: idx * 2, symbol: sym.icon, name: sym.name, pairId: idx },
    { id: idx * 2 + 1, symbol: sym.icon, name: sym.name, pairId: idx },
  ]).flat();
  return shuffleArray(pairs);
}

const MemoryMatch = () => {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing");
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const progress = getUserProgress();
  const savedScore = progress.memory?.score || 0;

  // Initialize
  useEffect(() => {
    setCards(createCards());
  }, []);

  // Check for match
  useEffect(() => {
    if (flipped.length === 2) {
      setIsChecking(true);
      setMoves((prev) => prev + 1);

      const [first, second] = flipped;
      const card1 = cards[first];
      const card2 = cards[second];

      if (card1.pairId === card2.pairId) {
        setTimeout(() => {
          setMatched((prev) => [...prev, card1.pairId]);
          setFlipped([]);
          setIsChecking(false);
        }, 500);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flipped, cards]);

  // Check for win
  useEffect(() => {
    if (matched.length === SYMBOLS.length && matched.length > 0) {
      setGameStatus("finished");
      setTimerRunning(false);
      setShowConfetti(true);

      const score = scoreMemory(moves, elapsedTime);
      setFinalScore(score);
      markGameCompleted("memory");

      saveProgress("memory", { completed: true, score });
      submitScore("memory", score, elapsedTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched]);

  const handleCardClick = useCallback(
    (index) => {
      if (isChecking) return;
      if (flipped.includes(index)) return;
      if (matched.includes(cards[index]?.pairId)) return;
      if (flipped.length >= 2) return;
      if (gameStatus !== "playing") return;

      setFlipped((prev) => [...prev, index]);
    },
    [isChecking, flipped, matched, cards, gameStatus]
  );

  const resetGame = () => {
    setCards(createCards());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameStatus("playing");
    setTimerRunning(true);
    setElapsedTime(0);
    setShowConfetti(false);
    setFinalScore(null);
  };

  const isCardFlipped = (index) =>
    flipped.includes(index) || matched.includes(cards[index]?.pairId);

  return (
    <div id="memory-game" className="game-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="page-title">
        <h1>Memory Match</h1>
        <span className="page-title-accent" />
      </div>

      {/* Score + Stats */}
      <div className="game-header-row">
        <div className="attempts-badge attempts-badge--score">
          Best: {savedScore}
        </div>
        <Timer running={timerRunning} onTick={setElapsedTime} mode="up" startFrom={0} />
        <div className="attempts-badge">
          Moves: {moves}
        </div>
        <div className="attempts-badge">
          {matched.length}/{SYMBOLS.length} pairs
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ width: `${(matched.length / SYMBOLS.length) * 100}%` }}
        />
      </div>

      {/* Rules */}
      <div className="instructions-card">
        <h2 className="instructions-card-header">Rules</h2>
        <ol className="instructions-list">
          <li>
            <span className="instruction-number">1</span>
            <span>Click a card to flip it and reveal the symbol underneath.</span>
          </li>
          <li>
            <span className="instruction-number">2</span>
            <span>Flip two cards per turn. If they match, they stay revealed.</span>
          </li>
          <li>
            <span className="instruction-number">3</span>
            <span>If they don't match, they flip back. Try to remember where each symbol is.</span>
          </li>
          <li>
            <span className="instruction-number">4</span>
            <span>Match all 8 pairs. Fewer moves and faster time gives a higher score.</span>
          </li>
        </ol>
      </div>

      {/* Card Grid */}
      <div className="memory-grid">
        {cards.map((card, index) => {
          const isFlipped = isCardFlipped(index);
          const isMatched = matched.includes(card.pairId);

          return (
            <button
              key={card.id}
              className={`memory-card ${isFlipped ? "memory-card--flipped" : ""} ${
                isMatched ? "memory-card--matched" : ""
              }`}
              onClick={() => handleCardClick(index)}
              disabled={isMatched || isChecking}
              aria-label={isFlipped ? card.name : "Hidden card"}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">
                  <span className="memory-card-icon">?</span>
                </div>
                <div className="memory-card-back">
                  <span className="memory-card-symbol">{card.symbol}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {gameStatus === "playing" && (
        <div className="controls" style={{ marginTop: "20px" }}>
          <button onClick={resetGame} className="btn btn--reset">
            Restart
          </button>
        </div>
      )}

      {/* Game Over */}
      {gameStatus === "finished" && (
        <div className="success-card">
          <h2 className="success-card-title">Congratulations!</h2>
          <p className="success-card-subtitle">
            You matched all pairs in {moves} moves!
          </p>

          <ScoreDisplay
            score={finalScore}
            visible={finalScore !== null}
            breakdown={[
              { label: "Base Score", value: 600 },
              { label: "Move Penalty", value: -Math.max(0, (moves - 8) * 25) },
              { label: "Time Bonus", value: Math.max(0, 300 - Math.floor(elapsedTime)) },
            ]}
          />
          <button className="btn btn--submit" onClick={resetGame} style={{ marginTop: "16px" }}>
            Play Again
          </button>
        </div>
      )}

      <Confetti active={showConfetti} />
    </div>
  );
};

export default MemoryMatch;
