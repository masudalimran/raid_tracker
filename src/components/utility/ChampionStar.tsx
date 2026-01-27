import { FaStar } from "react-icons/fa";

interface ChampionStarProps {
  stars: number;
  ascension_stars: number;
  awaken_stars: number;
}

export default function ChampionStar({
  stars = 0,
  ascension_stars = 0,
  awaken_stars = 0,
}: ChampionStarProps) {
  return stars < ascension_stars || stars < awaken_stars ? (
    <></>
  ) : (
    <>
      <div className="flex items-center gap-1">
        {/* Star */}
        <div className="relative flex items-center justify-center w-6 h-6">
          <FaStar className="text-yellow-500 w-6 h-6 animate-pulse duration-75" />
          <span className="absolute mt-1 text-[10px] font-bold text-white leading-none">
            {stars}
          </span>
        </div>

        {/* Ascension */}
        <div className="relative flex items-center justify-center w-6 h-6">
          <FaStar className="text-purple-500 w-6 h-6 animate-pulse duration-200" />
          <span className="absolute mt-1 text-[10px] font-bold text-white leading-none">
            {ascension_stars}
          </span>
        </div>

        {/* <span className="text-xs opacity-60">|</span> */}

        {/* Awakening */}
        <div className="relative flex items-center justify-center w-6 h-6">
          <FaStar className="text-red-600 w-6 h-6 animate-pulse duration-600" />
          <span className="absolute mt-1 text-[10px] font-bold text-white leading-none">
            {awaken_stars}
          </span>
        </div>
      </div>
    </>
  );
}
