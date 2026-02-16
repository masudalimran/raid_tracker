export const debuffs: string[] = Object.keys(
  import.meta.glob("/public/img/debuffs/*.png", { eager: true }),
).map((path) => path.split("/").pop()?.replace(".png", "") || "");
