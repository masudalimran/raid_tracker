import { Link, useLocation } from "react-router-dom";
import type { HardModePair } from "../../helpers/buildAreaRoutes";

export default function DungeonModeSwitcher({ pair }: { pair: HardModePair }) {
  const location = useLocation();
  const isHard = location.pathname === `/${pair.hardPath}`;

  return (
    <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shrink-0 text-xs font-semibold">
      <Link
        to={`/${pair.normalPath}`}
        className={`px-2.5 py-1 transition ${
          !isHard
            ? "bg-amber-500 text-white"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        Normal
      </Link>
      <Link
        to={`/${pair.hardPath}`}
        className={`px-2.5 py-1 transition ${
          isHard
            ? "bg-amber-500 text-white"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        Hard
      </Link>
    </div>
  );
}
