/**
 * Generates a new character or banner data file (+ registers it in the index),
 * so adding one is a single command instead of hand-authoring stat blocks.
 *
 *   npm run scaffold -- character <id> <Name> <3|4|5> <element> <dps|support|tank> [magic|physical]
 *   npm run scaffold -- banner <id> <Name> <featuredCharId> [durationDays]
 *
 * The generated numbers are a balanced *starting point* — tune them freely.
 * After scaffolding: npm run validate && npm run gen:sql, then re-run
 * config_seed.sql in Supabase.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CHARACTERS_BY_ID } from "../src/game/data/characters";
import { SKILLS } from "../src/game/data/skills";
import type { Element, Rarity, Role } from "../src/game/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const die = (msg: string): never => {
  console.error(`scaffold: ${msg}`);
  process.exit(1);
};

const ELEMENTS: Element[] = ["fire", "ice", "wind", "earth", "lightning", "water", "light", "dark"];
const ROLES: Role[] = ["dps", "support", "tank"];

// --- stat templates (matched to the existing 3/4/5★ units) -------------------
const RARITY_TPL: Record<Rarity, {
  hp: number; off: number; spd: number; def: number; mp: number; mpRegen: number;
  grow: { hp: number; off: number; spd: number; def: number };
}> = {
  3: { hp: 950, off: 102, spd: 98, def: 50, mp: 100, mpRegen: 12, grow: { hp: 58, off: 7, spd: 0.8, def: 3.2 } },
  4: { hp: 1130, off: 132, spd: 104, def: 62, mp: 115, mpRegen: 14, grow: { hp: 78, off: 10, spd: 1.0, def: 4.2 } },
  5: { hp: 1310, off: 170, spd: 112, def: 74, mp: 135, mpRegen: 16, grow: { hp: 92, off: 13, spd: 1.3, def: 4.6 } },
};
const ROLE_MULT: Record<Role, { hp: number; off: number; def: number }> = {
  dps: { hp: 1, off: 1, def: 1 },
  support: { hp: 1.05, off: 0.62, def: 1.15 },
  tank: { hp: 1.4, off: 0.5, def: 1.55 },
};

// --- element -> existing skill kit ------------------------------------------
const KITS: Record<Element, string[]> = {
  fire: ["ember-lance", "inferno-wave", "war-cry"],
  ice: ["frost-pierce", "blizzard", "mending-light"],
  wind: ["gale-slash", "tempest", "war-cry"],
  earth: ["stone-maul", "aegis-hymn", "war-cry"],
  lightning: ["thunder-spike", "chain-lightning", "war-cry"],
  water: ["frost-pierce", "tempest", "mending-light"],
  light: ["solar-flare", "dawn-chorus", "mending-light"],
  dark: ["abyssal-rend", "hex", "chain-lightning"],
};
const SUPPORT_KIT = ["mending-light", "dawn-chorus", "aegis-hymn"];

const r1 = (n: number) => Math.round(n);
const r2 = (n: number) => Math.round(n * 10) / 10;

function characterFile(
  id: string,
  name: string,
  rarity: Rarity,
  element: Element,
  role: Role,
  style: "magic" | "physical",
): string {
  const t = RARITY_TPL[rarity];
  const m = ROLE_MULT[role];
  const primary = t.off * m.off;
  const secondary = primary * 0.55;
  const [atk, matk] = style === "magic" ? [secondary, primary] : [primary, secondary];
  const growPrimary = t.grow.off * m.off;
  const growSecondary = growPrimary * 0.55;
  const [gAtk, gMatk] = style === "magic" ? [growSecondary, growPrimary] : [growPrimary, growSecondary];

  const kit = role === "support" ? SUPPORT_KIT : KITS[element];
  const skills = kit.slice(0, rarity === 5 ? 3 : rarity === 4 ? 2 : 1);
  for (const s of skills) if (!SKILLS[s]) die(`kit for "${element}" references unknown skill "${s}" — fix KITS`);

  const stats = {
    hp: r1(t.hp * m.hp),
    atk: r1(atk),
    matk: r1(matk),
    def: r1(t.def * m.def),
    mdef: r1(t.def * m.def * 0.95),
    spd: r1(t.spd),
  };
  const growth = {
    hp: r1(t.grow.hp * m.hp),
    atk: r2(gAtk),
    matk: r2(gMatk),
    def: r2(t.grow.def * m.def),
    mdef: r2(t.grow.def * m.def * 0.95),
    spd: r2(t.grow.spd),
  };
  const j = (o: Record<string, number>) =>
    "{ " + Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(", ") + " }";

  return `import type { Character } from "../../types";

// Scaffolded by \`npm run scaffold\` — stats/skills are a starting point, tune freely.
export const ${id.replace(/-/g, "_")}: Character = {
  id: "${id}",
  name: "${name}",
  rarity: ${rarity},
  element: "${element}",
  role: "${role}",
  baseStats: ${j(stats)},
  growth: ${j(growth)},
  maxMp: ${t.mp},
  mpRegen: ${t.mpRegen},
  skills: [${skills.map((s) => `"${s}"`).join(", ")}],
  art: { portrait: "assets/characters/${id}/portrait.png", battle: "assets/characters/${id}/battle.png" },
  lore: "TODO: write ${name}'s lore.",
};
`;
}

function bannerFile(id: string, name: string, charId: string, days: number): string {
  const now = new Date();
  const end = new Date(now.getTime() + days * 86400_000);
  const rarity = CHARACTERS_BY_ID[charId].rarity;
  const constName = id.toUpperCase().replace(/-/g, "_");
  return `import type { Banner } from "../../../types";

// Scaffolded by \`npm run scaffold\`.
export const ${constName}: Banner = {
  id: "${id}",
  name: "${name}",
  costPerPull: 160,
  featured: { ${rarity}: ["${charId}"] },
  startsAt: "${now.toISOString()}",
  endsAt: "${end.toISOString()}",
  art: "assets/banners/${id}.png",
};
`;
}

/** Add `importLine` after the last local import, and `arrayEntry` into the first
 *  multi-line `[ ... ]` (append = before `];`, prepend = right after `[`).
 *  Bails with a printout if the file shape isn't recognised. */
