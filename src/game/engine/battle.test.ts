import { describe, expect, it } from "vitest";
import type { Wave } from "../types";
import {
  activeUnit,
  benchPlayers,
  createBattle,
  fieldPlayers,
  livingEnemies,
  submitAction,
  submitSwap,
  unitById,
} from "./index";
import type { BattleState } from "./types";

const party = (...members: [string, number][]) =>
  members.map(([characterId, level]) => ({ characterId, level, star: 1 }));

function firstTurnUid(state: BattleState): string {
  const roundStart = state.log.findIndex((e) => e.t === "round-start");
  const turn = state.log.slice(roundStart).find((e) => e.t === "turn-start");
  return turn && turn.t === "turn-start" ? turn.uid : "";
}

/** Play greedily: attack the first living enemy; send the first bench unit on swaps. */
function autoPlay(start: BattleState): BattleState {
  let state = start;
  let guard = 0;
  while (state.phase === "awaiting-action" || state.phase === "needs-swap") {
    if (++guard > 500) throw new Error("autoPlay did not finish");
    if (state.phase === "needs-swap") {
      state = submitSwap(state, benchPlayers(state)[0].uid);
      continue;
    }
    const target = livingEnemies(state)[0];
    state = submitAction(state, { kind: "attack", targetUid: target.uid });
  }
  return state;
}

describe("createBattle", () => {
  it("opens awaiting a player action", () => {
    const state = createBattle({
      seed: 1,
      party: party(["kai", 5]),
      waves: [[{ enemyId: "wisp", level: 1 }]],
    });
    expect(state.phase).toBe("awaiting-action");
    expect(activeUnit(state)?.side).toBe("player");
  });

  it("starts player mp at half of max", () => {
    const state = createBattle({
      seed: 1,
      party: party(["ayaka", 1]),
      waves: [[{ enemyId: "wisp", level: 1 }]],
    });
    expect(unitById(state, "p0")!.mp).toBe(Math.round(110 * 0.5));
  });
});

describe("turn order", () => {
  it("faster side acts first", () => {
    const fastPlayer = createBattle({
      seed: 2,
      party: party(["mei", 1]), // spd 112
      waves: [[{ enemyId: "stone-golem", level: 1 }]], // spd 66
    });
    expect(firstTurnUid(fastPlayer).startsWith("p")).toBe(true);

    const slowPlayer = createBattle({
      seed: 2,
      party: party(["toa", 1]), // spd 84
      waves: [[{ enemyId: "gale-sprite", level: 1 }]], // spd 122
    });
    expect(firstTurnUid(slowPlayer).startsWith("e")).toBe(true);
  });
});

describe("actions", () => {
  it("a basic attack damages the target and grants mp", () => {
    const start = createBattle({
      seed: 3,
      party: party(["nyx", 10]),
      waves: [[{ enemyId: "stone-golem", level: 8 }]],
    });
    const enemyBefore = livingEnemies(start)[0].hp;
    const mpBefore = activeUnit(start)!.mp;
    const next = submitAction(start, { kind: "attack", targetUid: livingEnemies(start)[0].uid });
    const enemy = unitById(next, "e0_0")!;
    expect(enemy.hp).toBeLessThan(enemyBefore);
    // mp gained from the attack, then regen at end of turn
    expect(unitById(next, "p0")!.mp).toBeGreaterThan(mpBefore);
  });

  it("defend restores mp and is reflected in state", () => {
    const start = createBattle({
      seed: 4,
      party: party(["toa", 5]),
      waves: [[{ enemyId: "wisp", level: 1 }]],
    });
    const before = activeUnit(start)!.mp;
    const next = submitAction(start, { kind: "defend" });
    expect(unitById(next, "p0")!.mp).toBeGreaterThan(before);
  });

  it("a skill spends mp and never drops below zero", () => {
    const start = createBattle({
      seed: 5,
      party: party(["ayaka", 1]),
      waves: [[{ enemyId: "wisp", level: 1 }]],
    });
    const next = submitAction(start, {
      kind: "skill",
      skillId: "frost-pierce",
      targetUid: livingEnemies(start)[0].uid,
    });
    const ayaka = unitById(next, "p0")!;
    expect(ayaka.mp).toBeGreaterThanOrEqual(0);
    // 55 start - 28 cost + 14 regen
    expect(ayaka.mp).toBe(41);
  });
});

describe("outcomes", () => {
  it("reaches victory against a weak wave and reports rounds", () => {
    const end = autoPlay(
      createBattle({
        seed: 6,
        party: party(["nyx", 20], ["seraphine", 20]),
        waves: [[{ enemyId: "wisp", level: 1 }]],
      }),
    );
    expect(end.phase).toBe("victory");
    const victory = end.log.find((e) => e.t === "victory");
    expect(victory && victory.t === "victory" && victory.rounds).toBeGreaterThan(0);
  });

  it("advances through multiple waves", () => {
    const waves: Wave[] = [
      [{ enemyId: "wisp", level: 1 }],
      [{ enemyId: "wisp", level: 1 }],
    ];
    const end = autoPlay(
      createBattle({ seed: 7, party: party(["nyx", 30]), waves }),
    );
    expect(end.phase).toBe("victory");
    expect(end.log.some((e) => e.t === "wave-cleared")).toBe(true);
    expect(end.waveIndex).toBe(1);
  });

  it("prompts a bench swap when an active unit falls, then continues", () => {
    let state = createBattle({
      seed: 9,
      party: party(["kai", 1], ["rin", 1], ["toa", 1], ["mei", 1]),
      waves: [[{ enemyId: "storm-drake", level: 30 }]],
    });
    let sawSwap = false;
    let guard = 0;
    while (state.phase === "awaiting-action" || state.phase === "needs-swap") {
      if (++guard > 500) break;
      if (state.phase === "needs-swap") {
        sawSwap = true;
        const bench = benchPlayers(state)[0];
        state = submitSwap(state, bench.uid);
        expect(fieldPlayers(state).some((u) => u.uid === bench.uid)).toBe(true);
        continue;
      }
      state = submitAction(state, { kind: "attack", targetUid: livingEnemies(state)[0].uid });
    }
    expect(sawSwap).toBe(true);
  });

  it("loses when the whole party is down and no bench remains", () => {
    const end = autoPlay(
      createBattle({
        seed: 12,
        party: party(["kai", 1]),
        waves: [[{ enemyId: "cinder-wyrm", level: 12 }]],
      }),
    );
    expect(end.phase).toBe("defeat");
  });
});

describe("determinism", () => {
  it("same seed + same actions produce an identical event log", () => {
    const run = (seed: number) =>
      autoPlay(
        createBattle({
          seed,
          party: party(["sora", 15], ["garrett", 15], ["hana", 15]),
          waves: [
            [{ enemyId: "frost-hound", level: 8 }, { enemyId: "shade", level: 8 }],
            [{ enemyId: "storm-drake", level: 9 }],
          ],
        }),
      );
    expect(run(42).log).toEqual(run(42).log);
    expect(run(42).phase).toBe(run(42).phase);
  });
});
