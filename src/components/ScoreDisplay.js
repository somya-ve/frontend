import React, { useEffect, useState } from "react";

const ScoreDisplay = ({ score, breakdown, visible }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!visible || !score) return;

    // Animate the score counting up
    const duration = 1500;
    const startTime = Date.now();
    const startVal = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(startVal + (score - startVal) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, visible]);

  if (!visible) return null;

  return (
    <div className="score-display" id="score-display">
      <div className="score-display-main">
        <span className="score-label">Your Score</span>
        <span className="score-value">{displayScore}</span>
      </div>
      {breakdown && (
        <div className="score-breakdown">
          {breakdown.map((item, idx) => (
            <div key={idx} className="score-breakdown-item">
              <span className="score-breakdown-label">{item.label}</span>
              <span
                className={`score-breakdown-value ${
                  item.value >= 0
                    ? "score-breakdown-value--positive"
                    : "score-breakdown-value--negative"
                }`}
              >
                {item.value >= 0 ? "+" : ""}
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
