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

const CoreSideNavItems: NavItem[] = [
  { name: "Home", path: "/", className: "" },
  { name: "Champion List", path: "/champions", className: "" },
];

const PotionKeepNavItems = buildNavItems(POTION_KEEP);
const DungeonNavItems = buildNavItems(DUNGEON);
const ClanBossNavItems = buildNavItems(CLAN_BOSS);
const HydraNavItems = buildNavItems(HYDRA);
const ArenaNavItems = buildNavItems(ARENA);
const FactionNavItems = buildNavItems(ChampionFaction);
const DoomTowerBossNavItems = buildNavItems(DOOM_TOWER_BOSS);

function SideNav() {
  return (
    <aside className="bg-orange-100 h-full border-t-2 border-white px-2 overflow-y-auto w-45">
      <ul className="text-sm">
        <SideNavSection
          items={CoreSideNavItems}
          sectionName="Core"
          defaultOpen
        />
        <SideNavSection items={PotionKeepNavItems} sectionName="Potion Keeps" />
        <SideNavSection items={DungeonNavItems} sectionName="Dungeons" />
        <SideNavSection items={ClanBossNavItems} sectionName="Clan Boss" />
        <SideNavSection items={HydraNavItems} sectionName="Hydra" />
        <SideNavSection items={ArenaNavItems} sectionName="Arena" />
        <SideNavSection items={FactionNavItems} sectionName="Faction Wars" />
        <SideNavSection
          items={DoomTowerBossNavItems}
          sectionName="Doom Tower"
        />
      </ul>
    </aside>
  );
}

export default SideNav;
