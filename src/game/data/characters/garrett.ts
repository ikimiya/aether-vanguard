import type { Character } from "../../types";

export const garrett: Character = {
  id: "garrett",
  name: "Garrett",
  rarity: 4,
  element: "earth",
  role: "tank",
  baseStats: { hp: 1420, atk: 108, matk: 62, def: 92, mdef: 70, spd: 88 },
  growth: { hp: 104, atk: 7, matk: 3, def: 5.8, mdef: 4.2, spd: 0.7 },
  maxMp: 96,
  mpRegen: 12,
  skills: ["stone-maul", "war-cry"],
  artPrompt:
    "grizzled older soldier with short grey hair and a jaw scar, weathered dark plate armor with a faded captain's sash, one hand resting on a longsword hilt, resolute stare, muted battlefield tones",
  art: { portrait: "assets/characters/garrett/portrait.png", battle: "assets/characters/garrett/battle.png" },
  lore: "A retired vanguard captain who came back for one more campaign.",
};
