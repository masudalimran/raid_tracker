/**
 * Combined star selector matching RSL's visual language:
 *   Gold   = base star rank  (1–6)
 *   Pink   = ascension level (0–stars)
 *   Red    = awaken level    (0–ascension)
 *
 * All three share the same 6 positions. Positions beyond the parent tier
 * are dimmed and unclickable. Clicking the active star deselects/decrements it.
 */

interface RaidStarInputProps {
  stars: number;
  ascension: number;
  awaken: number;
  onStarsChange: (v: number) => void;
  onAscensionChange: (v: number) => void;
  onAwakenChange: (v: number) => void;
}

const MAX = 6;

interface StarRowProps {
  label: string;
  value: number;
  max: number;          // positions that are clickable
  activeColor: string;  // Tailwind text colour for filled stars
  dimColor: string;     // colour for stars beyond max
  minValue?: number;    // lowest allowed value (default 0)
  onChange: (v: number) => void;
}

function StarRow({ label, value, max, activeColor, dimColor, minValue = 0, onChange }: StarRowProps) {
  const handleClick = (n: number) => {
    if (n > max) return;
    if (n === value) {
      // clicking the current star goes down by one (minimum minValue)
      onChange(Math.max(n - 1, minValue));
    } else {
      onChange(n);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-20 shrink-0 text-right">
        {label}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: MAX }, (_, i) => i + 1).map((n) => {
          const filled   = n <= value;
          const inRange  = n <= max;
          const disabled = !inRange;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(n)}
              title={disabled ? `Unlock by raising ${label === "Ascension" ? "Stars" : "Ascension"} first` : `Set ${label} to ${n}`}
              className={`text-2xl leading-none transition-transform
                ${disabled
                  ? `${dimColor} opacity-20 cursor-not-allowed`
                  : `cursor-pointer hover:scale-110 ${filled ? activeColor : "text-gray-200"}`
                }`}
            >
              ★
            </button>
          );
        })}
      </div>
      <span className="text-[10px] text-gray-400 tabular-nums">
        {value}<span className="text-gray-300">/{max}</span>
      </span>
    </div>
  );
}

export default function RaidStarInput({
  stars,
  ascension,
  awaken,
  onStarsChange,
  onAscensionChange,
  onAwakenChange,
}: RaidStarInputProps) {
  const handleStarsChange = (v: number) => {
    onStarsChange(v);
    // cascade: cap ascension and awaken if stars shrinks
    if (ascension > v) onAscensionChange(v);
    if (awaken   > v) onAwakenChange(v);
  };

  const handleAscensionChange = (v: number) => {
    onAscensionChange(v);
    if (awaken > v) onAwakenChange(v);
  };

  return (
    <div className="space-y-2 py-1">
      <StarRow
        label="Stars"
        value={stars}
        max={MAX}
        activeColor="text-amber-400"
        dimColor="text-amber-200"
        minValue={1}
        onChange={handleStarsChange}
      />
      <StarRow
        label="Ascension"
        value={ascension}
        max={stars}
        activeColor="text-fuchsia-500"
        dimColor="text-fuchsia-300"
        minValue={0}
        onChange={handleAscensionChange}
      />
      <StarRow
        label="Awakened"
        value={awaken}
        max={ascension}
        activeColor="text-red-500"
        dimColor="text-red-300"
        minValue={0}
        onChange={onAwakenChange}
      />
    </div>
  );
}
