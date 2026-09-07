import { describe, expect, it } from "vitest";
import { computeDamage } from "./damage";
import { makeRng } from "./rng";
import type { Unit } from "./types";

function unit(over: Partial<Unit> = {}): Unit {
  return {
    uid: "u",
    side: "player",
    slot: 0,
    sourceId: "x",
    name: "X",
    element: "fire",
    isBoss: false,
    level: 1,
    star: 1,
    stats: { hp: 1000, atk: 100, matk: 100, def: 50, mdef: 50, spd: 100 },
    hp: 1000,
    mp: 100,
    maxMp: 100,
    mpRegen: 10,
    skills: [],
    mods: [],
    defending: false,
    alive: true,
    ...over,
  };
}

describe("computeDamage", () => {
  it("applies element advantage as a higher roll on average", () => {
    const rng = makeRng(7);
    const atk = unit({ element: "fire" });
    const weakToFire = unit({ element: "ice", side: "enemy" });
    const neutral = unit({ element: "earth", side: "enemy" });
    let adv = 0;
    let neu = 0;
    for (let i = 0; i < 200; i++) {
      adv += computeDamage(rng, atk, weakToFire, 1, "physical", "fire").amount;
      neu += computeDamage(rng, atk, neutral, 1, "physical", "fire").amount;
    }
    expect(adv).toBeGreaterThan(neu * 1.3);
  });

  it("defending roughly halves damage", () => {
    const rng = makeRng(3);
    const atk = unit();
    const open = unit({ side: "enemy", element: "earth" });
    const guarded = unit({ side: "enemy", element: "earth", defending: true });
    let openTotal = 0;
    let guardedTotal = 0;
    for (let i = 0; i < 200; i++) {
      openTotal += computeDamage(rng, atk, open, 1, "physical", "fire").amount;
      guardedTotal += computeDamage(rng, atk, guarded, 1, "physical", "fire").amount;
    }
    expect(guardedTotal).toBeLessThan(openTotal * 0.6);
    expect(guardedTotal).toBeGreaterThan(openTotal * 0.4);
  });

  it("higher defense reduces damage", () => {
    const rng = makeRng(11);
    const atk = unit();
    const soft = unit({ side: "enemy", element: "earth", stats: { ...unit().stats, def: 10 } });
    const hard = unit({ side: "enemy", element: "earth", stats: { ...unit().stats, def: 400 } });
    const s = computeDamage(rng, atk, soft, 1, "physical", "fire").amount;
    const h = computeDamage(rng, atk, hard, 1, "physical", "fire").amount;
    expect(h).toBeLessThan(s);
  });

  it("buffs raise attacker output", () => {
    const rng = makeRng(5);
    const plain = unit();
    const buffed = unit({
      mods: [{ effect: { kind: "buff", stat: "atk", amount: 0.5, turns: 3 }, turnsLeft: 3 }],
    });
    const target = unit({ side: "enemy", element: "earth" });
    let plainT = 0;
    let buffT = 0;
    for (let i = 0; i < 200; i++) {
      plainT += computeDamage(rng, plain, target, 1, "physical", "fire").amount;
      buffT += computeDamage(rng, buffed, target, 1, "physical", "fire").amount;
    }
    expect(buffT).toBeGreaterThan(plainT * 1.3);
  });
});
