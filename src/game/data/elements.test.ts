import { describe, expect, it } from "vitest";
import { ADVANTAGE, DISADVANTAGE, elementMultiplier, elementRelation } from "./elements";

describe("elementMultiplier", () => {
  it("ring advantage: each element beats the next", () => {
    expect(elementMultiplier("fire", "ice")).toBe(ADVANTAGE);
    expect(elementMultiplier("ice", "wind")).toBe(ADVANTAGE);
    expect(elementMultiplier("wind", "earth")).toBe(ADVANTAGE);
    expect(elementMultiplier("earth", "lightning")).toBe(ADVANTAGE);
    expect(elementMultiplier("lightning", "water")).toBe(ADVANTAGE);
    expect(elementMultiplier("water", "fire")).toBe(ADVANTAGE);
  });

  it("ring disadvantage is the reverse edge", () => {
    expect(elementMultiplier("ice", "fire")).toBe(DISADVANTAGE);
    expect(elementMultiplier("fire", "water")).toBe(DISADVANTAGE);
  });

  it("non-adjacent ring elements are neutral", () => {
    expect(elementMultiplier("fire", "earth")).toBe(1);
    expect(elementMultiplier("fire", "lightning")).toBe(1);
    expect(elementMultiplier("fire", "fire")).toBe(1);
  });

  it("light and dark are a mutual advantage pair", () => {
    expect(elementMultiplier("light", "dark")).toBe(ADVANTAGE);
    expect(elementMultiplier("dark", "light")).toBe(ADVANTAGE);
  });

  it("light/dark are neutral against ring elements both ways", () => {
    expect(elementMultiplier("light", "fire")).toBe(1);
    expect(elementMultiplier("fire", "light")).toBe(1);
    expect(elementMultiplier("dark", "water")).toBe(1);
    expect(elementMultiplier("water", "dark")).toBe(1);
  });

  it("relation helper mirrors the multiplier", () => {
    expect(elementRelation("fire", "ice")).toBe("advantage");
    expect(elementRelation("ice", "fire")).toBe("disadvantage");
    expect(elementRelation("fire", "earth")).toBe("neutral");
  });
});
