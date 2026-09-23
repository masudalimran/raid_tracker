import { useState } from "react";
import { GiPoisonBottle } from "react-icons/gi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  BUFF_DESCRIPTIONS,
  DEBUFF_DESCRIPTIONS,
  ENEMY_EFFECT_DESCRIPTIONS,
  ALL_EFFECT_DESCRIPTIONS,
  DPS_EFFECT_NAMES,
  type EffectDescription,
} from "../data/buffDebuffDescriptions";

const ENEMY_GROUP_ORDER = [
  "Amius the Lunar Archon",
  "Hydra",
  "Eternal Dragon",
  "Minotaur",
  "Chimera",
  "Miscellaneous",
];

const CATEGORY_BADGE: Record<string, string> = {
  buff: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
  debuff: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  enemy: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  mechanic: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
};

function EffectCard({ effect }: { effect: EffectDescription }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex gap-3">
      {effect.icon ? (
        <img
          src={effect.icon}
          alt={effect.name}
          className="w-11 h-11 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700 shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate">{effect.name}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 capitalize ${CATEGORY_BADGE[effect.category] ?? ""}`}>
            {effect.category}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{effect.description}</p>
      </div>
    </div>
  );
}

function EffectGrid({ effects }: { effects: EffectDescription[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {effects.map((effect) => (
        <EffectCard key={`${effect.category}-${effect.name}`} effect={effect} />
      ))}
    </div>
  );
}

export default function BuffDebuffGuide() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);

  const lower = search.trim().toLowerCase();
  const matches = (effect: EffectDescription) =>
    !lower ||
    effect.name.toLowerCase().includes(lower) ||
    effect.description.toLowerCase().includes(lower);

  const dpsEffects = DPS_EFFECT_NAMES
    .map((name) => ALL_EFFECT_DESCRIPTIONS.find((e) => e.name === name))
    .filter((e): e is EffectDescription => !!e)
    .filter(matches);

  const buffs = BUFF_DESCRIPTIONS.filter(matches);
  const debuffs = DEBUFF_DESCRIPTIONS.filter(matches);
  const enemyEffects = ENEMY_EFFECT_DESCRIPTIONS.filter(matches);

  const enemyGroups = ENEMY_GROUP_ORDER
    .map((group) => ({ group, effects: enemyEffects.filter((e) => e.group === group) }))
    .filter((g) => g.effects.length > 0);

  const totalMatches = dpsEffects.length + buffs.length + debuffs.length + enemyEffects.length;

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GiPoisonBottle className="text-amber-500" size={22} />
            Buffs &amp; Debuffs
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Reference guide for every buff, debuff, and boss-specific effect in the game.
          </p>
        </div>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search effects…"
          className="basic-input w-full sm:w-64 pr-3"
        />
      </div>

      {totalMatches === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No effects match "{search}".</p>
      ) : (
        <div className="space-y-8">
          {dpsEffects.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                DPS
              </h2>
              <EffectGrid effects={dpsEffects} />
            </section>
          )}

          {buffs.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Buffs
              </h2>
              <EffectGrid effects={buffs} />
            </section>
          )}

          {debuffs.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Debuffs
              </h2>
              <EffectGrid effects={debuffs} />
            </section>
          )}

          {enemyGroups.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Boss &amp; Enemy Effects
              </h2>
              {enemyGroups.map(({ group, effects }) => (
                <div key={group} className="space-y-2">
                  <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{group}</h3>
                  <EffectGrid effects={effects} />
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
