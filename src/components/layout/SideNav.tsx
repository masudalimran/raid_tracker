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
import toSlug from "../../helpers/toSlug";

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const CoreSideNavItems: NavItem[] = [
  { name: "Home", path: "/", className: "" },
  { name: "Champion List", path: "/champions", className: "" },
];

const PotionKeepNavItems = buildNavItems(POTION_KEEP);
const DungeonNavItems = buildNavItems(DUNGEON);
const ClanBossNavItems = buildNavItems(CLAN_BOSS);
const HydraNavItems = buildNavItems(HYDRA);
const ArenaNavItems = buildNavItems(ARENA);
const DoomTowerBossNavItems = buildNavItems(DOOM_TOWER_BOSS);

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

  const FactionNavItems: NavItem[] = Object.keys(ChampionFaction).map((key) => {
    const slug = toSlug(key);
    const factionName = ChampionFaction[key as keyof typeof ChampionFaction];
    const isMaxed = teams.some(
      (t) =>
        t.team_name === slug &&
        t.clearing_stage?.toUpperCase().includes("MAX"),
    );
    return {
      name: isMaxed ? `${factionName} (Max)` : factionName,
      path: `/${slug}`,
      className: "",
    };
  });

  const navContent = (
    <ul className="text-sm">
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

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:block bg-orange-100 h-full border-t-2 border-white px-2 overflow-y-auto w-45 shrink-0">
        {navContent}
      </aside>

      {/* Mobile drawer — slides in from left */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-orange-100 border-r-2 border-white px-2 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        onClick={onClose}
      >
        {navContent}
      </aside>
    </>
  );
}

export default SideNav;
