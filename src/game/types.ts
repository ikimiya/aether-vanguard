export type Rarity = 3 | 4 | 5;

export type RingElement = "fire" | "ice" | "wind" | "earth" | "lightning" | "water";
export type Element = RingElement | "light" | "dark";

export type StatKey = "hp" | "atk" | "matk" | "def" | "mdef" | "spd";
export type StatBlock = Record<StatKey, number>;

export type Role = "dps" | "support" | "tank";

export interface Character {
  id: string;
  name: string;
  rarity: Rarity;
  element: Element;
  role: Role;
  /** Stats at level 1, star 1. */
  baseStats: StatBlock;
  /** Added per level above 1. */
  growth: StatBlock;
  maxMp: number;
  /** MP restored at the end of the unit's turn. */
  mpRegen: number;
  /** Magic skill ids. Basic attack + defend are universal (engine-injected). */
  skills: string[];
  /** Shards to reach each star (target star 2..MAX_STAR). Any omitted key falls
   *  back to the global `STAR_UP_SHARDS` curve. */
  starUp?: Partial<Record<2 | 3 | 4 | 5, number>>;
  /** `splash`, if set, is the home-menu wallpaper while this unit leads the team. */
  art: { portrait: string; battle: string; splash?: string };
  lore?: string;
}

export type SkillTarget =
  | "one-enemy"
  | "all-enemies"
  | "one-ally"
  | "all-allies"
  | "self";

export interface StatMod {
  kind: "buff" | "debuff";
  stat: Exclude<StatKey, "hp">;
  /** Fraction of the base stat, e.g. -0.2 for -20%. */
  amount: number;
  turns: number;
}

export interface DotMod {
  kind: "dot" | "regen";
  /** Fraction of the target's max HP applied each turn. */
  amount: number;
  turns: number;
  element?: Element;
}

export type SkillEffect = StatMod | DotMod;

export interface Skill {
  id: string;
  name: string;
  type: "physical" | "magic";
  mpCost: number;
  /** Damage/heal multiplier against the source stat. */
  power: number;
  target: SkillTarget;
  /** Defaults to the caster's element. */
  element?: Element;
  /** When true, `power` scales off matk and restores HP instead of dealing damage. */
  heal?: boolean;
  effects?: SkillEffect[];
  description: string;
}

export interface Enemy {
  id: string;
  name: string;
  element: Element;
  baseStats: StatBlock;
  growth: StatBlock;
  maxMp: number;
  mpRegen: number;
  skills: string[];
  art: { battle: string };
  boss?: boolean;
}

export interface RewardBundle {
  gems?: number;
  gold?: number;
  xp_items?: number;
}

export interface WaveEnemy {
  enemyId: string;
  level: number;
}

export type Wave = WaveEnemy[];

export interface Stage {
  id: string;
  chapter: number;
  name: string;
  waves: Wave[];
  rewards: { firstClear: RewardBundle; repeat: RewardBundle };
  /** Star 2 is earned by clearing within this many rounds; star 3 by no deaths. */
  clearWithinRounds: number;
}

export interface EndlessConfig {
  enemyPool: string[];
  bossPool: string[];
  baseLevel: number;
  levelStep: number;
  startCount: number;
  maxCount: number;
  addEnemyEveryWaves: number;
  bossEveryWaves: number;
}

export interface RarityConfig {
  label: string;
  baseRate: number;
  levelCap: number;
  /** Shards granted when a duplicate of this rarity is pulled. */
  dupeShards: number;
  color: string;
}

export interface Banner {
  id: string;
  name: string;
  costPerPull: number;
  /** Character ids that get the rate-up, per rarity slot. */
  featured: Partial<Record<Rarity, string[]>>;
  /** Chance the featured unit is chosen (vs a random pool unit) when a pull hits
   *  that rarity. Per-rarity; omitted keys fall back to
   *  FEATURED_5STAR_CHANCE / FOUR_STAR_FEATURED_CHANCE. */
  featuredRate?: Partial<Record<Rarity, number>>;
  /** Character ids eligible as non-featured pulls. Omit for "all characters". */
  poolCharacters?: string[];
  /** ISO timestamps. Omitted `startsAt` = live now; omitted `endsAt` = no end.
   *  The window is enforced server-side by `pull_banner`. */
  startsAt?: string;
  endsAt?: string;
  art: string;
  standard?: boolean;
}
