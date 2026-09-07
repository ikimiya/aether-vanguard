import type { Element, RingElement } from "../types";

/** fire → ice → wind → earth → lightning → water → fire. Each beats the next. */
const RING: RingElement[] = ["fire", "ice", "wind", "earth", "lightning", "water"];

export const ELEMENT_COLORS: Record<Element, string> = {
  fire: "#ff6b4a",
  ice: "#7fd4ff",
  wind: "#8ef0b8",
  earth: "#d4a86a",
  lightning: "#f4d35e",
  water: "#5aa9ff",
  light: "#fff3c4",
  dark: "#9a7bd0",
};

export const ADVANTAGE = 1.5;
export const DISADVANTAGE = 0.75;

/**
 * Damage multiplier for `attacker` element hitting `defender` element.
 * Ring: hitting the element you beat = 1.5, hitting the one that beats you = 0.75.
 * Light and Dark are a mutual 1.5 pair and neutral against the ring.
 */
export function elementMultiplier(attacker: Element, defender: Element): number {
  if (attacker === "light") return defender === "dark" ? ADVANTAGE : 1;
  if (attacker === "dark") return defender === "light" ? ADVANTAGE : 1;
  if (defender === "light" || defender === "dark") return 1;

  const ai = RING.indexOf(attacker);
  const di = RING.indexOf(defender);
  if (ai === -1 || di === -1) return 1;
  if ((ai + 1) % RING.length === di) return ADVANTAGE;
  if ((di + 1) % RING.length === ai) return DISADVANTAGE;
  return 1;
}

export function elementRelation(
  attacker: Element,
  defender: Element,
): "advantage" | "disadvantage" | "neutral" {
  const m = elementMultiplier(attacker, defender);
  if (m > 1) return "advantage";
  if (m < 1) return "disadvantage";
  return "neutral";
}
