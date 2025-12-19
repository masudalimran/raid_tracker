export const HYDRA = {
  HYDRA_A: "Hydra A",
  HYDRA_B: "Hydra B",
  HYDRA_C: "Hydra C",
} as const;

export type HYDRA = (typeof HYDRA)[keyof typeof HYDRA];