function editIndex(
  path: string,
  importLine: string,
  arrayEntry: string,
  where: "append" | "prepend",
) {
  const abs = join(ROOT, path);
  let src = readFileSync(abs, "utf8");
  const imports = [...src.matchAll(/^import \{[^}]+\} from "\.[^"]+";$/gm)];
  const arrayRe = where === "append" ? /\n\];/ : /=\s*\[\n/;
  if (imports.length === 0 || !arrayRe.test(src)) {
    console.warn(
      `scaffold: couldn't auto-edit ${path}; add these two lines manually:\n  ${importLine}\n  ${arrayEntry}`,
    );
    return;
  }
  const last = imports[imports.length - 1];
  const at = last.index! + last[0].length;
  src = src.slice(0, at) + "\n" + importLine + src.slice(at);
  src =
    where === "append"
      ? src.replace(/\n\];/, `\n  ${arrayEntry}\n];`)
      : src.replace(/(=\s*\[\n)/, `$1  ${arrayEntry}\n`);
  writeFileSync(abs, src);
  console.log(`scaffold: updated ${path}`);
}

// --- CLI -------------------------------------------------------------------
const [mode, ...args] = process.argv.slice(2);

if (mode === "character") {
  const [id, name, rarityStr, element, role, styleArg] = args;
  if (!id || !name || !rarityStr || !element || !role) {
    die("usage: scaffold character <id> <Name> <3|4|5> <element> <dps|support|tank> [magic|physical]");
  }
  if (!/^[a-z0-9-]+$/.test(id)) die(`id "${id}" must be lowercase letters/digits/hyphens`);
  if (CHARACTERS_BY_ID[id]) die(`id "${id}" already exists`);
  const rarity = Number(rarityStr) as Rarity;
  if (![3, 4, 5].includes(rarity)) die(`rarity must be 3, 4 or 5`);
  if (!ELEMENTS.includes(element as Element)) die(`element must be one of: ${ELEMENTS.join(", ")}`);
  if (!ROLES.includes(role as Role)) die(`role must be one of: ${ROLES.join(", ")}`);
  const style = styleArg === "physical" ? "physical" : "magic";

  const rel = `src/game/data/characters/${id}.ts`;
  if (existsSync(join(ROOT, rel))) die(`${rel} already exists`);
  writeFileSync(join(ROOT, rel), characterFile(id, name, rarity, element as Element, role as Role, style));
  console.log(`scaffold: wrote ${rel}`);

  editIndex(
    "src/game/data/characters/index.ts",
    `import { ${id.replace(/-/g, "_")} } from "./${id}";`,
    `${id.replace(/-/g, "_")},`,
    "append",
  );

  if (!existsSync(join(ROOT, `public/assets/characters/${id}/portrait.png`))) {
    console.warn(
      `scaffold: no art at public/assets/characters/${id}/ — drop portrait.png (512×512) + battle.png (420×560),\n` +
        `          or add ["${id}", "${element}", ${rarity}] to scripts/gen-placeholders.mjs and run npm run gen:art`,
    );
  }
  console.log(`\nnext: npm run validate && npm run gen:sql`);
} else if (mode === "banner") {
  const [id, name, charId, daysStr] = args;
  if (!id || !name || !charId) die("usage: scaffold banner <id> <Name> <featuredCharId> [durationDays]");
  if (!/^[a-z0-9-]+$/.test(id)) die(`id "${id}" must be lowercase letters/digits/hyphens`);
  if (!CHARACTERS_BY_ID[charId]) die(`featured character "${charId}" not found`);
  const days = daysStr ? Number(daysStr) : 21;
  if (!Number.isFinite(days) || days <= 0) die(`durationDays must be a positive number`);

  const rel = `src/game/data/gacha/banners/${id}.ts`;
  if (existsSync(join(ROOT, rel))) die(`${rel} already exists`);
  writeFileSync(join(ROOT, rel), bannerFile(id, name, charId, days));
  console.log(`scaffold: wrote ${rel}`);

  editIndex(
    "src/game/data/gacha/banners/index.ts",
    `import { ${id.toUpperCase().replace(/-/g, "_")} } from "./${id}";`,
    `${id.toUpperCase().replace(/-/g, "_")},`,
    "prepend",
  );

  console.warn(
    `scaffold: add banner art at public/assets/banners/${id}.png,\n` +
      `          or add ["${id}", "#7fd4ff"] to scripts/gen-placeholders.mjs and run npm run gen:art`,
  );
  console.log(`\nnext: npm run validate && npm run gen:sql`);
} else {
  die("first arg must be 'character' or 'banner'");
}
