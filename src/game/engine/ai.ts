import { getSkill } from "../data/skills";
import { rngChance, rngPick } from "./rng";
import type { BattleState, PlayerAction, Unit } from "./types";

const USE_SKILL_CHANCE = 0.7;

function lowestHp(units: Unit[]): Unit {
  return units.reduce((a, b) => (b.hp < a.hp ? b : a));
}

/** Enemy turn: usually a random affordable skill on the weakest valid target,
 *  otherwise a basic attack on the weakest player. */
export function chooseEnemyAction(state: BattleState, unit: Unit): PlayerAction {
  const players = state.players.filter((p) => p.alive && p.slot >= 0 && p.slot < 3);
  const allies = state.enemies.filter((e) => e.alive);
  if (players.length === 0) return { kind: "defend" };

  const affordable = unit.skills
    .map(getSkill)
    .filter((s) => unit.mp >= s.mpCost);

  if (affordable.length > 0 && rngChance(state.rng, USE_SKILL_CHANCE)) {
    const skill = rngPick(state.rng, affordable);
    if (skill.target === "one-enemy") {
      return { kind: "skill", skillId: skill.id, targetUid: lowestHp(players).uid };
    }
    if (skill.target === "one-ally") {
      const hurt = allies.filter((a) => a.hp < a.stats.hp);
      const target = hurt.length ? lowestHp(hurt) : unit;
      return { kind: "skill", skillId: skill.id, targetUid: target.uid };
    }
    return { kind: "skill", skillId: skill.id };
  }

  return { kind: "attack", targetUid: lowestHp(players).uid };
}
