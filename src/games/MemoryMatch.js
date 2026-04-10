import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import Confetti from "../components/Confetti";
import ScoreDisplay from "../components/ScoreDisplay";
import PlayerNameModal from "../components/PlayerNameModal";
import { scoreMemory, submitScore, markGameCompleted } from "../utils/scoring";

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
  const [flipped, setFlipped] = useState([]); // indexes currently face-up
  const [matched, setMatched] = useState([]); // pairIds that have been matched
  const [moves, setMoves] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing");
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

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
        // Match found
        setTimeout(() => {
          setMatched((prev) => [...prev, card1.pairId]);
          setFlipped([]);
          setIsChecking(false);
        }, 500);
      } else {
        // No match - flip back
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

      setTimeout(() => setShowNameModal(true), 1500);
    }
  }, [matched, moves, elapsedTime]);

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

  const handleScoreSubmit = async (playerName) => {
    setShowNameModal(false);
    await submitScore(playerName, "memory", finalScore, elapsedTime);
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

      <div className="game-header-row">
        <Timer running={timerRunning} onTick={setElapsedTime} mode="up" startFrom={0} />
        <div className="attempts-badge">
          Moves: {moves}
        </div>
        <div className="attempts-badge attempts-badge--score">
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
      <PlayerNameModal
        visible={showNameModal}
        onSubmit={handleScoreSubmit}
        onClose={() => setShowNameModal(false)}
      />
    </div>
  );
};

export default MemoryMatch;
