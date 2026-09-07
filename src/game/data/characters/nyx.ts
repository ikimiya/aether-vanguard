import type { Character } from "../../types";

export const nyx: Character = {
  id: "nyx",
  name: "Nyx",
  rarity: 5,
  element: "dark",
  role: "dps",
  baseStats: { hp: 1300, atk: 176, matk: 96, def: 72, mdef: 70, spd: 116 },
  growth: { hp: 92, atk: 13, matk: 5, def: 4.6, mdef: 4.4, spd: 1.3 },
  maxMp: 130,
  mpRegen: 15,
  skills: ["abyssal-rend", "hex", "chain-lightning"],
  art: { portrait: "assets/characters/nyx/portrait.png", battle: "assets/characters/nyx/battle.png" },
  lore: "A blade-for-hire who sold her shadow for an edge that never dulls.",
};
