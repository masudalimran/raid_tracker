import { Fragment } from "react/jsx-runtime";
import ChampionSkeletonCard from "../card/ChampionSkeletonCard";

interface ChampionSkeletonProps {
  length?: number;
}
export default function ChampionSkeletonLoader({
  length = 10,
}: ChampionSkeletonProps) {
  return (
    <div className="grid sm:grid-cols-1 md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {Array.from({ length }).map((_, idx) => (
        <Fragment key={idx}>
          <ChampionSkeletonCard animate={true} />
        </Fragment>
      ))}
    </div>
  );
}
