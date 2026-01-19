export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export const formatNumberCompact = (num: number): string => {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
};
