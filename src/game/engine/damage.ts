import type { Element, Skill } from "../types";
import { elementMultiplier, elementRelation } from "../data/elements";
import { effectiveStat } from "./stats";
import { rngChance, rngRange, type Rng } from "./rng";
import type { ElementRelation, Unit } from "./types";

export const CRIT_CHANCE = 0.05;
export const CRIT_MULT = 1.5;
export const BASIC_ATTACK_POWER = 1.0;
export const BASIC_ATTACK_MP_GAIN = 8;
export const DEFEND_DAMAGE_MULT = 0.5;

export function defendMpGain(unit: Unit): number {
  return Math.round(10 + 0.1 * unit.maxMp);
}

export function skillElement(skill: Skill, caster: Unit): Element {
  return skill.element ?? caster.element;
}

export interface DamageResult {
  amount: number;
  crit: boolean;
  element: Element;
  relation: ElementRelation;
}

/**
 * dmg = sourceStat * power * (100 / (100 + targetDef)) * elementMult * crit * variance
 * halved again if the target is defending.
 */
export function computeDamage(
  rng: Rng,
  source: Unit,
  target: Unit,
  power: number,
  type: "physical" | "magic",
  element: Element,
): DamageResult {
  const sourceStat = effectiveStat(source, type === "physical" ? "atk" : "matk");
  const targetDef = effectiveStat(target, type === "physical" ? "def" : "mdef");

  const raw = sourceStat * power;
  const mitigated = raw * (100 / (100 + targetDef));
  const mult = elementMultiplier(element, target.element);
  const crit = rngChance(rng, CRIT_CHANCE);
  const variance = rngRange(rng, 0.9, 1.1);

  let amount = mitigated * mult * (crit ? CRIT_MULT : 1) * variance;
  if (target.defending) amount *= DEFEND_DAMAGE_MULT;

  return {
    amount: Math.max(1, Math.round(amount)),
    crit,
    element,
    relation: elementRelation(element, target.element),
  };
}

/** Heals scale off the caster's magic attack. No crit, no element, no mitigation. */
export function computeHeal(rng: Rng, source: Unit, power: number): number {
  const variance = rngRange(rng, 0.9, 1.1);
  return Math.max(1, Math.round(effectiveStat(source, "matk") * power * variance));
}
