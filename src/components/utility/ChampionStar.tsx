import {FaStar} from "react-icons/fa";

interface ChampionStarProps {
    stars: number
    ascension_stars: number;
    awaken_stars: number
}

export default function ChampionStar({stars = 0, ascension_stars = 0, awaken_stars = 0}:ChampionStarProps){

    return (
        (stars < ascension_stars || stars < awaken_stars)
            ? <></>
            : <>
                <div className="flex-center">
                    <p>{ascension_stars}</p>
                    <FaStar className="text-purple-500"/>
                    <p>|</p>
                    <p>{awaken_stars}</p>
                    <FaStar className="text-red-600"/>
                </div>
            </>
    )

}