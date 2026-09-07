import type { Character } from "../../types";

export const hana: Character = {
  id: "hana",
  name: "Hana",
  rarity: 4,
  element: "light",
  role: "support",
  baseStats: { hp: 1060, atk: 66, matk: 120, def: 58, mdef: 72, spd: 101 },
  growth: { hp: 70, atk: 3.5, matk: 9, def: 3.8, mdef: 4.6, spd: 1.0 },
  maxMp: 130,
  mpRegen: 18,
  skills: ["mending-light", "dawn-chorus"],
  art: { portrait: "assets/characters/hana/portrait.png", battle: "assets/characters/hana/battle.png" },
  lore: "A shrine keeper whose lanterns never go out, no matter the night.",
};
