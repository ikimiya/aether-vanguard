import type { Character } from "../../types";

export const mei: Character = {
  id: "mei",
  name: "Mei",
  rarity: 3,
  element: "wind",
  role: "dps",
  baseStats: { hp: 880, atk: 110, matk: 74, def: 48, mdef: 46, spd: 112 },
  growth: { hp: 54, atk: 8, matk: 4.5, def: 3, mdef: 2.8, spd: 1.1 },
  maxMp: 100,
  mpRegen: 13,
  skills: ["gale-slash"],
  art: { portrait: "assets/characters/mei/portrait.png", battle: "assets/characters/mei/battle.png" },
  lore: "A courier who outruns storms for sport. Hits first, every time.",
};
