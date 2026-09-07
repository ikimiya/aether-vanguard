import type { Banner } from "../../../types";

export const STANDARD_BANNER: Banner = {
  id: "standard",
  name: "Vanguard Roll",
  costPerPull: 150,
  featured: {},
  art: "assets/banners/standard.png",
  standard: true,
};

export const RATE_UP_SERAPHINE: Banner = {
  id: "rate-up-seraphine",
  name: "Dawnspeaker — Seraphine",
  costPerPull: 160,
  featured: {
    5: ["seraphine"],
    4: ["ayaka", "hana", "sora"],
  },
  art: "assets/banners/rate-up-seraphine.png",
};

export const BANNERS: Banner[] = [RATE_UP_SERAPHINE, STANDARD_BANNER];

export const BANNERS_BY_ID: Record<string, Banner> = Object.fromEntries(
  BANNERS.map((b) => [b.id, b]),
);

export function getBanner(id: string): Banner {
  const b = BANNERS_BY_ID[id];
  if (!b) throw new Error(`Unknown banner: ${id}`);
  return b;
}
