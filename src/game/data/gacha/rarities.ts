import type { Rarity, RarityConfig } from "../../types";

export const RARITIES: Record<Rarity, RarityConfig> = {
  3: { label: "R", baseRate: 0.789, levelCap: 40, dupeShards: 5, color: "#7da7d9" },
  4: { label: "SR", baseRate: 0.19, levelCap: 60, dupeShards: 15, color: "#c07de0" },
  5: { label: "SSR", baseRate: 0.021, levelCap: 80, dupeShards: 50, color: "#e0b23d" },
};

export const PITY = {
  /** Guaranteed 5★ on this pull count since the last one. */
  hard5star: 90,
  /** 5★ rate ramps linearly from base up to 1.0 between here and hard5star. */
  soft5starStart: 74,
  /** Guaranteed 4★-or-better every this many pulls. */
  guaranteed4star: 10,
} as const;

/** Chance the featured 5★ is chosen (vs a random pool 5★) when not guaranteed. */
export const FEATURED_5STAR_CHANCE = 0.5;
