import { useEffect, useState } from "react";
import CardRevealCelebration from "../utility/CardRevealCelebration";

export interface CelebrateChampionDetail {
  championName: string;
  imgUrl?: string;
  rarity: string;
  label: string;
}

// Renders the full "pack pull" card reveal app-wide whenever a
// "celebrate-champion" CustomEvent is dispatched — used after saving a
// champion, independent of whatever modal/form triggered it (which may
// already be closing/unmounting).
export default function CelebrationOverlay() {
  const [detail, setDetail] = useState<CelebrateChampionDetail | null>(null);

  useEffect(() => {
    const handleCelebrate = (e: Event) => {
      setDetail((e as CustomEvent<CelebrateChampionDetail>).detail);
    };
    window.addEventListener("celebrate-champion", handleCelebrate);
    return () => window.removeEventListener("celebrate-champion", handleCelebrate);
  }, []);

  if (!detail) return null;

  return (
    <CardRevealCelebration
      championName={detail.championName}
      imgUrl={detail.imgUrl}
      rarity={detail.rarity}
      label={detail.label}
      onDone={() => setDetail(null)}
    />
  );
}
