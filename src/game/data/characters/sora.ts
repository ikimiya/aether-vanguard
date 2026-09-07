import type { Character } from "../../types";

export const sora: Character = {
  id: "sora",
  name: "Sora",
  rarity: 4,
  element: "lightning",
  role: "dps",
  baseStats: { hp: 1080, atk: 104, matk: 128, def: 58, mdef: 60, spd: 118 },
  growth: { hp: 72, atk: 6, matk: 9.6, def: 3.8, mdef: 3.8, spd: 1.2 },
  maxMp: 108,
  mpRegen: 14,
  skills: ["thunder-spike", "chain-lightning"],
  art: { portrait: "assets/characters/sora/portrait.png", battle: "assets/characters/sora/battle.png" },
  lore: "A storm-chaser who bottled a lightning strike and never quite let go of it.",
};
