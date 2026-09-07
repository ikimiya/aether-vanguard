import type { Skill, SkillEffect } from "../types";
import { getSkill } from "../data/skills";
import { chooseEnemyAction } from "./ai";
import {
  BASIC_ATTACK_MP_GAIN,
  BASIC_ATTACK_POWER,
  computeDamage,
  computeHeal,
  defendMpGain,
  skillElement,
} from "./damage";
import { initBattle, spawnWave } from "./setup";
import { effectiveStat } from "./stats";
import type { BattleConfig, BattleState, PlayerAction, Unit } from "./types";

// --------------------------------------------------------------------------
// selectors
// --------------------------------------------------------------------------

export function unitById(state: BattleState, uid: string): Unit | undefined {
  return state.players.find((u) => u.uid === uid) ?? state.enemies.find((u) => u.uid === uid);
}

export function fieldPlayers(state: BattleState): Unit[] {
  return state.players.filter((u) => u.slot >= 0 && u.slot < 3).sort((a, b) => a.slot - b.slot);
}

export function benchPlayers(state: BattleState): Unit[] {
  return state.players.filter((u) => u.slot === -1 && u.alive);
}

export function livingEnemies(state: BattleState): Unit[] {
  return state.enemies.filter((u) => u.alive);
}

export function activeUnit(state: BattleState): Unit | null {
  return state.activeUid ? (unitById(state, state.activeUid) ?? null) : null;
}

export function affordableSkills(unit: Unit): Skill[] {
  return unit.skills.map(getSkill).filter((s) => unit.mp >= s.mpCost);
}

export function isSingleTarget(skill: Skill): boolean {
  return skill.target === "one-enemy" || skill.target === "one-ally";
}

// --------------------------------------------------------------------------
// turn resolution
// --------------------------------------------------------------------------

function opposing(state: BattleState, unit: Unit): Unit[] {
  return unit.side === "player" ? livingEnemies(state) : fieldPlayers(state).filter((u) => u.alive);
}

function sameSide(state: BattleState, unit: Unit): Unit[] {
  return unit.side === "player"
    ? fieldPlayers(state).filter((u) => u.alive)
    : livingEnemies(state);
}

function pickFrom(pool: Unit[], preferredUid?: string): Unit[] {
  if (pool.length === 0) return [];
  const preferred = preferredUid && pool.find((u) => u.uid === preferredUid);
  return [preferred || pool[0]];
}

function resolveTargets(
  state: BattleState,
  unit: Unit,
  skill: Skill,
  targetUid: string | undefined,
): Unit[] {
  const enemies = opposing(state, unit);
  const allies = sameSide(state, unit);
  switch (skill.target) {
    case "one-enemy":
      return pickFrom(enemies, targetUid);
    case "all-enemies":
      return enemies;
    case "one-ally":
      return pickFrom(allies, targetUid);
    case "all-allies":
      return allies;
    case "self":
      return [unit];
  }
}

function applyDamage(state: BattleState, source: Unit, target: Unit, power: number, type: Skill["type"], element: Unit["element"]) {
  const dr = computeDamage(state.rng, source, target, power, type, element);
  target.hp = Math.max(0, target.hp - dr.amount);
  state.log.push({
    t: "damage",
    sourceUid: source.uid,
    uid: target.uid,
    amount: dr.amount,
    crit: dr.crit,
    element: dr.element,
    relation: dr.relation,
    hpAfter: target.hp,
  });
}

function applyHeal(state: BattleState, source: Unit, target: Unit, amount: number) {
  const before = target.hp;
  target.hp = Math.min(target.stats.hp, target.hp + amount);
  state.log.push({
    t: "heal",
    sourceUid: source.uid,
    uid: target.uid,
    amount: target.hp - before,
    hpAfter: target.hp,
  });
}

function applyEffect(state: BattleState, target: Unit, effect: SkillEffect) {
  target.mods.push({ effect, turnsLeft: effect.turns });
  state.log.push({
    t: "mod",
    uid: target.uid,
    kind: effect.kind,
    stat: "stat" in effect ? effect.stat : undefined,
    turns: effect.turns,
  });
}

