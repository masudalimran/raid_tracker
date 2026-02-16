export const auras: string[] = Object.keys(
  import.meta.glob("/public/img/auras/*.webp", { eager: true }),
).map((path) => path.split("/").pop()?.replace(".webp", "") || "");
