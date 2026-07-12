import ConfettiBurst from "./ConfettiBurst";

interface CardRevealCelebrationProps {
  championName: string;
  imgUrl?: string;
  rarity: string;
  label: string;
  onDone: () => void;
}

const RARITY_COLORS: Record<string, { mid: string; border: string }> = {
  Mythical: { mid: "rgba(248,113,113,0.9)", border: "border-red-400" },
  Legendary: { mid: "rgba(251,191,36,0.9)", border: "border-amber-400" },
  Epic: { mid: "rgba(168,85,247,0.9)", border: "border-purple-400" },
  Rare: { mid: "rgba(59,130,246,0.9)", border: "border-blue-400" },
  Uncommon: { mid: "rgba(34,197,94,0.9)", border: "border-green-400" },
  Common: { mid: "rgba(156,163,175,0.9)", border: "border-gray-300" },
};

// Shared "pack pull" style reveal: a tilting, glowing card with a slow
// rotating sunburst behind it and a glossy shine sweeping across its face,
// plus a confetti burst. Used for Legendary/Mythical shard pulls and for
// saving a champion. Stays on screen until the player taps to dismiss it.
export default function CardRevealCelebration({
  championName,
  imgUrl,
  rarity,
  label,
  onDone,
}: CardRevealCelebrationProps) {
  const colors = RARITY_COLORS[rarity] ?? RARITY_COLORS.Legendary;
  const sunburst = `repeating-conic-gradient(from 0deg, ${colors.mid} 0deg 3deg, transparent 3deg 18deg)`;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/85 flex flex-col items-center justify-center gap-6 cursor-pointer"
      onClick={onDone}
    >
      <ConfettiBurst pieces={80} />

      <div className="relative w-52 h-64 flex items-center justify-center">
        {/* Slow rotating sunburst glow behind the card */}
        <div
          className="absolute w-80 h-80 rounded-full card-sunburst pointer-events-none"
          style={{ background: sunburst, opacity: 0.35, filter: "blur(8px)" }}
        />

        {/* Tilting, glowing card */}
        <div
          className={`card-reveal-anim relative w-52 h-64 rounded-2xl overflow-hidden border-4 bg-gray-900 ${colors.border}`}
          style={{ boxShadow: `0 0 45px ${colors.mid}` }}
        >
          {imgUrl ? (
            <img src={imgUrl} alt={championName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-amber-400">
              {championName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Glossy shine sweep */}
          <div
            className="absolute top-0 left-0 w-1/3 h-full card-shine pointer-events-none"
            style={{ background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent)" }}
          />
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
