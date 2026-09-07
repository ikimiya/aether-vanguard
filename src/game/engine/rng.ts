/** Seeded RNG. State is a plain object so `structuredClone` can copy a battle. */
export interface Rng {
  s: number;
}

export function makeRng(seed: number): Rng {
  return { s: seed >>> 0 };
}

/** mulberry32 — fast, deterministic, good enough for a game. Returns [0, 1). */
export function rngNext(r: Rng): number {
  r.s = (r.s + 0x6d2b79f5) | 0;
  let t = Math.imul(r.s ^ (r.s >>> 15), 1 | r.s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function rngInt(r: Rng, maxExclusive: number): number {
  return Math.floor(rngNext(r) * maxExclusive);
}

export function rngRange(r: Rng, lo: number, hi: number): number {
  return lo + rngNext(r) * (hi - lo);
}

export function rngChance(r: Rng, p: number): boolean {
  return rngNext(r) < p;
}

export function rngPick<T>(r: Rng, arr: readonly T[]): T {
  return arr[rngInt(r, arr.length)];
}
