import type { Character } from "../../types";

// Scaffolded by `npm run scaffold` — stats/skills are a starting point, tune freely.
export const emilia: Character = {
  id: "emilia",
  name: "Emilia",
  rarity: 5,
  element: "ice",
  role: "dps",
  baseStats: { hp: 1310, atk: 94, matk: 170, def: 74, mdef: 70, spd: 112 },
  growth: { hp: 92, atk: 7.2, matk: 13, def: 4.6, mdef: 4.4, spd: 1.3 },
  maxMp: 135,
  mpRegen: 16,
  skills: ["frost-pierce", "blizzard", "mending-light"],
  art: { portrait: "assets/characters/emilia/portrait.png", battle: "assets/characters/emilia/battle.png" },
  lore: "TODO: write Emilia's lore.",
};
