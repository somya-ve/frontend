import React, { useState, useEffect, useRef, useCallback } from "react";

const Timer = ({ running, onTick, mode = "up", startFrom = 0 }) => {
  const [seconds, setSeconds] = useState(startFrom);
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    setSeconds((prev) => {
      const next = mode === "up" ? prev + 1 : prev - 1;
      if (onTick) onTick(next);
      if (mode === "down" && next <= 0) {
        clearInterval(intervalRef.current);
        return 0;
      }
      return next;
    });
  }, [mode, onTick]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  useEffect(() => {
    setSeconds(startFrom);
  }, [startFrom]);

  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;

  // Calculate progress for circular indicator (for countdown mode)
  const progress = mode === "down" && startFrom > 0 
    ? (seconds / startFrom) * 100 
    : 0;

  return (
    <div className="timer-display" id="game-timer">
      <svg className="timer-ring" viewBox="0 0 36 36">
        <path
          className="timer-ring-bg"
          d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {mode === "down" && (
          <path
            className="timer-ring-progress"
            d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={`${progress}, 100`}
            strokeLinecap="round"
          />
        )}
      </svg>
      <span className={`timer-text ${seconds <= 10 && mode === "down" ? "timer-text--danger" : ""}`}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
};

export default Timer;
