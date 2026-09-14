import { useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp, FaLayerGroup } from "react-icons/fa";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import ChampionCard from "../components/card/ChampionCard";
import ChampionIndexCard from "../components/card/ChampionIndexCard";
import ChampionModal from "../components/modals/ChampionModal";
import Modal from "../components/modals/Modal";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";
import { getTierListForFaction, type ChampionTierEntry } from "../helpers/getChampionTierScore";
import getFactionLogo from "../helpers/getFactionLogo";
import { ChampionFaction } from "../models/ChampionFaction";
import { ChampionRarity } from "../models/ChampionRarity";
import type IChampion from "../models/IChampion";

// Only rarities the tier list actually tracks — Mythical/Uncommon/Common have
// no static roster reference yet, so there's nothing to compare "owned" against.
const INDEX_RARITIES: ChampionRarity[] = [ChampionRarity.LEGENDARY, ChampionRarity.EPIC, ChampionRarity.RARE];
const FACTIONS = Object.values(ChampionFaction).filter((f) => f !== ChampionFaction.OTHER);

interface IndexEntry {
  key: string;
  name: string;
  affinity: string;
  role: string;
  owned: boolean;
  imgUrl?: string;
  score?: Pick<ChampionTierEntry, "support" | "dpsPotential" | "tankiness">;
  /** The actual roster champion, when owned — lets the card open a real preview popup. */
  champion?: IChampion;
}

interface RarityGroup {
  rarity: ChampionRarity;
  entries: IndexEntry[];
}

