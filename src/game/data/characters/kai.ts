import type { Character } from "../../types";

export const kai: Character = {
  id: "kai",
  name: "Kai",
  rarity: 3,
  element: "fire",
  role: "dps",
  baseStats: { hp: 940, atk: 104, matk: 88, def: 52, mdef: 46, spd: 99 },
  growth: { hp: 60, atk: 7.5, matk: 6, def: 3.4, mdef: 2.8, spd: 0.8 },
  maxMp: 100,
  mpRegen: 12,
  skills: ["ember-lance"],
  art: { portrait: "assets/characters/kai/portrait.png", battle: "assets/characters/kai/battle.png" },
  lore: "A hot-headed street brawler who learned fire magic to keep up with his temper.",
};
