/**
 * Generates flat placeholder art so battle/roster UI can be built before real
 * character images exist. Re-run after adding a character/enemy/banner:
 *   node scripts/gen-placeholders.mjs
 *
 * Real art just overwrites these files at the same paths — no code changes.
 * The manifest below is intentionally standalone (a dev tool, not shipped data);
 * data-integrity.test.ts fails if a referenced art file is missing.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

const ELEMENT_COLORS = {
  fire: "#ff6b4a",
  ice: "#7fd4ff",
  wind: "#8ef0b8",
  earth: "#d4a86a",
  lightning: "#f4d35e",
  water: "#5aa9ff",
  light: "#fff3c4",
  dark: "#9a7bd0",
};
const RARITY_COLORS = { 3: "#7da7d9", 4: "#c07de0", 5: "#e0b23d" };
const NEUTRAL = "#8a8f9e";

const characters = [
  ["kai", "fire", 3],
  ["rin", "water", 3],
  ["toa", "earth", 3],
  ["mei", "wind", 3],
  ["ayaka", "ice", 4],
  ["sora", "lightning", 4],
  ["hana", "light", 4],
  ["garrett", "earth", 4],
  ["seraphine", "light", 5],
  ["nyx", "dark", 5],
];

const enemies = [
  ["wisp", "fire"],
  ["frost-hound", "ice"],
  ["gale-sprite", "wind"],
  ["stone-golem", "earth"],
  ["storm-drake", "lightning"],
  ["tide-serpent", "water"],
  ["shade", "dark"],
  ["cinder-wyrm", "fire"],
];

const banners = [
  ["standard", NEUTRAL],
  ["rate-up-seraphine", ELEMENT_COLORS.light],
  ["rate-up-emilia", ELEMENT_COLORS.ice],
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix([r, g, b], [r2, g2, b2], t) {
  return [
    Math.round(r + (r2 - r) * t),
    Math.round(g + (g2 - g) * t),
    Math.round(b + (b2 - b) * t),
  ];
}

// --- minimal PNG encoder (RGB, 8-bit, no filter) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}
function encodePng(width, height, pixelAt) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelAt(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function cardPixels(width, height, elementColor, rarityColor) {
  const el = hexToRgb(elementColor);
  const elDark = mix(el, [0, 0, 0], 0.55);
  const elMid = mix(el, [0, 0, 0], 0.15);
  const rar = hexToRgb(rarityColor);
  const border = Math.round(Math.min(width, height) * 0.02);
  const inset = Math.round(Math.min(width, height) * 0.1);
  const bandTop = Math.round(height * 0.8);
  return (x, y) => {
    if (x < border || y < border || x >= width - border || y >= height - border) return rar;
    if (y >= bandTop) return mix(rar, [0, 0, 0], 0.1);
    if (x < inset || y < inset || x >= width - inset || y >= bandTop - inset / 2) return elDark;
    // subtle vertical gradient on the inner panel
    const t = (y - inset) / (bandTop - inset);
    return mix(elMid, elDark, t * 0.6);
  };
}

// Smooth diagonal gradient in the accent colours — the default menu wallpaper.
function wallpaperPixels(width, height) {
  const a = mix(hexToRgb("#7c5cff"), [0, 0, 0], 0.55);
  const b = mix(hexToRgb("#35d0ba"), [0, 0, 0], 0.72);
  const base = hexToRgb("#0b0d14");
  return (x, y) => {
    const t = (x / width + y / height) / 2;
    const g = mix(a, b, t);
    return mix(base, g, 0.5 + 0.35 * Math.sin(t * Math.PI));
  };
}

function writePng(relPath, buf) {
  const abs = join(PUBLIC, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, buf);
}

let count = 0;
for (const [id, element, rarity] of characters) {
  const el = ELEMENT_COLORS[element];
  const rar = RARITY_COLORS[rarity];
  writePng(`assets/characters/${id}/portrait.png`, encodePng(512, 512, cardPixels(512, 512, el, rar)));
  writePng(`assets/characters/${id}/battle.png`, encodePng(420, 560, cardPixels(420, 560, el, rar)));
  count += 2;
}
for (const [id, element] of enemies) {
  const el = ELEMENT_COLORS[element];
  writePng(`assets/enemies/${id}/battle.png`, encodePng(420, 480, cardPixels(420, 480, el, NEUTRAL)));
  count += 1;
}
for (const [id, color] of banners) {
  writePng(`assets/banners/${id}.png`, encodePng(1200, 500, cardPixels(1200, 500, color, "#2a2f3e")));
  count += 1;
}

writePng("assets/menu-bg.png", encodePng(1600, 1000, wallpaperPixels(1600, 1000)));
count += 1;

console.log(`Wrote ${count} placeholder images under public/assets/`);
if (!existsSync(join(PUBLIC, "assets/characters/kai/portrait.png"))) {
  process.exitCode = 1;
}
