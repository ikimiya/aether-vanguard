import type { StatKey } from "../types";
import type { Unit } from "./types";

/**
 * Effective stat = base * (1 + sum of buff/debuff fractions on that stat),
 * clamped so a stack of debuffs can't drop it below 10% of base.
 */
export function effectiveStat(unit: Unit, key: Exclude<StatKey, "hp">): number {
  let mult = 1;
  for (const mod of unit.mods) {
    if (mod.effect.kind === "buff" || mod.effect.kind === "debuff") {
      if (mod.effect.stat === key) mult += mod.effect.amount;
    }
  }
  return Math.max(unit.stats[key] * 0.1, unit.stats[key] * mult);
}
