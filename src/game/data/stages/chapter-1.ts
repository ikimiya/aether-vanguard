import type { Stage } from "../../types";

/** Chapter 1 — "The Cinder Road". Eight stages ending in a boss. */
export const CHAPTER_1: Stage[] = [
  {
    id: "1-1",
    chapter: 1,
    name: "Roadside Embers",
    waves: [
      [{ enemyId: "wisp", level: 1 }, { enemyId: "wisp", level: 1 }],
      [{ enemyId: "wisp", level: 2 }, { enemyId: "gale-sprite", level: 2 }],
    ],
    rewards: { firstClear: { gems: 60, gold: 200 }, repeat: { gold: 80, xp_items: 2 } },
    clearWithinRounds: 5,
  },
  {
    id: "1-2",
    chapter: 1,
    name: "Broken Palisade",
    waves: [
      [{ enemyId: "frost-hound", level: 2 }, { enemyId: "wisp", level: 3 }],
      [{ enemyId: "gale-sprite", level: 3 }, { enemyId: "frost-hound", level: 3 }, { enemyId: "wisp", level: 3 }],
    ],
    rewards: { firstClear: { gems: 60, gold: 240 }, repeat: { gold: 95, xp_items: 2 } },
    clearWithinRounds: 6,
  },
  {
    id: "1-3",
    chapter: 1,
    name: "The Sunken Ford",
    waves: [
      [{ enemyId: "tide-serpent", level: 4 }],
      [{ enemyId: "frost-hound", level: 4 }, { enemyId: "tide-serpent", level: 4 }],
    ],
    rewards: { firstClear: { gems: 80, gold: 260 }, repeat: { gold: 110, xp_items: 3 } },
    clearWithinRounds: 6,
  },
  {
    id: "1-4",
    chapter: 1,
    name: "Golem Quarry",
    waves: [
      [{ enemyId: "stone-golem", level: 5 }, { enemyId: "gale-sprite", level: 5 }],
      [{ enemyId: "stone-golem", level: 6 }, { enemyId: "stone-golem", level: 5 }],
    ],
    rewards: { firstClear: { gems: 80, gold: 300 }, repeat: { gold: 125, xp_items: 3 } },
    clearWithinRounds: 7,
  },
  {
    id: "1-5",
    chapter: 1,
    name: "Storm on the Ridge",
    waves: [
      [{ enemyId: "storm-drake", level: 6 }, { enemyId: "gale-sprite", level: 6 }],
      [{ enemyId: "storm-drake", level: 7 }, { enemyId: "frost-hound", level: 7 }, { enemyId: "wisp", level: 7 }],
    ],
    rewards: { firstClear: { gems: 90, gold: 320 }, repeat: { gold: 140, xp_items: 4 } },
    clearWithinRounds: 7,
  },
  {
    id: "1-6",
    chapter: 1,
    name: "Nightfall Camp",
    waves: [
      [{ enemyId: "shade", level: 7 }, { enemyId: "shade", level: 7 }],
      [{ enemyId: "shade", level: 8 }, { enemyId: "tide-serpent", level: 8 }],
      [{ enemyId: "shade", level: 9 }, { enemyId: "storm-drake", level: 8 }],
    ],
    rewards: { firstClear: { gems: 100, gold: 360 }, repeat: { gold: 160, xp_items: 4 } },
    clearWithinRounds: 9,
  },
  {
    id: "1-7",
    chapter: 1,
    name: "The Ashen Gate",
    waves: [
      [{ enemyId: "stone-golem", level: 9 }, { enemyId: "storm-drake", level: 9 }],
      [{ enemyId: "shade", level: 10 }, { enemyId: "tide-serpent", level: 10 }, { enemyId: "frost-hound", level: 10 }],
    ],
    rewards: { firstClear: { gems: 110, gold: 400 }, repeat: { gold: 180, xp_items: 5 } },
    clearWithinRounds: 9,
  },
  {
    id: "1-8",
    chapter: 1,
    name: "Cinder Wyrm's Lair",
    waves: [
      [{ enemyId: "wisp", level: 11 }, { enemyId: "wisp", level: 11 }, { enemyId: "shade", level: 11 }],
      [{ enemyId: "cinder-wyrm", level: 10 }],
    ],
    rewards: { firstClear: { gems: 300, gold: 800 }, repeat: { gold: 260, xp_items: 6 } },
    clearWithinRounds: 12,
  },
];
