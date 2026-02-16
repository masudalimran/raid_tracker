import type { Skill } from "../models/IChampion";

export const skills: Skill[] = [
  {
    skill_index: 1,
    effects: [
      {
        name: "Decrease ACC",
        cool_down: 1,
        land_chance: 30,
        target: "Single",
        type: "debuff",
        duration: 2,
      },
    ],
  },
  {
    skill_index: 1,
    effects: [
      {
        name: "Decrease SPD",
        cool_down: 1,
        land_chance: 30,
        target: "Single",
        type: "debuff",
        duration: 2,
      },
    ],
  },
  {
    skill_index: 2,
    effects: [
      {
        name: "Increase ACC",
        cool_down: 5,
        land_chance: 100,
        duration: 2,
        target: "All",
        type: "buff",
      },
    ],
  },
  {
    skill_index: 2,
    effects: [
      {
        name: "Increase DEF",
        cool_down: 5,
        land_chance: 100,
        duration: 2,
        target: "All",
        type: "buff",
      },
    ],
  },
  {
    skill_index: 3,
    effects: [
      {
        name: "TM Boost",
        cool_down: 5,
        land_chance: 100,
        duration: 2,
        target: "Random_Multiple",
        type: "buff",
      },
    ],
  },
  {
    skill_index: 3,
    effects: [
      {
        name: "HP Burn",
        cool_down: 3,
        land_chance: 70,
        duration: 2,
        target: "Single",
        type: "debuff",
      },
    ],
  },
];
