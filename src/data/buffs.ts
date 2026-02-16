export const buffs: string[] = Object.keys(
  import.meta.glob("/public/img/buffs/*.png", { eager: true }),
).map((path) => path.split("/").pop()?.replace(".png", "") || "");
