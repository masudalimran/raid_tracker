import { ChampionFaction } from "../../models/ChampionFaction";
import { POTION_KEEP } from "../../models/game_areas/PotionKeep";
import { DUNGEON } from "../../models/game_areas/Dungeon";
import { CLAN_BOSS } from "../../models/game_areas/ClanBoss";
import { ARENA } from "../../models/game_areas/Arena";
import { HYDRA } from "../../models/game_areas/Hydra";
import type { NavItem } from "../modals/NavItem";
import buildNavItems from "../../helpers/buildNavItems";
import { SideNavSection } from "./SideNavSection";
import { DOOM_TOWER_BOSS } from "../../models/game_areas/DoomTowerBoss";
import type ITeam from "../../models/ITeam";
import type IChampion from "../../models/IChampion";
import toSlug from "../../helpers/toSlug";
import { getAreaCoverageBadge } from "../../data/areaRoleRequirements";

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const CoreSideNavItems: NavItem[] = [
  { name: "Home", path: "/", className: "" },
  { name: "Champion List", path: "/champions", className: "" },
  { name: "Priority Queue", path: "/priority-queue", className: "" },
  { name: "Analytics", path: "/analytics", className: "" },
  { name: "Shard Log", path: "/shard-log", className: "" },
];

function SideNav({ isOpen, onClose }: SideNavProps) {
  const allTeams: ITeam[] = JSON.parse(
    localStorage.getItem("supabase_team_list") || "[]",
  );
  const currentAccount = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]",
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);
  const teams: ITeam[] = currentAccount
    ? allTeams.filter((t) => t.rsl_account_id === currentAccount.id)
    : allTeams;
  const champions: IChampion[] = JSON.parse(
    localStorage.getItem("supabase_champion_list") ?? "[]",
  );

  const PotionKeepNavItems = buildNavItems(POTION_KEEP, teams, champions);
  const DungeonNavItems = buildNavItems(DUNGEON, teams, champions);
  const ClanBossNavItems = buildNavItems(CLAN_BOSS, teams, champions);
  const HydraNavItems = buildNavItems(HYDRA, teams, champions);
  const ArenaNavItems = buildNavItems(ARENA, teams, champions);
  const DoomTowerBossNavItems = buildNavItems(DOOM_TOWER_BOSS, teams, champions);

  const FactionNavItems: NavItem[] = Object.keys(ChampionFaction).map((key) => {
    const slug = toSlug(key);
    const factionName = ChampionFaction[key as keyof typeof ChampionFaction];
    const isMaxed = teams.some(
      (t) =>
        t.team_name === slug &&
        t.clearing_stage?.toUpperCase().includes("MAX"),
    );
    return {
      name: factionName,
      path: `/${slug}`,
      className: "",
      badge: isMaxed
        ? { label: "MAX", tone: "success" as const, title: "Clearing stage maxed" }
        : getAreaCoverageBadge(key, teams, champions) ?? undefined,
    };
  });

  const navContent = (
    <ul className="text-sm py-2 space-y-0.5">
      <SideNavSection items={CoreSideNavItems} sectionName="Core" defaultOpen />
      <SideNavSection items={PotionKeepNavItems} sectionName="Potion Keeps" />
      <SideNavSection items={DungeonNavItems} sectionName="Dungeons" />
      <SideNavSection items={ClanBossNavItems} sectionName="Clan Boss" />
      <SideNavSection items={HydraNavItems} sectionName="Hydra" />
      <SideNavSection items={ArenaNavItems} sectionName="Arena" />
      <SideNavSection items={FactionNavItems} sectionName="Faction Wars" />
      <SideNavSection items={DoomTowerBossNavItems} sectionName="Doom Tower" />
    </ul>
  );

  const asideClass =
    "bg-gray-900 h-full overflow-y-auto shrink-0 border-r border-white/5";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:block w-45 px-2 ${asideClass}`}>
        {navContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 px-2
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${asideClass}
        `}
        onClick={onClose}
      >
        {navContent}
      </aside>
    </>
  );
}

export default SideNav;
