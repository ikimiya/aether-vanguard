import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARACTERS, getCharacter } from "./characters";
import { ENEMIES } from "./enemies";
import { SKILLS } from "./skills";
import { STAGES, ENDLESS } from "./stages";
import { BANNERS } from "./gacha/banners";
import { RARITIES } from "./gacha/rarities";

const PUBLIC = join(process.cwd(), "public");
const asset = (p: string) => join(PUBLIC, p);

describe("characters", () => {
  it("have unique ids", () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reference only known skills", () => {
    for (const c of CHARACTERS) {
      expect(c.skills.length).toBeGreaterThan(0);
      for (const id of c.skills) {
        expect(SKILLS[id], `${c.id} -> ${id}`).toBeDefined();
      }
    }
  });

  it("declare a valid rarity", () => {
    for (const c of CHARACTERS) {
      expect(RARITIES[c.rarity], c.id).toBeDefined();
    }
  });

  it("have art files on disk", () => {
    for (const c of CHARACTERS) {
      expect(existsSync(asset(c.art.portrait)), c.art.portrait).toBe(true);
      expect(existsSync(asset(c.art.battle)), c.art.battle).toBe(true);
    }
  });
});

describe("enemies", () => {
  it("reference only known skills and have art", () => {
    for (const e of Object.values(ENEMIES)) {
      for (const id of e.skills) expect(SKILLS[id], `${e.id} -> ${id}`).toBeDefined();
      expect(existsSync(asset(e.art.battle)), e.art.battle).toBe(true);
    }
  });
});

describe("stages", () => {
  it("reference only known enemies", () => {
    for (const s of STAGES) {
      expect(s.waves.length).toBeGreaterThan(0);
      for (const wave of s.waves) {
        expect(wave.length).toBeGreaterThan(0);
        for (const w of wave) {
          expect(ENEMIES[w.enemyId], `${s.id} -> ${w.enemyId}`).toBeDefined();
          expect(w.level).toBeGreaterThan(0);
        }
      }
    }
  });

  it("have unique ids", () => {
    const ids = STAGES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("endless config", () => {
  it("pools reference known enemies", () => {
    for (const id of [...ENDLESS.enemyPool, ...ENDLESS.bossPool]) {
      expect(ENEMIES[id], id).toBeDefined();
    }
  });
});

describe("gacha banners", () => {
  it("featured ids exist and match their rarity slot", () => {
    for (const b of BANNERS) {
      for (const [rarity, ids] of Object.entries(b.featured)) {
        for (const id of ids) {
          const c = getCharacter(id);
          expect(c.rarity, `${b.id}: ${id}`).toBe(Number(rarity));
        }
      }
      expect(existsSync(asset(b.art)), b.art).toBe(true);
    }
  });

  it("base rates sum to 1", () => {
    const sum = Object.values(RARITIES).reduce((a, r) => a + r.baseRate, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
