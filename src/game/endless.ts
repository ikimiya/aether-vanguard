import type { Wave } from "./types";
import { ENDLESS } from "./data/stages";
import { makeRng, rngInt } from "./engine/rng";

/** Deterministically build the enemy wave for endless round `n` (1-indexed). */
export function endlessWave(n: number, seed: number): Wave {
  const rng = makeRng(seed ^ (n * 0x9e3779b9));
  const level = ENDLESS.baseLevel + n * ENDLESS.levelStep;

  if (n > 0 && n % ENDLESS.bossEveryWaves === 0) {
    const bossId = ENDLESS.bossPool[rngInt(rng, ENDLESS.bossPool.length)];
    return [{ enemyId: bossId, level: level + ENDLESS.levelStep }];
  }

  const extra = Math.floor((n - 1) / ENDLESS.addEnemyEveryWaves);
  const count = Math.min(ENDLESS.maxCount, ENDLESS.startCount + extra);
  return Array.from({ length: count }, () => ({
    enemyId: ENDLESS.enemyPool[rngInt(rng, ENDLESS.enemyPool.length)],
    level,
  }));
}
