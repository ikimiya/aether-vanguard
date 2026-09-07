import type { Character } from "../../types";

export const toa: Character = {
  id: "toa",
  name: "Toa",
  rarity: 3,
  element: "earth",
  role: "tank",
  baseStats: { hp: 1240, atk: 84, matk: 60, def: 78, mdef: 62, spd: 84 },
  growth: { hp: 92, atk: 5, matk: 3, def: 5.2, mdef: 4, spd: 0.6 },
  maxMp: 90,
  mpRegen: 11,
  skills: ["aegis-hymn"],
  artPrompt:
    "broad-shouldered man with a cropped grey beard, heavy stone-plated pauldrons, a huge slab shield on his back, arms crossed, drifting dust and gravel, earthy browns",
  art: { portrait: "assets/characters/toa/portrait.png", battle: "assets/characters/toa/battle.png" },
  lore: "A quarry foreman turned shield-bearer. Immovable, and proud of it.",
};
