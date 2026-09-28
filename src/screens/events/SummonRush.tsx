import ShardPointsCalculator from "./ShardPointsCalculator";
import {
  DEFAULT_SUMMON_RUSH_POINTS,
  getSummonRushPoints,
  saveSummonRushPoints,
  resetSummonRushPoints,
} from "../../helpers/summonRushPoints";

export default function SummonRush() {
  return (
    <ShardPointsCalculator
      defaultPoints={DEFAULT_SUMMON_RUSH_POINTS}
      getPoints={getSummonRushPoints}
      savePoints={saveSummonRushPoints}
      resetPoints={resetSummonRushPoints}
    />
  );
}