// Union of every known tier-list champion for this faction+rarity with whatever
// the account actually owns — so an owned champion missing from the static
// data still shows up (just without a tier score), and a tier-list champion
// not yet pulled shows up as a "missing" placeholder.
function buildIndexEntries(tierEntries: ChampionTierEntry[], owned: IChampion[]): IndexEntry[] {
  const ownedByName = new Map(owned.map((c) => [c.name.trim().toLowerCase(), c]));
  const seen = new Set<string>();
  const entries: IndexEntry[] = [];

  for (const t of tierEntries) {
    const key = t.champion.trim().toLowerCase();
    seen.add(key);
    const match = ownedByName.get(key);
    entries.push({
      key,
      name: t.champion,
      affinity: t.affinity,
      role: t.role,
      owned: !!match,
      imgUrl: match?.imgUrl,
      score: { support: t.support, dpsPotential: t.dpsPotential, tankiness: t.tankiness },
      champion: match,
    });
  }

  for (const c of owned) {
    const key = c.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    entries.push({
      key,
      name: c.name,
      affinity: c.affinity,
      role: c.type,
      owned: true,
      imgUrl: c.imgUrl,
      champion: c,
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

function ownedCount(entries: IndexEntry[]): number {
  return entries.filter((e) => e.owned).length;
}

function FactionSection({
  faction,
  rarityGroups,
  isOpen,
  onToggle,
  onSelectChampion,
}: {
  faction: ChampionFaction;
  rarityGroups: RarityGroup[];
  isOpen: boolean;
  onToggle: () => void;
  onSelectChampion: (champion: IChampion) => void;
}) {
  const totalOwned = rarityGroups.reduce((sum, r) => sum + ownedCount(r.entries), 0);
  const totalKnown = rarityGroups.reduce((sum, r) => sum + r.entries.length, 0);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left cursor-pointer"
      >
        <img src={getFactionLogo(faction)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{faction}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
            {rarityGroups.map(({ rarity, entries }) => (
              <span key={rarity}>
                {rarity}: {ownedCount(entries)}/{entries.length}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
          {totalOwned}/{totalKnown}
        </span>
        {isOpen ? <FaChevronUp size={12} className="text-gray-400 shrink-0" /> : <FaChevronDown size={12} className="text-gray-400 shrink-0" />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-5 border-t border-gray-100 dark:border-gray-800">
          {rarityGroups.map(({ rarity, entries }) => (
            <div key={rarity}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                {rarity} — {ownedCount(entries)}/{entries.length} owned
              </p>
              {entries.length === 0 ? (
                <p className="text-xs text-gray-300 dark:text-gray-600">No data yet.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {entries.map((e) => (
                    <ChampionIndexCard
                      key={e.key}
                      name={e.name}
                      affinity={e.affinity}
                      role={e.role}
                      faction={faction}
                      owned={e.owned}
                      imgUrl={e.imgUrl}
                      support={e.score?.support}
                      dpsPotential={e.score?.dpsPotential}
                      tankiness={e.score?.tankiness}
                      onClick={e.champion ? () => onSelectChampion(e.champion!) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChampionIndex() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [openFactions, setOpenFactions] = useState<Set<string>>(new Set());
  const [previewChampion, setPreviewChampion] = useState<IChampion | null>(null);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [reloadDetector, setReloadDetector] = useState(false);

  useEffect(() => {
    const load = async () => {
      await fetchChampions();
      const champs = await generateChampions();
      setChampions(champs);
      setLoading(false);
    };
    load();
  }, [reloadDetector]);

  const handleEditChampion = (champion: IChampion) => {
    setPreviewChampion(null);
    setEditingChampion(champion);
    setShowEditModal(true);
  };
  const handleCloseEditModal = (shouldReload: boolean) => {
    setShowEditModal(false);
    setEditingChampion(null);
    if (shouldReload) setReloadDetector((prev) => !prev);
  };
  const handleDeletePreviewChampion = () => {
    setPreviewChampion(null);
    setReloadDetector((prev) => !prev);
  };

  const championsByFaction = useMemo(() => {
    const map = new Map<string, Record<ChampionRarity, IChampion[]>>();
    for (const faction of FACTIONS) {
      map.set(faction, {
        [ChampionRarity.LEGENDARY]: [],
        [ChampionRarity.EPIC]: [],
        [ChampionRarity.RARE]: [],
        [ChampionRarity.MYTHICAL]: [],
        [ChampionRarity.UNCOMMON]: [],
        [ChampionRarity.COMMON]: [],
      } as Record<ChampionRarity, IChampion[]>);
    }
    for (const c of champions) {
      map.get(c.faction)?.[c.rarity]?.push(c);
    }
    return map;
  }, [champions]);

  // Built once for the whole page — every faction section and the overall
  // summary header both read from this instead of recomputing per section.
  const rarityGroupsByFaction = useMemo(() => {
    const map = new Map<ChampionFaction, RarityGroup[]>();
    for (const faction of FACTIONS) {
      const championsByRarity = championsByFaction.get(faction)!;
      map.set(
        faction,
        INDEX_RARITIES.map((rarity) => ({
          rarity,
          entries: buildIndexEntries(getTierListForFaction(faction, rarity), championsByRarity[rarity] ?? []),
        })),
      );
    }
    return map;
  }, [championsByFaction]);

  const overallByRarity = useMemo(
    () =>
      INDEX_RARITIES.map((rarity) => {
        let owned = 0;
        let known = 0;
        for (const groups of rarityGroupsByFaction.values()) {
          const group = groups.find((g) => g.rarity === rarity);
          if (!group) continue;
          owned += ownedCount(group.entries);
          known += group.entries.length;
        }
        return { rarity, owned, known };
      }),
    [rarityGroupsByFaction],
  );
  const overallOwned = overallByRarity.reduce((sum, r) => sum + r.owned, 0);
  const overallKnown = overallByRarity.reduce((sum, r) => sum + r.known, 0);

  const toggleFaction = (faction: string) => {
    setOpenFactions((prev) => {
      const next = new Set(prev);
      if (next.has(faction)) next.delete(faction);
      else next.add(faction);
      return next;
    });
  };

  if (loading) return <ArcaneLoader label="Building the champion index" />;

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Champion Index</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Every known champion by faction and rarity — owned champions show their real portrait, the rest show a placeholder.
        </p>
      </div>

      {/* ── Overall totals — visually distinct from the per-faction rows below ── */}
      <div className="rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <FaLayerGroup className="text-amber-500 shrink-0" size={14} />
          <p className="font-bold text-sm text-amber-900 dark:text-amber-300">All Factions</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300 ml-auto">
            {overallOwned}/{overallKnown} owned
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-800 dark:text-amber-400">
          {overallByRarity.map(({ rarity, owned, known }) => (
            <span key={rarity} className="font-medium">
              {rarity}: {owned}/{known}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {FACTIONS.map((faction) => (
          <FactionSection
            key={faction}
            faction={faction}
            rarityGroups={rarityGroupsByFaction.get(faction)!}
            isOpen={openFactions.has(faction)}
            onToggle={() => toggleFaction(faction)}
            onSelectChampion={setPreviewChampion}
          />
        ))}
      </div>

      {showEditModal && (
        <ChampionModal
          champion={editingChampion ?? undefined}
          onClose={handleCloseEditModal}
        />
      )}

      {previewChampion && (
        <Modal isOpen bare maxWidthClass="max-w-xs" onClose={() => setPreviewChampion(null)}>
          <ChampionCard
            champion={previewChampion}
            onEdit={handleEditChampion}
            onDelete={handleDeletePreviewChampion}
          />
        </Modal>
      )}
    </div>
  );
}
