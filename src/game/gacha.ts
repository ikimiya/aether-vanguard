import type { Banner, Rarity } from "./types";
import { CHARACTERS, getCharacter } from "./data/characters";
import { FEATURED_5STAR_CHANCE, PITY, RARITIES } from "./data/gacha/rarities";
import { makeRng, rngChance, rngNext, rngPick, type Rng } from "./engine/rng";

export interface GachaStateData {
  pulls_since_5star: number;
  pulls_since_4star: number;
  guaranteed_featured: boolean;
}

export interface PullOutcome {
  characterId: string;
  rarity: Rarity;
  isNew: boolean;
  isFeatured: boolean;
  dupeShards: number;
}

const FOUR_STAR_FEATURED_CHANCE = 0.5;

function rollRarity(rng: Rng, since5: number, since4: number): Rarity {
  if (since5 >= PITY.hard5star) return 5;

  let rate5 = RARITIES[5].baseRate;
  if (since5 >= PITY.soft5starStart) {
    const span = PITY.hard5star - PITY.soft5starStart;
    const t = (since5 - PITY.soft5starStart + 1) / span;
    rate5 = rate5 + t * (1 - rate5);
  }

  const roll = rngNext(rng);
  if (roll < rate5) return 5;
  if (since4 >= PITY.guaranteed4star - 1) return 4;
  if (roll < rate5 + RARITIES[4].baseRate) return 4;
  return 3;
}

function poolFor(banner: Banner, rarity: Rarity): string[] {
  const ids = banner.poolCharacters ?? CHARACTERS.map((c) => c.id);
  return ids.filter((id) => getCharacter(id).rarity === rarity);
}

interface PickCtx {
  guaranteed: boolean;
}

function pickCharacter(
  rng: Rng,
  banner: Banner,
  rarity: Rarity,
  ctx: PickCtx,
): { id: string; featured: boolean } {
  const featured = banner.featured[rarity] ?? [];
  const pool = poolFor(banner, rarity);

  if (rarity === 5 && featured.length > 0) {
    if (ctx.guaranteed || rngChance(rng, FEATURED_5STAR_CHANCE)) {
      ctx.guaranteed = false;
      return { id: rngPick(rng, featured), featured: true };
    }
    ctx.guaranteed = true;
    const off = pool.filter((id) => !featured.includes(id));
    return { id: rngPick(rng, off.length ? off : featured), featured: false };
  }

  if (rarity === 4 && featured.length > 0 && rngChance(rng, FOUR_STAR_FEATURED_CHANCE)) {
    return { id: rngPick(rng, featured), featured: true };
  }

  return { id: rngPick(rng, pool.length ? pool : featured), featured: false };
}

/**
 * Roll `count` pulls on a banner. Pure: pass the current pity state, the set of
 * character keys already owned, and a seeded RNG. Returns the outcomes and the
 * pity state to persist.
 */
export function rollPulls(
  banner: Banner,
  count: number,
  state: GachaStateData,
  ownedKeys: Iterable<string>,
  seed: number,
): { outcomes: PullOutcome[]; nextState: GachaStateData } {
  const rng = makeRng(seed);
  const owned = new Set(ownedKeys);
  const ctx: PickCtx = { guaranteed: state.guaranteed_featured };
  let since5 = state.pulls_since_5star;
  let since4 = state.pulls_since_4star;
  const outcomes: PullOutcome[] = [];

  for (let i = 0; i < count; i++) {
    since5++;
    since4++;
    const rarity = rollRarity(rng, since5, since4);
    if (rarity === 5) since5 = 0;
    if (rarity >= 4) since4 = 0;

    const { id, featured } = pickCharacter(rng, banner, rarity, ctx);
    const isNew = !owned.has(id);
    owned.add(id);
    outcomes.push({
      characterId: id,
      rarity,
      isNew,
      isFeatured: featured,
      dupeShards: isNew ? 0 : RARITIES[rarity].dupeShards,
    });
  }

  return {
    outcomes,
    nextState: {
      pulls_since_5star: since5,
      pulls_since_4star: since4,
      guaranteed_featured: ctx.guaranteed,
    },
  };
}
