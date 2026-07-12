import { useEffect, useState } from "react";
import { GiPortal } from "react-icons/gi";

const TIPS = [
  "Summoning champions…",
  "Charging turn meter…",
  "Rolling for Legendary…",
  "Polishing gear sets…",
  "Reading ancient scrolls…",
  "Counting shards…",
  "Tuning speed builds…",
];

interface ArcaneLoaderProps {
  /** Short line under the spinner, e.g. "Loading your roster" */
  label?: string;
  className?: string;
}

// App-wide themed loading screen — a spinning arcane portal with cycling
// flavor text, replacing the old generic champion-card skeleton that was
// reused (and mismatched) on every page regardless of what actually loads.
export default function ArcaneLoader({ label = "Loading", className = "" }: ArcaneLoaderProps) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-5 py-20 ${className}`}>
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Outer ring — clockwise */}
        <div
          className="absolute inset-0 rounded-full legendary-ring"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 260deg, rgba(251,191,36,0.9) 300deg, #fde68a 330deg, rgba(251,191,36,0.9) 355deg, transparent 360deg)",
            filter: "blur(1px)",
          }}
        />
        {/* Inner ring — counter-clockwise, different speed */}
        <div
          className="absolute inset-3 rounded-full legendary-ring-reverse"
          style={{
            background:
              "conic-gradient(from 180deg, transparent 0deg, transparent 260deg, rgba(217,119,6,0.85) 300deg, #fbbf24 330deg, rgba(217,119,6,0.85) 355deg, transparent 360deg)",
          }}
        />
        {/* Center emblem */}
        <div className="relative z-10 w-14 h-14 rounded-full bg-gray-900 border-2 border-amber-400/60 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <GiPortal className="text-amber-400 animate-pulse" size={26} />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <p className="text-xs text-amber-600 mt-1 h-4">{TIPS[tipIndex]}</p>
      </div>
    </div>
  );
}
