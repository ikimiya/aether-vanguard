import { describe, expect, it } from "vitest";
import { endlessWave } from "./endless";
import { ENEMIES } from "./data/enemies";
import { ENDLESS } from "./data/stages";

describe("endlessWave", () => {
  it("is deterministic for a seed", () => {
    expect(endlessWave(3, 1)).toEqual(endlessWave(3, 1));
  });

  it("scales level with the wave number", () => {
    const early = endlessWave(1, 5)[0].level;
    const late = endlessWave(10, 5)[0].level;
    expect(late).toBeGreaterThan(early);
  });

  it("only references known enemies", () => {
    for (let n = 1; n <= 30; n++) {
      for (const w of endlessWave(n, n)) expect(ENEMIES[w.enemyId], w.enemyId).toBeDefined();
    }
  });

  it("boss waves land on the configured cadence", () => {
    const bossWave = endlessWave(ENDLESS.bossEveryWaves, 9);
    expect(bossWave).toHaveLength(1);
    expect(ENEMIES[bossWave[0].enemyId].boss).toBe(true);
  });

  it("enemy count never exceeds the cap", () => {
    for (let n = 1; n <= 40; n++) {
      if (n % ENDLESS.bossEveryWaves === 0) continue;
      expect(endlessWave(n, 1).length).toBeLessThanOrEqual(ENDLESS.maxCount);
    }
  });
});
