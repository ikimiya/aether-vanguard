import type { Banner } from "../../../types";
import { STANDARD_BANNER } from "./standard";
import { RATE_UP_SERAPHINE } from "./rate-up-seraphine";
import { RATE_UP_EMILIA } from "./rate-up-emilia";

// One file per banner. To add one: `npm run scaffold -- banner ...`, or create
// ./<id>.ts and add the import + array line here. Rate-up / duration live on the
// banner object — never on a character.
export const BANNERS: Banner[] = [
  RATE_UP_EMILIA,
  RATE_UP_SERAPHINE,
  STANDARD_BANNER,
];

export { STANDARD_BANNER, RATE_UP_SERAPHINE };

export const BANNERS_BY_ID: Record<string, Banner> = Object.fromEntries(
  BANNERS.map((b) => [b.id, b]),
);

export function getBanner(id: string): Banner {
  const b = BANNERS_BY_ID[id];
  if (!b) throw new Error(`Unknown banner: ${id}`);
  return b;
}
