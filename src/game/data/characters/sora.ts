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
  artPrompt:
    "wiry youth with spiked hair streaked yellow, a glowing bottled spark on a cord at the neck, weatherproof coat crackling with static, grinning up at the sky",
  art: { portrait: "assets/characters/sora/portrait.png", battle: "assets/characters/sora/battle.png" },
  lore: "A storm-chaser who bottled a lightning strike and never quite let go of it.",
};
