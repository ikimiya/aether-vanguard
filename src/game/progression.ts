import type { Character, Enemy, Rarity, StatBlock, StatKey } from "./types";
import { RARITIES } from "./data/gacha/rarities";

const STAT_KEYS: StatKey[] = ["hp", "atk", "matk", "def", "mdef", "spd"];

/** Flat stat bonus per star above 1, as a fraction of base stats. */
export const STAR_STAT_BONUS = 0.04;

export const MAX_STAR = 5;

export function levelCap(rarity: Rarity): number {
  return RARITIES[rarity].levelCap;
}

/**
 * Effective stats for a unit at a given level and star.
 * base + growth * (level - 1), then scaled by the star bonus.
 */
export function computeStats(
  unit: Pick<Character | Enemy, "baseStats" | "growth">,
  level: number,
  star = 1,
): StatBlock {
  const starMult = 1 + STAR_STAT_BONUS * (star - 1);
  const out = {} as StatBlock;
  for (const key of STAT_KEYS) {
    const raw = unit.baseStats[key] + unit.growth[key] * (level - 1);
    out[key] = Math.round(raw * starMult);
  }
  return out;
}

export interface LevelUpCost {
  gold: number;
  xp_items: number;
}

/** Level-up cost coefficients. Also seeded into `app.game_constants` for the
 *  server-side `level_up_character` RPC — keep the two in sync via `npm run gen:sql`. */
export const LEVEL_COST = { goldBase: 40, goldPerLevel: 12, xpItemsDivisor: 8 } as const;

/** Cost to go from `level` to `level + 1`. */
export function levelUpCost(level: number): LevelUpCost {
  return {
    gold: LEVEL_COST.goldBase + level * LEVEL_COST.goldPerLevel,
    xp_items: 1 + Math.floor(level / LEVEL_COST.xpItemsDivisor),
  };
}

/** Total cost to take a character from `from` to `to` (exclusive of `to`+1). */
export function totalLevelUpCost(from: number, to: number): LevelUpCost {
  let gold = 0;
  let xp_items = 0;
  for (let l = from; l < to; l++) {
    const c = levelUpCost(l);
    gold += c.gold;
    xp_items += c.xp_items;
  }
  return { gold, xp_items };
}

/** Shards to reach each star (target star -> cost). Seeded into `app.star_up_cost`. */
export const STAR_UP_SHARDS: Record<number, number> = { 2: 20, 3: 40, 4: 80, 5: 150 };

/** Endless waves above this are rejected by `submit_endless` as implausible. */
export const ENDLESS_MAX_WAVE = 500;

/** Shards needed to go from `star` to `star + 1`, or null at max star. */
export function starUpCost(star: number): number | null {
  if (star >= MAX_STAR) return null;
  return STAR_UP_SHARDS[star + 1];
}

export function dupeShardYield(rarity: Rarity): number {
  return RARITIES[rarity].dupeShards;
}
