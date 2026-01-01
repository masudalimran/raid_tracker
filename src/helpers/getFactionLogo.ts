import { ChampionFaction } from "../models/ChampionFaction";

export const getFactionLogo = (faction: ChampionFaction): string => {
  switch (faction) {
    case ChampionFaction.BANNER_LORDS:
      return "https://www.gamehelper.top/wp-content/uploads/2020/06/banner-lords-raid-guide-min.jpg";
      break;
    case ChampionFaction.BARBARIANS:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS7knQ3oJNwgqn7rCA_vmJ01O6MCHoSwdeOg&s";
      break;
    case ChampionFaction.DARK_ELVES:
      return "https://cdna.artstation.com/p/assets/images/images/056/826/742/4k/matthew-stankevicius-highresscreenshot00009.jpg?1670195857";
      break;
    case ChampionFaction.DEMON_SPAWNS:
      return "https://www.gamehelper.top/wp-content/uploads/2019/10/demonspawn-faction-raid-guide-min.jpg";
      break;
    case ChampionFaction.DWARVES:
      return "https://inteleria.com/wp-content/uploads/2019/10/dwarves.png";
      break;
    case ChampionFaction.HIGH_ELVES:
      return "https://i.ytimg.com/vi/61Fih1qUctg/sddefault.jpg";
      break;
    case ChampionFaction.KNIGHTS_REVENANT:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRh54U6wY51BDVF7l5PatUDl4vPq4GcwuAulA&s";
      break;
    case ChampionFaction.LIZARDMEN:
      return "https://www.gamehelper.top/wp-content/uploads/2019/10/lizardmen-faction-raid-guide-min.jpg";
      break;
    case ChampionFaction.OGRYN_TRIBES:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2TJknSDBTahr97CEBslT2OkE-7pyAyvwAhw&s";
      break;
    case ChampionFaction.ORCS:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTQ6bGQDHUw3V0IWA19Fx_1h6yP14saI3EbA&s";
      break;
    case ChampionFaction.SACRED_ORDER:
      return "https://cdna.artstation.com/p/assets/images/images/056/826/722/4k/matthew-stankevicius-highresscreenshot00000.jpg?1670195805";
      break;
    case ChampionFaction.SHADOWKINS:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEBfXL0NkNdYPhZIwZmNTVfCXhHZM2Rpw-CQ&s";
      break;
    case ChampionFaction.SKIN_WALKERS:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxaMvJEUD2Tx-FJN_z-3k5aOQzK_QVRmm-6Q&s";
      break;
    case ChampionFaction.SYLVAN_WATCHERS:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqr2phqLsHm27_O3U9ax6u8wYlWXRJrsLRcg&s";
      break;
    case ChampionFaction.UNDEAD_HORDES:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf39QI71Fhv7pk65RY-XhIyUk82ofbYq88Lg&s";
      break;
    default:
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZEEDZjYMQAa3pAnOGCCrn-WQuy-3_MsEzhg&s";
      break;
  }
};

export default getFactionLogo;
