import type { Element, SkillEffect, StatBlock, StatKey, Wave } from "../types";
import type { Rng } from "./rng";

export type Side = "player" | "enemy";

export interface ActiveMod {
  effect: SkillEffect;
  turnsLeft: number;
}

export interface Unit {
  uid: string;
  side: Side;
  /** 0..2 for a slot on the field; -1 while benched. */
  slot: number;
  sourceId: string;
  name: string;
  element: Element;
  isBoss: boolean;
  level: number;
  star: number;
  /** Max/effective-at-full stats. Current values live in hp/mp. */
  stats: StatBlock;
  hp: number;
  mp: number;
  maxMp: number;
  mpRegen: number;
  skills: string[];
  mods: ActiveMod[];
  /** True from the turn a unit defends until the start of its next turn. */
  defending: boolean;
  alive: boolean;
}

export type BattlePhase =
  | "awaiting-action"
  | "needs-swap"
  | "victory"
  | "defeat";

export type PlayerAction =
  | { kind: "attack"; targetUid?: string }
  | { kind: "defend" }
  | { kind: "skill"; skillId: string; targetUid?: string };

export type ElementRelation = "advantage" | "disadvantage" | "neutral";

export type BattleEvent =
  | { t: "round-start"; round: number }
  | { t: "turn-start"; uid: string }
  | { t: "action"; uid: string; kind: "attack" | "defend" | "skill"; skillId?: string; targets: string[] }
  | {
      t: "damage";
      sourceUid: string;
      uid: string;
      amount: number;
      crit: boolean;
      element: Element;
      relation: ElementRelation;
      hpAfter: number;
    }
  | { t: "heal"; sourceUid: string; uid: string; amount: number; hpAfter: number }
  | { t: "mod"; uid: string; kind: SkillEffect["kind"]; stat?: StatKey; turns: number }
  | { t: "dot"; uid: string; amount: number; hpAfter: number }
  | { t: "regen"; uid: string; amount: number; hpAfter: number }
  | { t: "mp"; uid: string; mpAfter: number }
  | { t: "ko"; uid: string }
  | { t: "swap-needed"; slot: number }
  | { t: "swap"; slot: number; inUid: string }
  | { t: "wave-cleared"; waveIndex: number }
  | { t: "wave-start"; waveIndex: number }
  | { t: "victory"; rounds: number; noDeaths: boolean }
  | { t: "defeat"; rounds: number };

export interface BattleState {
  rng: Rng;
  round: number;
  phase: BattlePhase;
  /** uid whose turn it is, when phase is "awaiting-action". */
  activeUid: string | null;
  /** slot needing a bench unit, when phase is "needs-swap". */
  swapSlot: number | null;
  /** uids still to act this round, front = next. */
  queue: string[];
  players: Unit[];
  enemies: Unit[];
  waves: Wave[];
  waveIndex: number;
  playerDeaths: number;
  log: BattleEvent[];
}

export interface PartyMember {
  characterId: string;
  level: number;
  star: number;
}

export interface BattleConfig {
  seed: number;
  /** Up to 5. The first 3 start active, the rest benched. */
  party: PartyMember[];
  waves: Wave[];
}
