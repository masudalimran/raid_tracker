import ChampionCard from "../components/card/ChampionCard.tsx";
import {Fragment} from "react";
import champion_list from "../data/champion_list.ts";
import type IChampion from "../models/IChampion.ts";

export default function Champions() {

    return (
        <div>
            <h1 className="text-3xl">Champions List</h1>
            <hr className="my-2" ></hr>
            <div className="flex items-stretch">
                {champion_list.map((champion:IChampion) => (
                    <Fragment key={champion.id}>
                        <ChampionCard champion={champion}/>
                    </Fragment>
                ))}
            </div>


        </div>
    );
}
