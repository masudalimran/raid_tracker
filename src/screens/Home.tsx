import { useEffect, useState } from "react";
import { ChampionRarity } from "../models/ChampionRarity";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import ChampionSkeletonLoader from "../components/loaders/ChampionSkeletonLoader";

export default function Home() {
  const [loading, setLoading] = useState(true);

  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [teamsList, setTeamList] = useState<ITeam[]>([]);

  const [reloadDetector, setReloadDetector] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      let champions = await fetchChampions();
      champions = generateChampions();
      setChampionList(champions);

      const teams = await fetchTeams();
      setTeamList(teams);

      setTimeout(() => setLoading(false), 500);
    };

    load();
  }, []);

  if (loading) return <ChampionSkeletonLoader />;

  return (
    <div className="">
      <h1 className="">Book Priority</h1>
      <h2 className="">{ChampionRarity.LEGENDARY}</h2>
      <h2 className="">{ChampionRarity.EPIC}</h2>
      <h2 className="">{ChampionRarity.RARE}</h2>

      <h1 className="">Mastery Priority</h1>

      <h1 className="">Level Up Priority</h1>
    </div>
  );
}
