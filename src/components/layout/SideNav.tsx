import { Link } from "react-router-dom";
import { ChampionFaction } from "../../models/ChampionFaction";
import { POTION_KEEP } from "../../models/game_areas/PotionKeep";
import { DUNGEON } from "../../models/game_areas/Dungeon";
import { CLAN_BOSS } from "../../models/game_areas/ClanBoss";
import toSlug from "../../helpers/toSlug";
import { ARENA } from "../../models/game_areas/Arena";
import { HYDRA } from "../../models/game_areas/Hydra";

const SideNavItems = [
  { name: "Home", path: "/", className: "" },
  { name: "Champion List", path: "/champions", className: "" },
];

[...Object.keys(POTION_KEEP)].forEach((keep, index) => {
  SideNavItems.push({
    name: POTION_KEEP[keep as keyof typeof POTION_KEEP],
    path: `/${toSlug(keep)}`,
    className: index === 0 ? "pt-2" : "",
  });
});

[...Object.keys(DUNGEON)].forEach((dungeon, index) => {
  SideNavItems.push({
    name: DUNGEON[dungeon as keyof typeof DUNGEON],
    path: `/${toSlug(dungeon)}`,
    className: index === 0 ? "pt-2" : "",
  });
});

[...Object.keys(CLAN_BOSS)].forEach((cb, index) => {
  SideNavItems.push({
    name: CLAN_BOSS[cb as keyof typeof CLAN_BOSS],
    path: `/${toSlug(cb)}`,
    className: index === 0 ? "pt-2" : "",
  });
});

[...Object.keys(HYDRA)].forEach((hydra, index) => {
  SideNavItems.push({
    name: HYDRA[hydra as keyof typeof HYDRA],
    path: `/${toSlug(hydra)}`,
    className: index === 0 ? "pt-2" : "",
  });
});

[...Object.keys(ARENA)].forEach((arena, index) => {
  SideNavItems.push({
    name: ARENA[arena as keyof typeof ARENA],
    path: `/${toSlug(arena)}`,
    className: index === 0 ? "pt-2" : "",
  });
});

[...Object.keys(ChampionFaction)].forEach((faction, index) => {
  SideNavItems.push({
    name: ChampionFaction[faction as keyof typeof ChampionFaction],
    path: `/${toSlug(faction)}`,
    className: index === 0 ? "pt-2" : "",
  });
});

function SideNav() {
  return (
    <aside className="bg-orange-100 h-full border-t-2 border-white px-2 overflow-y-auto w-38">
      <ul
        className="[&>*>li]:cursor-pointer [&>*>li]:border-b-2 [&>*>li]:hover:border-black
                [&>*>li]:border-orange-100 [&>*>li]:w-full [&>*>li]:text-nowrap text-sm"
      >
        {SideNavItems.map((item) => (
          <Link key={item.name} to={item.path}>
            <li className={item.className}>
              {item.name}
              {"  "}
            </li>
          </Link>
        ))}
      </ul>
    </aside>
  );
}

export default SideNav;
