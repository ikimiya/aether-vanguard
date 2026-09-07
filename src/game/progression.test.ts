import { describe, expect, it } from "vitest";
import {
  computeStats,
  levelCap,
  starUpCost,
  totalLevelUpCost,
  MAX_STAR,
} from "./progression";
import { getCharacter } from "./data/characters";

describe("computeStats", () => {
  const kai = getCharacter("kai");

  it("returns base stats at level 1 star 1", () => {
    expect(computeStats(kai, 1, 1)).toEqual(kai.baseStats);
  });

  it("adds growth per level", () => {
    const at10 = computeStats(kai, 10, 1);
    expect(at10.atk).toBe(Math.round(kai.baseStats.atk + kai.growth.atk * 9));
    expect(at10.hp).toBeGreaterThan(kai.baseStats.hp);
  });

  it("scales up with stars", () => {
    const s1 = computeStats(kai, 20, 1);
    const s5 = computeStats(kai, 20, 5);
    expect(s5.atk).toBeGreaterThan(s1.atk);
  });
});

describe("costs and caps", () => {
  it("level cap follows rarity", () => {
    expect(levelCap(3)).toBe(40);
    expect(levelCap(4)).toBe(60);
    expect(levelCap(5)).toBe(80);
  });

  it("level-up cost is monotonic and accumulates", () => {
    const a = totalLevelUpCost(1, 10);
    const b = totalLevelUpCost(1, 20);
    expect(b.gold).toBeGreaterThan(a.gold);
    expect(b.xp_items).toBeGreaterThanOrEqual(a.xp_items);
  });

  it("star-up cost rises per star and is null at max", () => {
    expect(starUpCost(1)!).toBeLessThan(starUpCost(4)!);
    expect(starUpCost(MAX_STAR)).toBeNull();
  });
});