function resolveAction(state: BattleState, unit: Unit, action: PlayerAction): void {
  if (action.kind === "defend") {
    unit.defending = true;
    unit.mp = Math.min(unit.maxMp, unit.mp + defendMpGain(unit));
    state.log.push({ t: "action", uid: unit.uid, kind: "defend", targets: [] });
    state.log.push({ t: "mp", uid: unit.uid, mpAfter: unit.mp });
    return;
  }

  if (action.kind === "attack") {
    const pool = opposing(state, unit);
    const [target] = pickFrom(pool, action.targetUid);
    if (!target) return;
    state.log.push({ t: "action", uid: unit.uid, kind: "attack", targets: [target.uid] });
    applyDamage(state, unit, target, BASIC_ATTACK_POWER, "physical", unit.element);
    unit.mp = Math.min(unit.maxMp, unit.mp + BASIC_ATTACK_MP_GAIN);
    state.log.push({ t: "mp", uid: unit.uid, mpAfter: unit.mp });
    return;
  }

  const skill = getSkill(action.skillId);
  if (unit.mp < skill.mpCost) {
    resolveAction(state, unit, { kind: "attack", targetUid: action.targetUid });
    return;
  }
  unit.mp -= skill.mpCost;
  const targets = resolveTargets(state, unit, skill, action.targetUid);
  state.log.push({
    t: "action",
    uid: unit.uid,
    kind: "skill",
    skillId: skill.id,
    targets: targets.map((u) => u.uid),
  });
  const element = skillElement(skill, unit);
  for (const target of targets) {
    if (skill.heal) {
      applyHeal(state, unit, target, computeHeal(state.rng, unit, skill.power));
    } else if (skill.power > 0) {
      applyDamage(state, unit, target, skill.power, skill.type, element);
    }
    for (const effect of skill.effects ?? []) {
      applyEffect(state, target, effect);
    }
  }
  state.log.push({ t: "mp", uid: unit.uid, mpAfter: unit.mp });
}

// --------------------------------------------------------------------------
// turn lifecycle
// --------------------------------------------------------------------------

function startTurn(state: BattleState, unit: Unit): void {
  unit.defending = false;
  state.log.push({ t: "turn-start", uid: unit.uid });
  for (const mod of unit.mods) {
    if (mod.effect.kind === "dot") {
      const dmg = Math.max(1, Math.round(unit.stats.hp * mod.effect.amount));
      unit.hp = Math.max(0, unit.hp - dmg);
      state.log.push({ t: "dot", uid: unit.uid, amount: dmg, hpAfter: unit.hp });
    } else if (mod.effect.kind === "regen") {
      const before = unit.hp;
      unit.hp = Math.min(unit.stats.hp, unit.hp + Math.round(unit.stats.hp * mod.effect.amount));
      state.log.push({ t: "regen", uid: unit.uid, amount: unit.hp - before, hpAfter: unit.hp });
    }
  }
}

function endTurn(state: BattleState, unit: Unit): void {
  if (unit.alive && unit.hp > 0) {
    unit.mp = Math.min(unit.maxMp, unit.mp + unit.mpRegen);
    state.log.push({ t: "mp", uid: unit.uid, mpAfter: unit.mp });
  }
  for (const mod of unit.mods) mod.turnsLeft--;
  unit.mods = unit.mods.filter((m) => m.turnsLeft > 0);
}

function startRound(state: BattleState): void {
  state.round++;
  state.log.push({ t: "round-start", round: state.round });
  const actors = [
    ...fieldPlayers(state).filter((u) => u.alive),
    ...livingEnemies(state),
  ];
  actors.sort((a, b) => {
    const spd = effectiveStat(b, "spd") - effectiveStat(a, "spd");
    if (Math.abs(spd) > 1e-9) return spd;
    if (a.side !== b.side) return a.side === "player" ? -1 : 1;
    return a.slot - b.slot;
  });
  state.queue = actors.map((u) => u.uid);
}

