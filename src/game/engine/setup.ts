import type { Wave } from "../types";
import { getCharacter } from "../data/characters";
import { getEnemy } from "../data/enemies";
import { computeStats } from "../progression";
import { makeRng } from "./rng";
import type { BattleConfig, BattleState, Unit } from "./types";

function playerUnit(characterId: string, level: number, star: number, index: number): Unit {
  const c = getCharacter(characterId);
  const stats = computeStats(c, level, star);
  return {
    uid: `p${index}`,
    side: "player",
    slot: index < 3 ? index : -1,
    sourceId: c.id,
    name: c.name,
    element: c.element,
    isBoss: false,
    level,
    star,
    stats,
    hp: stats.hp,
    mp: Math.round(c.maxMp * 0.5),
    maxMp: c.maxMp,
    mpRegen: c.mpRegen,
    skills: c.skills,
    mods: [],
    defending: false,
    alive: true,
  };
}

export function spawnWave(waves: Wave[], waveIndex: number): Unit[] {
  const wave = waves[waveIndex] ?? [];
  return wave.map((w, i) => {
    const e = getEnemy(w.enemyId);
    const stats = computeStats(e, w.level, 1);
    return {
      uid: `e${waveIndex}_${i}`,
      side: "enemy",
      slot: i,
      sourceId: e.id,
      name: e.name,
      element: e.element,
      isBoss: Boolean(e.boss),
      level: w.level,
      star: 1,
      stats,
      hp: stats.hp,
      mp: e.maxMp,
      maxMp: e.maxMp,
      mpRegen: e.mpRegen,
      skills: e.skills,
      mods: [],
      defending: false,
      alive: true,
    } satisfies Unit;
  });
}

/** Build the initial battle state. Call `advance` next to reach the first input. */
export function initBattle(config: BattleConfig): BattleState {
  if (config.party.length === 0) throw new Error("Party is empty");
  if (config.waves.length === 0) throw new Error("No waves");

  const players = config.party
    .slice(0, 5)
    .map((m, i) => playerUnit(m.characterId, m.level, m.star, i));

  return {
    rng: makeRng(config.seed),
    round: 0,
    phase: "awaiting-action",
    activeUid: null,
    swapSlot: null,
    queue: [],
    players,
    enemies: spawnWave(config.waves, 0),
    waves: config.waves,
    waveIndex: 0,
    playerDeaths: 0,
    log: [{ t: "wave-start", waveIndex: 0 }],
  };
}
