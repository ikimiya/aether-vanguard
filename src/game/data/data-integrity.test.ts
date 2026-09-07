import { describe, expect, it } from "vitest";
import { validate } from "../../../scripts/validate";
import { CHARACTERS, tryGetCharacter } from "./characters";

describe("game data", () => {
  it("passes validate() — no schema / reference / asset problems", () => {
    expect(validate()).toEqual([]);
  });

  it("tryGetCharacter resolves known ids and returns undefined for others", () => {
    expect(tryGetCharacter(CHARACTERS[0].id)).toBe(CHARACTERS[0]);
    expect(tryGetCharacter("not-a-real-character")).toBeUndefined();
  });
});
