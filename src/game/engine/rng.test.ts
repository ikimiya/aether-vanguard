import { describe, expect, it } from "vitest";
import { makeRng, rngInt, rngNext } from "./rng";

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = makeRng(12345);
    const b = makeRng(12345);
    const seqA = Array.from({ length: 20 }, () => rngNext(a));
    const seqB = Array.from({ length: 20 }, () => rngNext(b));
    expect(seqA).toEqual(seqB);
  });

  it("differs across seeds", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(rngNext(a)).not.toBe(rngNext(b));
  });

  it("stays in range", () => {
    const r = makeRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = rngNext(r);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(rngInt(r, 6)).toBeGreaterThanOrEqual(0);
      expect(rngInt(r, 6)).toBeLessThan(6);
    }
  });
});
