import type { EndlessConfig } from "../../types";

export const ENDLESS: EndlessConfig = {
  enemyPool: [
    "wisp",
    "frost-hound",
    "gale-sprite",
    "stone-golem",
    "storm-drake",
    "tide-serpent",
    "shade",
  ],
  bossPool: ["cinder-wyrm"],
  baseLevel: 5,
  levelStep: 2,
  startCount: 2,
  maxCount: 3,
  addEnemyEveryWaves: 4,
  bossEveryWaves: 5,
};