/** Mark deaths, resolve wave/victory/defeat, or pause for a bench swap. */
function reconcile(state: BattleState): void {
  for (const unit of [...state.players, ...state.enemies]) {
    if (unit.alive && unit.hp <= 0) {
      unit.alive = false;
      unit.hp = 0;
      state.log.push({ t: "ko", uid: unit.uid });
      if (unit.side === "player" && unit.slot >= 0) state.playerDeaths++;
    }
  }

  if (state.enemies.every((e) => !e.alive)) {
    if (state.waveIndex < state.waves.length - 1) {
      state.log.push({ t: "wave-cleared", waveIndex: state.waveIndex });
      state.waveIndex++;
      state.enemies = spawnWave(state.waves, state.waveIndex);
      state.log.push({ t: "wave-start", waveIndex: state.waveIndex });
      state.queue = [];
      return;
    }
    state.phase = "victory";
    state.activeUid = null;
    state.log.push({
      t: "victory",
      rounds: state.round,
      noDeaths: state.playerDeaths === 0,
    });
    return;
  }

  if (state.players.every((p) => !p.alive)) {
    state.phase = "defeat";
    state.activeUid = null;
    state.log.push({ t: "defeat", rounds: state.round });
    return;
  }

  for (let slot = 0; slot < 3; slot++) {
    const occupant = state.players.find((p) => p.slot === slot);
    if (!occupant || !occupant.alive) {
      if (benchPlayers(state).length > 0) {
        state.phase = "needs-swap";
        state.swapSlot = slot;
        state.activeUid = null;
        state.log.push({ t: "swap-needed", slot });
        return;
      }
    }
  }
}

function advance(state: BattleState): BattleState {
  let guard = 0;
  while (true) {
    if (++guard > 20000) throw new Error("battle did not terminate");
    if (state.phase === "victory" || state.phase === "defeat" || state.phase === "needs-swap") {
      return state;
    }

    if (state.queue.length === 0) startRound(state);

    const uid = state.queue[0];
    const unit = unitById(state, uid);
    if (!unit || !unit.alive || unit.slot < 0) {
      state.queue.shift();
      continue;
    }

    startTurn(state, unit);
    reconcile(state);
    if (state.phase !== "awaiting-action") {
      state.queue = state.queue.filter((q) => q !== uid);
      continue;
    }
    if (!unit.alive) {
      state.queue.shift();
      continue;
    }

    if (unit.side === "enemy") {
      resolveAction(state, unit, chooseEnemyAction(state, unit));
      endTurn(state, unit);
      state.queue.shift();
      reconcile(state);
      continue;
    }

    state.phase = "awaiting-action";
    state.activeUid = unit.uid;
    return state;
  }
}

// --------------------------------------------------------------------------
// public API
// --------------------------------------------------------------------------

const clone = (s: BattleState): BattleState => structuredClone(s);

export function createBattle(config: BattleConfig): BattleState {
  return advance(initBattle(config));
}

export function submitAction(prev: BattleState, action: PlayerAction): BattleState {
  const state = clone(prev);
  if (state.phase !== "awaiting-action" || !state.activeUid) {
    throw new Error(`Cannot submit an action while phase is "${state.phase}"`);
  }
  const unit = unitById(state, state.activeUid);
  if (!unit) throw new Error("Active unit is missing");

  resolveAction(state, unit, action);
  endTurn(state, unit);
  state.queue = state.queue.filter((q) => q !== unit.uid);
  state.activeUid = null;
  reconcile(state);
  return advance(state);
}

export function submitSwap(prev: BattleState, benchUid: string): BattleState {
  const state = clone(prev);
  if (state.phase !== "needs-swap" || state.swapSlot === null) {
    throw new Error(`No swap is pending (phase "${state.phase}")`);
  }
  const slot = state.swapSlot;
  const incoming = state.players.find((p) => p.uid === benchUid);
  if (!incoming || incoming.slot !== -1 || !incoming.alive) {
    throw new Error("Invalid bench unit for swap");
  }
  const outgoing = state.players.find((p) => p.slot === slot);
  if (outgoing) outgoing.slot = -2;
  incoming.slot = slot;
  state.swapSlot = null;
  state.phase = "awaiting-action";
  state.log.push({ t: "swap", slot, inUid: incoming.uid });

  reconcile(state);
  return advance(state);
}
