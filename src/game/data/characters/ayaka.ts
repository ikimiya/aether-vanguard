import type { Character } from "../../types";

export const ayaka: Character = {
  id: "ayaka",
  name: "Ayaka",
  rarity: 4,
  element: "ice",
  role: "dps",
  baseStats: { hp: 1120, atk: 96, matk: 132, def: 60, mdef: 66, spd: 104 },
  growth: { hp: 76, atk: 5.5, matk: 10, def: 4, mdef: 4.4, spd: 1.0 },
  maxMp: 110,
  mpRegen: 14,
  skills: ["frost-pierce", "blizzard"],
  art: { portrait: "assets/characters/ayaka/portrait.png", battle: "assets/characters/ayaka/battle.png" },
  lore: "Court mage of a fallen winter kingdom. Precise, patient, cold.",
};
