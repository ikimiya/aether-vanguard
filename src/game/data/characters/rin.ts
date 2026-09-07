import type { Character } from "../../types";

export const rin: Character = {
  id: "rin",
  name: "Rin",
  rarity: 3,
  element: "water",
  role: "support",
  baseStats: { hp: 900, atk: 70, matk: 96, def: 50, mdef: 58, spd: 96 },
  growth: { hp: 58, atk: 4, matk: 7.5, def: 3, mdef: 3.6, spd: 0.8 },
  maxMp: 120,
  mpRegen: 16,
  skills: ["mending-light"],
  art: { portrait: "assets/characters/rin/portrait.png", battle: "assets/characters/rin/battle.png" },
  lore: "A field medic from the river country who never leaves a squadmate behind.",
};
