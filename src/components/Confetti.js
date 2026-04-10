import React, { useEffect, useState } from "react";

const PARTICLE_COUNT = 60;

const randomBetween = (a, b) => Math.random() * (b - a) + a;

const Confetti = ({ active }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (active) {
      const colors = ["#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#ec4899"];
      const newParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: randomBetween(5, 95),
        y: randomBetween(-20, -5),
        size: randomBetween(6, 12),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: randomBetween(0, 360),
        delay: randomBetween(0, 0.8),
        duration: randomBetween(1.8, 3.5),
        drift: randomBetween(-30, 30),
        shape: Math.random() > 0.5 ? "circle" : "rect",
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`confetti-particle confetti-${p.shape}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: p.shape === "rect" ? `${p.size * 0.6}px` : `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
