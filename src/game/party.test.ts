import { describe, expect, it } from "vitest";
import type { OwnedCharacter } from "../lib/db/roster";
import { resolveTeam, suggestTeam, TEAM_SIZE } from "./party";

const own = (character_key: string, level = 1): OwnedCharacter => ({
  id: character_key,
  user_id: "u",
  character_key,
  level,
  exp: 0,
  star: 1,
  dupe_shards: 0,
  acquired_at: "",
});

const roster = [own("kai"), own("rin"), own("toa"), own("mei"), own("ayaka"), own("sora")];

describe("resolveTeam", () => {
  it("keeps a valid saved order as-is", () => {
    expect(resolveTeam(roster, ["mei", "kai", "toa"])).toEqual(["mei", "kai", "toa"]);
  });

  it("drops unowned and unknown keys", () => {
    expect(resolveTeam(roster, ["kai", "seraphine", "not-a-character", "rin"])).toEqual([
      "kai",
      "rin",
    ]);
  });

  it("drops duplicates, first position wins", () => {
    expect(resolveTeam(roster, ["kai", "rin", "kai"])).toEqual(["kai", "rin"]);
  });

  it("caps at TEAM_SIZE", () => {
    const saved = ["kai", "rin", "toa", "mei", "ayaka", "sora"];
    expect(resolveTeam(roster, saved)).toHaveLength(TEAM_SIZE);
    expect(resolveTeam(roster, saved)).toEqual(saved.slice(0, TEAM_SIZE));
  });

  it("falls back to suggestTeam when nothing is saved", () => {
    expect(resolveTeam(roster, [])).toEqual(suggestTeam(roster));
  });

  it("falls back to suggestTeam when every saved key is invalid", () => {
    expect(resolveTeam(roster, ["seraphine", "ghost"])).toEqual(suggestTeam(roster));
  });
});
