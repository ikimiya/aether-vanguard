import type { Skill } from "../../types";

/**
 * Every magic skill in the game, keyed by id. Characters reference these ids in
 * their `skills` array. Basic attack and Defend are universal and injected by
 * the engine, so they are not listed here.
 */
const list: Skill[] = [
  // --- single-target nukes ---
  {
    id: "ember-lance",
    name: "Ember Lance",
    type: "magic",
    mpCost: 30,
    power: 1.9,
    target: "one-enemy",
    description: "A spear of fire through one foe.",
    effects: [{ kind: "dot", amount: 0.04, turns: 2, element: "fire" }],
  },
  {
    id: "frost-pierce",
    name: "Frost Pierce",
    type: "magic",
    mpCost: 28,
    power: 1.8,
    target: "one-enemy",
    description: "Impaling ice that slows the target.",
    effects: [{ kind: "debuff", stat: "spd", amount: -0.2, turns: 2 }],
  },
  {
    id: "gale-slash",
    name: "Gale Slash",
    type: "physical",
    mpCost: 22,
    power: 1.7,
    target: "one-enemy",
    description: "A wind-wreathed strike that bites deep.",
    effects: [{ kind: "debuff", stat: "def", amount: -0.15, turns: 2 }],
  },
  {
    id: "stone-maul",
    name: "Stone Maul",
    type: "physical",
    mpCost: 26,
    power: 2.1,
    target: "one-enemy",
    description: "A crushing blow with earthen weight.",
  },
  {
    id: "thunder-spike",
    name: "Thunder Spike",
    type: "magic",
    mpCost: 24,
    power: 1.75,
    target: "one-enemy",
    description: "A bolt that leaves the target rattled.",
    effects: [{ kind: "debuff", stat: "mdef", amount: -0.2, turns: 2 }],
  },
  // --- AoE ---
  {
    id: "inferno-wave",
    name: "Inferno Wave",
    type: "magic",
    mpCost: 45,
    power: 1.25,
    target: "all-enemies",
    description: "A rolling wall of flame across the enemy line.",
    effects: [{ kind: "dot", amount: 0.03, turns: 2, element: "fire" }],
  },
  {
    id: "blizzard",
    name: "Blizzard",
    type: "magic",
    mpCost: 44,
    power: 1.2,
    target: "all-enemies",
    description: "A whiteout that chills every foe.",
    effects: [{ kind: "debuff", stat: "spd", amount: -0.15, turns: 2 }],
  },
  {
    id: "tempest",
    name: "Tempest",
    type: "magic",
    mpCost: 46,
    power: 1.3,
    target: "all-enemies",
    description: "A cyclone that tears through the enemy ranks.",
  },
  {
    id: "chain-lightning",
    name: "Chain Lightning",
    type: "magic",
    mpCost: 42,
    power: 1.15,
    target: "all-enemies",
    description: "Arcing current that jumps between targets.",
    effects: [{ kind: "debuff", stat: "atk", amount: -0.12, turns: 2 }],
  },
  // --- support ---
  {
    id: "mending-light",
    name: "Mending Light",
    type: "magic",
    mpCost: 30,
    power: 1.6,
    target: "one-ally",
    heal: true,
    description: "Restores HP to one ally.",
  },
  {
    id: "dawn-chorus",
    name: "Dawn Chorus",
    type: "magic",
    mpCost: 48,
    power: 1.0,
    target: "all-allies",
    heal: true,
    description: "A radiant hymn that heals the whole team.",
    effects: [{ kind: "regen", amount: 0.05, turns: 2, element: "light" }],
  },
  {
    id: "war-cry",
    name: "War Cry",
    type: "physical",
    mpCost: 26,
    power: 0,
    target: "all-allies",
    description: "Rallies the team, raising attack.",
    effects: [{ kind: "buff", stat: "atk", amount: 0.25, turns: 3 }],
  },
  {
    id: "aegis-hymn",
    name: "Aegis Hymn",
    type: "magic",
    mpCost: 28,
    power: 0,
    target: "all-allies",
    description: "A protective chant that hardens defenses.",
    effects: [{ kind: "buff", stat: "def", amount: 0.3, turns: 3 }],
  },
  {
    id: "hex",
    name: "Hex",
    type: "magic",
    mpCost: 24,
    power: 0.6,
    target: "one-enemy",
    element: "dark",
    description: "A curse that saps a foe's strength.",
    effects: [
      { kind: "debuff", stat: "atk", amount: -0.25, turns: 3 },
      { kind: "debuff", stat: "matk", amount: -0.25, turns: 3 },
    ],
  },
  // --- heavy hitters (5-star signatures) ---
  {
    id: "solar-flare",
    name: "Solar Flare",
    type: "magic",
    mpCost: 60,
    power: 3.0,
    target: "one-enemy",
    element: "light",
    description: "A lance of pure daylight. Devastating, costly.",
    effects: [{ kind: "debuff", stat: "mdef", amount: -0.25, turns: 2 }],
  },
  {
    id: "abyssal-rend",
    name: "Abyssal Rend",
    type: "physical",
    mpCost: 58,
    power: 2.8,
    target: "one-enemy",
    element: "dark",
    description: "Tears a foe with the weight of the void.",
    effects: [{ kind: "dot", amount: 0.06, turns: 3, element: "dark" }],
  },
];

export const SKILLS: Record<string, Skill> = Object.fromEntries(
  list.map((s) => [s.id, s]),
);

export function getSkill(id: string): Skill {
  const skill = SKILLS[id];
  if (!skill) throw new Error(`Unknown skill: ${id}`);
  return skill;
}
