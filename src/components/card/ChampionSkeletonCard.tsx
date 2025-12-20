interface ChampionSkeletonCardProps {
  animate?: boolean;
  fullWidth?: boolean;
}
export default function ChampionSkeletonCard({
  animate = false,
  fullWidth = false,
}: ChampionSkeletonCardProps) {
  return (
    <div
      className={`${
        fullWidth ? "h-full min-h-150" : "h-150"
      } bg-gray-200 rounded-lg overflow-hidden relative ${
        animate && "animate-pulse"
      }`}
    >
      {/* Image placeholder */}
      <div className="w-full h-1/2 bg-gray-300" />

      {/* Name & stats placeholder */}
      <div className="p-4 space-y-3">
        <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
        <div className="h-4 w-full bg-gray-300 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
      </div>

      {/* Footer / buttons placeholder */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
        <div className="h-8 w-1/2 bg-gray-300 rounded"></div>
        <div className="h-8 w-1/2 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}
