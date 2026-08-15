import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MdLogout } from "react-icons/md";
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
import { getAreaBuildStatus, getAreaCoverageBadge } from "../../data/areaRoleRequirements";
import Tooltip from "../utility/Tooltip";

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
  { name: "Team Suggestion", path: "/team-suggestion", className: "" },
  { name: "Relics", path: "/relics", className: "" },
];

const OPEN_SECTION_STORAGE_KEY = "sidenav_open_section";

function SideNav({ isOpen, onClose }: SideNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const supabase_auth = localStorage.getItem("supabase_auth");
  const userEmail: string = supabase_auth ? JSON.parse(supabase_auth).email ?? "" : "";

  const logout = () => {
    localStorage.removeItem("supabase_auth");
    localStorage.removeItem("supabase_champion_list");
    navigate("/login");
  };

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

  const PotionKeepNavItems = buildNavItems(POTION_KEEP, teams, champions, 5);
  const DungeonNavItems = buildNavItems(DUNGEON, teams, champions, 5);
  const ClanBossNavItems = buildNavItems(CLAN_BOSS, teams, champions, 5);
  const HydraNavItems = buildNavItems(HYDRA, teams, champions, 6);
  const ArenaNavItems = buildNavItems(ARENA, teams, champions, 4);
  const DoomTowerBossNavItems = buildNavItems(DOOM_TOWER_BOSS, teams, champions, 5);

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
      buildStatus: getAreaBuildStatus(key, teams, champions, 5) ?? undefined,
    };
  });

  const sections: { name: string; items: NavItem[]; alwaysOpen?: boolean }[] = [
    { name: "Core", items: CoreSideNavItems, alwaysOpen: true },
    { name: "Potion Keeps", items: PotionKeepNavItems },
    { name: "Dungeons", items: DungeonNavItems },
    { name: "Clan Boss", items: ClanBossNavItems },
    { name: "Hydra", items: HydraNavItems },
    { name: "Arena", items: ArenaNavItems },
    { name: "Faction Wars", items: FactionNavItems },
    { name: "Doom Tower", items: DoomTowerBossNavItems },
  ];

  const findSectionForPath = (pathname: string) =>
    sections.find((s) => s.items.some((item) => item.path === pathname))?.name ?? null;

  // Accordion: only one section open at a time, shared across the desktop
  // sidebar and mobile drawer. Whichever section holds the active route
  // takes priority; otherwise the last section you opened is remembered.
  const [openSection, setOpenSection] = useState<string | null>(
    () => findSectionForPath(location.pathname) ?? localStorage.getItem(OPEN_SECTION_STORAGE_KEY) ?? "Core",
  );

  useEffect(() => {
    const active = findSectionForPath(location.pathname);
    if (active) setOpenSection(active);
    // Only re-run when the route changes — `sections` is rebuilt every
    // render from local data that doesn't need to re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleSection = (name: string) => {
    setOpenSection((prev) => {
      const next = prev === name ? null : name;
      localStorage.setItem(OPEN_SECTION_STORAGE_KEY, next ?? "");
      return next;
    });
  };

  const navContent = (
    <ul className="text-sm py-2 space-y-0.5">
      {sections.map((section) => (
        <SideNavSection
          key={section.name}
          items={section.items}
          sectionName={section.name}
          isOpen={section.alwaysOpen ? true : openSection === section.name}
          onToggle={section.alwaysOpen ? undefined : () => toggleSection(section.name)}
          alwaysOpen={section.alwaysOpen}
        />
      ))}
    </ul>
  );

  const asideClass =
    "bg-gray-900 h-full shrink-0 border-r border-white/5 flex flex-col";

  const sidebarFooter = userEmail && (
    <div className="shrink-0 border-t border-white/10 px-3 py-2.5 flex items-center justify-between gap-2">
      <span className="text-[11px] text-gray-400 truncate">{userEmail}</span>
      <Tooltip content="Logout" position="right">
        <button
          type="button"
          onClick={logout}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/10 transition cursor-pointer"
        >
          <MdLogout size={16} />
        </button>
      </Tooltip>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex w-45 ${asideClass}`}>
        <div className="flex-1 overflow-y-auto px-2">{navContent}</div>
        {sidebarFooter}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${asideClass}
        `}
        onClick={onClose}
      >
        <div className="flex-1 overflow-y-auto px-2">{navContent}</div>
        {sidebarFooter}
      </aside>
    </>
  );
}

export default SideNav;
