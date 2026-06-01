/**
 * RSL-style star display:
 *   Gold    = base star rank (1–stars)
 *   Fuchsia = ascended beyond base (stars+1–ascension_stars... wait, ascension fills from left)
 *
 * In RSL, all three share the same 6 positions, highest state wins:
 *   Red     (awaken)    takes priority
 *   Fuchsia (ascension) next
 *   Gold    (base rank) next
 *   Gray    (empty)     remainder
 */

const MAX = 6;

interface ChampionStarProps {
  stars: number;
  ascension_stars: number;
  awaken_stars: number;
}

export default function ChampionStar({
  stars = 0,
  ascension_stars = 0,
  awaken_stars = 0,
}: ChampionStarProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: MAX }, (_, i) => {
        const pos = i + 1;
        let color: string;
        if (pos <= awaken_stars)     color = "text-red-500";
        else if (pos <= ascension_stars) color = "text-fuchsia-400";
        else if (pos <= stars)       color = "text-amber-400";
        else                         color = "text-gray-600 opacity-40";

        return (
          <span key={pos} className={`text-sm leading-none ${color}`}>★</span>
        );
      })}
    </div>
  );
}
