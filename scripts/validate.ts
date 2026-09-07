/**
 * Validates the static game data (characters, banners, skills, enemies, stages)
 * against the schema before it can be used:
 *
 *   npm run validate
 *
 * `npm run gen:sql` runs this first and aborts if it finds anything.
 * `src/game/data/data-integrity.test.ts` also asserts `validate()` is empty.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { CHARACTERS, CHARACTERS_BY_ID } from "../src/game/data/characters";
import { BANNERS } from "../src/game/data/gacha/banners";
import { SKILLS } from "../src/game/data/skills";
import { ENEMIES } from "../src/game/data/enemies";
import { STAGES, ENDLESS } from "../src/game/data/stages";
import { RARITIES } from "../src/game/data/gacha/rarities";
import { MAX_STAR } from "../src/game/progression";
import type { Rarity } from "../src/game/types";

const PUBLIC = join(process.cwd(), "public");
const RARITIES_LIST: Rarity[] = [3, 4, 5];

export function validate(): string[] {
  const errs: string[] = [];
  const e = (msg: string) => errs.push(msg);

  // --- characters ---------------------------------------------------------
  const seenChar = new Set<string>();
  for (const c of CHARACTERS) {
    if (seenChar.has(c.id)) e(`character: duplicate id "${c.id}"`);
    seenChar.add(c.id);

    if (!RARITIES[c.rarity]) e(`character "${c.id}": invalid rarity ${c.rarity}`);
    if (c.skills.length === 0) e(`character "${c.id}": no skills`);
    for (const s of c.skills) {
      if (!SKILLS[s]) e(`character "${c.id}": unknown skill "${s}"`);
    }

    for (const [star, cost] of Object.entries(c.starUp ?? {})) {
      const n = Number(star);
      if (n < 2 || n > MAX_STAR) e(`character "${c.id}": starUp key ${star} out of 2..${MAX_STAR}`);
      if (typeof cost !== "number" || cost < 0) e(`character "${c.id}": starUp[${star}] must be >= 0`);
    }

    for (const p of [c.art.portrait, c.art.battle, c.art.splash].filter(Boolean) as string[]) {
      if (!existsSync(join(PUBLIC, p))) e(`character "${c.id}": missing art file ${p}`);
    }
  }

  // --- banners -----------------------------------------------------------
  const seenBanner = new Set<string>();
  for (const b of BANNERS) {
    if (seenBanner.has(b.id)) e(`banner: duplicate id "${b.id}"`);
    seenBanner.add(b.id);

    if (b.costPerPull <= 0) e(`banner "${b.id}": costPerPull must be > 0`);
    if (!existsSync(join(PUBLIC, b.art))) e(`banner "${b.id}": missing art file ${b.art}`);

    for (const r of RARITIES_LIST) {
      for (const id of b.featured[r] ?? []) {
        const c = CHARACTERS_BY_ID[id];
        if (!c) e(`banner "${b.id}": featured[${r}] references unknown character "${id}"`);
        else if (c.rarity !== r) e(`banner "${b.id}": "${id}" is rarity ${c.rarity}, not ${r}`);
      }
      const rate = b.featuredRate?.[r];
      if (rate != null && (rate <= 0 || rate > 1)) {
        e(`banner "${b.id}": featuredRate[${r}] = ${rate} not in (0, 1]`);
      }
    }
    for (const id of b.poolCharacters ?? []) {
      if (!CHARACTERS_BY_ID[id]) e(`banner "${b.id}": poolCharacters references unknown character "${id}"`);
    }

    const s = b.startsAt ? Date.parse(b.startsAt) : null;
    const t = b.endsAt ? Date.parse(b.endsAt) : null;
    if (b.startsAt && Number.isNaN(s)) e(`banner "${b.id}": startsAt "${b.startsAt}" is not a date`);
    if (b.endsAt && Number.isNaN(t)) e(`banner "${b.id}": endsAt "${b.endsAt}" is not a date`);
    if (s != null && t != null && !Number.isNaN(s) && !Number.isNaN(t) && s >= t) {
      e(`banner "${b.id}": startsAt is not before endsAt`);
    }
  }

  // --- rarity rates ----------------------------------------------------
  const rateSum = Object.values(RARITIES).reduce((a, r) => a + r.baseRate, 0);
  if (Math.abs(rateSum - 1) > 1e-9) e(`rarity base rates sum to ${rateSum}, not 1`);

  // --- stages / enemies ----------------------------------------------
  const seenStage = new Set<string>();
  for (const stage of STAGES) {
    if (seenStage.has(stage.id)) e(`stage: duplicate id "${stage.id}"`);
    seenStage.add(stage.id);
    for (const wave of stage.waves) {
      for (const w of wave) {
        if (!ENEMIES[w.enemyId]) e(`stage "${stage.id}": unknown enemy "${w.enemyId}"`);
      }
    }
  }
  for (const id of [...ENDLESS.enemyPool, ...ENDLESS.bossPool]) {
    if (!ENEMIES[id]) e(`endless config: unknown enemy "${id}"`);
  }
  for (const en of Object.values(ENEMIES)) {
    if (!existsSync(join(PUBLIC, en.art.battle))) e(`enemy "${en.id}": missing art file ${en.art.battle}`);
    for (const s of en.skills) {
      if (!SKILLS[s]) e(`enemy "${en.id}": unknown skill "${s}"`);
    }
  }

  // --- menu wallpaper ---------------------------------------------------
  if (!existsSync(join(PUBLIC, "assets/menu-bg.png"))) e(`missing public/assets/menu-bg.png`);

  return errs;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const errs = validate();
  if (errs.length === 0) {
    console.log("game data OK");
  } else {
    console.error(`${errs.length} problem(s):`);
    for (const err of errs) console.error(`  - ${err}`);
    process.exit(1);
  }
}
