import { useEffect, useState } from "react";
import { COMPARE_LIST_EVENT, getCompareList } from "../helpers/compareList";

/** Live-updating champion comparison list — reacts to changes made from any ChampionCard, the topbar, or another tab. */
export function useCompareList(): string[] {
  const [ids, setIds] = useState<string[]>(() => getCompareList());

  useEffect(() => {
    const sync = () => setIds(getCompareList());
    window.addEventListener(COMPARE_LIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_LIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return ids;
}
