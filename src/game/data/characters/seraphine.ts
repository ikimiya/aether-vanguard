import type { Character } from "../../types";

export const seraphine: Character = {
  id: "seraphine",
  name: "Seraphine",
  rarity: 5,
  element: "light",
  role: "dps",
  baseStats: { hp: 1320, atk: 92, matk: 168, def: 74, mdef: 84, spd: 110 },
  growth: { hp: 94, atk: 5, matk: 12.5, def: 4.8, mdef: 5.2, spd: 1.2 },
  maxMp: 140,
  mpRegen: 16,
  skills: ["solar-flare", "dawn-chorus", "mending-light"],
  art: { portrait: "assets/characters/seraphine/portrait.png", battle: "assets/characters/seraphine/battle.png" },
  lore: "The last Dawnspeaker. Where she walks, the dark takes a step back.",
};
