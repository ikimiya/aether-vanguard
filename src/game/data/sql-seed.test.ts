import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { emitConfigSql } from "../../../scripts/gen-sql-config";
import { CHARACTERS } from "./characters";
import { RARITIES } from "./gacha/rarities";
import { BANNERS } from "./gacha/banners";

const SEED_PATH = join(process.cwd(), "supabase", "generated", "config_seed.sql");

describe("config_seed.sql", () => {
  it("is up to date with the TS balance data (run `npm run gen:sql`)", () => {
    const onDisk = readFileSync(SEED_PATH, "utf8").replace(/\r\n/g, "\n");
    expect(onDisk).toBe(emitConfigSql().replace(/\r\n/g, "\n"));
  });

  it("contains every character with its rarity", () => {
    const sql = emitConfigSql();
    for (const c of CHARACTERS) {
      expect(sql).toContain(`('${c.id}', ${c.rarity})`);
    }
  });

  it("carries the rarity base rates and banner costs", () => {
    const sql = emitConfigSql();
    expect(sql).toContain(`(5, ${RARITIES[5].baseRate}, ${RARITIES[5].levelCap}, ${RARITIES[5].dupeShards})`);
    for (const b of BANNERS) {
      expect(sql).toContain(`('${b.id}', ${b.costPerPull},`);
    }
  });
});
