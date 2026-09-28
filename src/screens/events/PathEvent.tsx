import ShardPointsCalculator from "./ShardPointsCalculator";
import {
  DEFAULT_PATH_EVENT_POINTS,
  getPathEventPoints,
  savePathEventPoints,
  resetPathEventPoints,
} from "../../helpers/pathEventPoints";

export default function PathEvent() {
  return (
    <ShardPointsCalculator
      defaultPoints={DEFAULT_PATH_EVENT_POINTS}
      getPoints={getPathEventPoints}
      savePoints={savePathEventPoints}
      resetPoints={resetPathEventPoints}
    />
  );
}
