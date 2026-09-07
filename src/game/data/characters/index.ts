import type { Character } from "../../types";
import { kai } from "./kai";
import { rin } from "./rin";
import { toa } from "./toa";
import { mei } from "./mei";
import { ayaka } from "./ayaka";
import { sora } from "./sora";
import { hana } from "./hana";
import { garrett } from "./garrett";
import { seraphine } from "./seraphine";
import { nyx } from "./nyx";
import { emilia } from "./emilia";

export const CHARACTERS: Character[] = [
  kai,
  rin,
  toa,
  mei,
  ayaka,
  sora,
  hana,
  garrett,
  seraphine,
  nyx,
  emilia,
];

export const CHARACTERS_BY_ID: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

export function getCharacter(id: string): Character {
  const c = CHARACTERS_BY_ID[id];
  if (!c) throw new Error(`Unknown character: ${id}`);
  return c;
}

/** Non-throwing lookup for UI that may hold a stale/removed character_key. */
export function tryGetCharacter(id: string): Character | undefined {
  return CHARACTERS_BY_ID[id];
}

export function charactersOfRarity(rarity: number): Character[] {
  return CHARACTERS.filter((c) => c.rarity === rarity);
}
