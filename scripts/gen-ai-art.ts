/**
 * Generates real art via the Google Gemini image API from each asset's
 * `artPrompt`, resized to the exact placeholder dimensions.
 *
 *   npm run gen:ai-art -- [--only <id>] [--type portrait|battle|enemy|banner|bg]
 *                         [--force] [--dry-run] [--delay <ms>]
 *
 * Needs GEMINI_API_KEY in .env — free key at https://aistudio.google.com/apikey.
 * dev-only; the key is never bundled into the client.
 *
 * By default it only (re)generates files that are missing or still a placeholder
 * (< 64 KB). Hand-placed art is left alone unless you pass --force or --only.
 * Use --dry-run first to review the composed prompts before spending quota.
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Jimp } from "jimp";
import { CHARACTERS } from "../src/game/data/characters";
import { ENEMIES } from "../src/game/data/enemies";
import { BANNERS } from "../src/game/data/gacha/banners";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const die = (m: string): never => {
  console.error(`gen:ai-art: ${m}`);
  process.exit(1);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

try {
  process.loadEnvFile(join(ROOT, ".env"));
} catch {
  /* no .env — fine for --dry-run */
}

const MODEL = "gemini-2.5-flash-image"; // Google may rename this ("Nano Banana")
const endpoint = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

const PLACEHOLDER_MAX = 64 * 1024;

type Kind = "portrait" | "battle" | "enemy" | "banner" | "bg";

const STYLE =
  "Anime key art, painterly digital illustration, dramatic rim lighting, vibrant colours, high detail, no text, no watermark.";
const FRAMING: Record<Kind, string> = {
  portrait: "Single character, head-and-shoulders portrait, facing the viewer, square composition, clean background.",
  battle: "Single character, full body, dynamic action pose, tall portrait composition, plain flat background.",
  enemy: "Single creature, full body, menacing pose, tall portrait composition, plain dark background.",
  banner: "Wide cinematic environment scene, landscape composition, no characters.",
  bg: "Ultra-wide cinematic fantasy vista, deep atmospheric perspective, no characters.",
};
const MENU_WALLPAPER =
  "A vast twilight sky over floating islands and distant spires, sweeping aurora light, epic yet calm.";
const SIZE: Record<Kind, { w: number; h: number }> = {
  portrait: { w: 512, h: 512 },
  battle: { w: 420, h: 560 },
  enemy: { w: 420, h: 480 },
  banner: { w: 1200, h: 500 },
  bg: { w: 1600, h: 1000 },
};

interface Target {
  id: string;
  kind: Kind;
  base: string; // the artPrompt
  rel: string; // path under public/
}

const targets: Target[] = [];
for (const c of CHARACTERS) {
  if (!c.artPrompt) continue;
  targets.push({ id: c.id, kind: "portrait", base: c.artPrompt, rel: `assets/characters/${c.id}/portrait.png` });
  targets.push({ id: c.id, kind: "battle", base: c.artPrompt, rel: `assets/characters/${c.id}/battle.png` });
}
for (const e of Object.values(ENEMIES)) {
  if (!e.artPrompt) continue;
  targets.push({ id: e.id, kind: "enemy", base: e.artPrompt, rel: `assets/enemies/${e.id}/battle.png` });
}
for (const b of BANNERS) {
  if (!b.artPrompt) continue;
  targets.push({ id: b.id, kind: "banner", base: b.artPrompt, rel: `assets/banners/${b.id}.png` });
}
targets.push({ id: "menu-bg", kind: "bg", base: MENU_WALLPAPER, rel: "assets/menu-bg.png" });

// --- CLI ------------------------------------------------------------------
const argv = process.argv.slice(2);
const has = (n: string) => argv.includes(`--${n}`);
const val = (n: string) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const only = val("only");
const kindFilter = val("type") as Kind | undefined;
const force = has("force");
const dryRun = has("dry-run");
const delayMs = Number(val("delay") ?? 6000);

let queue = targets;
if (only) queue = queue.filter((t) => t.id === only);
if (kindFilter) queue = queue.filter((t) => t.kind === kindFilter);
if (queue.length === 0) die(`nothing matches those filters (characters/enemies need an artPrompt)`);

const promptFor = (t: Target) => `${t.base.replace(/[.\s]+$/, "")}. ${FRAMING[t.kind]} ${STYLE}`;
const isPlaceholder = (abs: string) => !existsSync(abs) || statSync(abs).size < PLACEHOLDER_MAX;

if (dryRun) {
  for (const t of queue) {
    const s = SIZE[t.kind];
    console.log(`\n${t.id} · ${t.kind} → public/${t.rel}  (${s.w}×${s.h})`);
    console.log(`  ${promptFor(t)}`);
  }
  console.log(`\n${queue.length} target(s). Drop --dry-run to generate.`);
  process.exit(0);
}

// --- generate -----------------------------------------------------------
interface Part {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
}

async function generate(prompt: string, key: string, attempt = 1): Promise<Buffer> {
  const res = await fetch(endpoint(key), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (res.status === 429 && attempt <= 5) {
    const wait = 20_000 * attempt;
    console.warn(`  rate-limited — waiting ${wait / 1000}s (try ${attempt}/5)`);
    await sleep(wait);
    return generate(prompt, key, attempt + 1);
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`);
  }
  const json = JSON.parse(text) as { candidates?: { content?: { parts?: Part[] } }[] };
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!img?.inlineData?.data) {
    throw new Error(`no image in response: ${text.slice(0, 400)}`);
  }
  return Buffer.from(img.inlineData.data, "base64");
}

const key = process.env.GEMINI_API_KEY;
if (!key) die("set GEMINI_API_KEY in .env — free key at https://aistudio.google.com/apikey");

let made = 0;
let skipped = 0;
for (let i = 0; i < queue.length; i++) {
  const t = queue[i];
  const abs = join(PUBLIC, t.rel);
  if (!force && !only && !isPlaceholder(abs)) {
    console.log(`skip  ${t.rel}  (real art present — use --force to overwrite)`);
    skipped++;
    continue;
  }
  const { w, h } = SIZE[t.kind];
  process.stdout.write(`gen   ${t.id} · ${t.kind} … `);
  try {
    const raw = await generate(promptFor(t), key!);
    const image = await Jimp.read(raw);
    const png = await image.cover({ w, h }).getBuffer("image/png");
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, png);
    console.log(`✓ public/${t.rel} (${w}×${h})`);
    made++;
  } catch (e) {
    console.log(`✗ ${(e as Error).message}`);
  }
  if (i < queue.length - 1) await sleep(delayMs);
}

console.log(`\n${made} generated, ${skipped} skipped. Next: npm run validate`);
