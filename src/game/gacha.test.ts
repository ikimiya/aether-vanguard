import { describe, expect, it } from "vitest";
import { bannerActive, rollPulls, type GachaStateData } from "./gacha";
import { RATE_UP_SERAPHINE, STANDARD_BANNER } from "./data/gacha/banners";
import { PITY, RARITIES } from "./data/gacha/rarities";
import { getCharacter } from "./data/characters";
import type { Banner } from "./types";

const fresh: GachaStateData = {
  pulls_since_5star: 0,
  pulls_since_4star: 0,
  guaranteed_featured: false,
};

describe("rollPulls", () => {
  it("every 10-pull contains a 4★ or better", () => {
    for (let seed = 0; seed < 40; seed++) {
      const { outcomes } = rollPulls(STANDARD_BANNER, 10, fresh, [], seed);
      expect(outcomes.length).toBe(10);
      expect(outcomes.some((o) => o.rarity >= 4)).toBe(true);
    }
  });

  it("hard pity forces a 5★ at 90", () => {
    const primed: GachaStateData = { ...fresh, pulls_since_5star: PITY.hard5star - 1 };
    const { outcomes, nextState } = rollPulls(STANDARD_BANNER, 1, primed, [], 123);
    expect(outcomes[0].rarity).toBe(5);
    expect(nextState.pulls_since_5star).toBe(0);
  });

  it("overall 5★ rate is in a sane band over many pulls", () => {
    let fives = 0;
    const N = 4000;
    let state = fresh;
    for (let i = 0; i < N / 10; i++) {
      const res = rollPulls(STANDARD_BANNER, 10, state, [], i);
      state = res.nextState;
      fives += res.outcomes.filter((o) => o.rarity === 5).length;
    }
    const rate = fives / N;
    expect(rate).toBeGreaterThan(RARITIES[5].baseRate);
    expect(rate).toBeLessThan(0.05);
  });

  it("duplicates convert to shards, new pulls do not", () => {
    const owned = ["seraphine", "kai", "rin", "toa", "mei", "ayaka", "sora", "hana", "garrett", "nyx"];
    const { outcomes } = rollPulls(STANDARD_BANNER, 20, fresh, owned, 7);
    for (const o of outcomes) {
      if (o.isNew) expect(o.dupeShards).toBe(0);
      else expect(o.dupeShards).toBe(RARITIES[o.rarity].dupeShards);
    }
  });

  it("losing the featured 5★ guarantees the next one", () => {
    // find a seed where the first 5★ on the rate-up banner is not featured
    for (let seed = 0; seed < 500; seed++) {
      const primed: GachaStateData = { ...fresh, pulls_since_5star: PITY.hard5star - 1 };
      const first = rollPulls(RATE_UP_SERAPHINE, 1, primed, [], seed);
      if (first.outcomes[0].rarity === 5 && !first.outcomes[0].isFeatured) {
        expect(first.nextState.guaranteed_featured).toBe(true);
        const next = rollPulls(RATE_UP_SERAPHINE, 1, { ...first.nextState, pulls_since_5star: PITY.hard5star - 1 }, [], seed + 1);
        expect(next.outcomes[0].isFeatured).toBe(true);
        expect(next.outcomes[0].characterId).toBe("seraphine");
        return;
      }
    }
    throw new Error("no non-featured 5★ found to test the guarantee");
  });

  it("only ever returns characters that exist", () => {
    const { outcomes } = rollPulls(RATE_UP_SERAPHINE, 50, fresh, [], 99);
    for (const o of outcomes) {
      expect(getCharacter(o.characterId).rarity).toBe(o.rarity);
    }
  });

  it("a per-banner featuredRate of 1 always gives the featured 5★", () => {
    const banner: Banner = { ...RATE_UP_SERAPHINE, featuredRate: { 5: 1 } };
    const primed: GachaStateData = { ...fresh, pulls_since_5star: PITY.hard5star - 1 };
    for (let seed = 0; seed < 60; seed++) {
      const { outcomes } = rollPulls(banner, 1, primed, [], seed);
      expect(outcomes[0].rarity).toBe(5);
      expect(outcomes[0].isFeatured).toBe(true);
      expect(outcomes[0].characterId).toBe("seraphine");
    }
  });
});

describe("bannerActive", () => {
  const base = STANDARD_BANNER;
  it("is true with no window", () => {
    expect(bannerActive(base)).toBe(true);
  });
  it("respects startsAt / endsAt", () => {
    const b: Banner = { ...base, startsAt: "2030-01-01T00:00:00Z", endsAt: "2030-02-01T00:00:00Z" };
    expect(bannerActive(b, new Date("2029-12-01T00:00:00Z"))).toBe(false);
    expect(bannerActive(b, new Date("2030-01-15T00:00:00Z"))).toBe(true);
    expect(bannerActive(b, new Date("2030-03-01T00:00:00Z"))).toBe(false);
  });
});
