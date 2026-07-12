import ConfettiBurst from "./ConfettiBurst";

interface CardRevealCelebrationProps {
  championName: string;
  imgUrl?: string;
  rarity: string;
  label: string;
  onDone: () => void;
}

const RARITY_COLORS: Record<string, { mid: string; bright: string; border: string }> = {
  Mythical: { mid: "rgba(248,113,113,0.9)", bright: "#fecaca", border: "border-red-400" },
  Legendary: { mid: "rgba(251,191,36,0.9)", bright: "#fef3c7", border: "border-amber-400" },
  Epic: { mid: "rgba(168,85,247,0.9)", bright: "#e9d5ff", border: "border-purple-400" },
  Rare: { mid: "rgba(59,130,246,0.9)", bright: "#bfdbfe", border: "border-blue-400" },
  Uncommon: { mid: "rgba(34,197,94,0.9)", bright: "#bbf7d0", border: "border-green-400" },
  Common: { mid: "rgba(156,163,175,0.9)", bright: "#e5e7eb", border: "border-gray-300" },
};

// Shared "pack pull" style reveal: a tilting card with a rotating light ring
// (a couple of stars riding it) around its border, plus a confetti burst.
// Used for Legendary/Mythical shard pulls and for saving a champion. Stays
// on screen until the player taps to dismiss it.
export default function CardRevealCelebration({
  championName,
  imgUrl,
  rarity,
  label,
  onDone,
}: CardRevealCelebrationProps) {
  const colors = RARITY_COLORS[rarity] ?? RARITY_COLORS.Legendary;
  const ringGradient = `conic-gradient(from 0deg, transparent 0deg, transparent 250deg, ${colors.mid} 300deg, ${colors.bright} 330deg, ${colors.mid} 355deg, transparent 360deg)`;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/85 flex flex-col items-center justify-center gap-6 cursor-pointer"
      onClick={onDone}
    >
      <ConfettiBurst pieces={80} />

      <div className="relative w-52 h-64">
        {/* Rotating light ring hugging the card border */}
        <div
          className="absolute -inset-3 rounded-[2rem] legendary-ring"
          style={{ background: ringGradient, filter: "blur(1.5px)" }}
        />
        <div className="absolute -inset-3 legendary-ring pointer-events-none">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 text-lg" style={{ color: colors.bright }}>★</span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm" style={{ color: colors.bright }}>★</span>
        </div>

        {/* Tilting card */}
        <div
          className={`card-reveal-anim relative w-full h-full rounded-2xl overflow-hidden border-4 bg-gray-900 ${colors.border}`}
        >
          {imgUrl ? (
            <img src={imgUrl} alt={championName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-amber-400">
              {championName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="text-center reveal-pop-in">
        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-white text-2xl font-bold">{championName}</p>
        <p className="text-gray-400 text-xs mt-3">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
