import type { OwnedCharacter } from "../lib/db/roster";
import type { PartyMember } from "./engine";
import { CHARACTERS_BY_ID } from "./data/characters";

export const ACTIVE_SLOTS = 3;
export const TEAM_SIZE = 5;

/** Turn owned-character rows into an ordered party (first 3 active, next 2 bench). */
export function toParty(owned: OwnedCharacter[], orderedKeys: string[]): PartyMember[] {
  const byKey = new Map(owned.map((o) => [o.character_key, o]));
  return orderedKeys
    .map((key) => byKey.get(key))
    .filter((o): o is OwnedCharacter => Boolean(o) && Boolean(CHARACTERS_BY_ID[o!.character_key]))
    .slice(0, TEAM_SIZE)
    .map((o) => ({ characterId: o.character_key, level: o.level, star: o.star }));
}

/** A reasonable default team: highest rarity, then highest level, capped at 5. */
export function suggestTeam(owned: OwnedCharacter[]): string[] {
  return [...owned]
    .filter((o) => CHARACTERS_BY_ID[o.character_key])
    .sort((a, b) => {
      const ra = CHARACTERS_BY_ID[a.character_key].rarity;
      const rb = CHARACTERS_BY_ID[b.character_key].rarity;
      if (rb !== ra) return rb - ra;
      return b.level - a.level;
    })
    .slice(0, TEAM_SIZE)
    .map((o) => o.character_key);
}
