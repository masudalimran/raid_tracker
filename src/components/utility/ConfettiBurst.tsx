import { useState, type CSSProperties } from "react";

const COLORS = ["#f59e0b", "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#eab308"];

interface ConfettiBurstProps {
  pieces?: number;
  className?: string;
}

function generatePieces(pieces: number) {
  return Array.from({ length: pieces }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.8 + Math.random() * 1.4,
    color: COLORS[i % COLORS.length],
    rotate: Math.round(Math.random() * 360),
    width: 6 + Math.random() * 5,
    height: 10 + Math.random() * 6,
    drift: Math.round((Math.random() - 0.5) * 220),
  }));
}

// Lightweight CSS-only confetti burst — a fixed field of small rectangles
// falling from the top of the viewport with randomized drift/rotation/timing.
// The random layout is generated once via useState's lazy initializer (the
// sanctioned place for one-off impure work) rather than useMemo, which React
// Compiler expects to stay a pure derivation of its inputs.
export default function ConfettiBurst({ pieces = 60, className = "" }: ConfettiBurstProps) {
  const [items] = useState(() => generatePieces(pieces));

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-60 ${className}`}>
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 confetti-piece rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
            "--drift": `${p.drift}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
