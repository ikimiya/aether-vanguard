import { currencyRepo, endlessRepo, gachaRepo, progressRepo, rosterRepo } from "./db";
import type { StageResult } from "./db/progress";
import { getBanner } from "../game/data/gacha/banners";
import { getStage, nextStageId } from "../game/data/stages";
import { getCharacter } from "../game/data/characters";
import { rollPulls, type PullOutcome } from "../game/gacha";
import { levelCap, starUpCost, totalLevelUpCost } from "../game/progression";
import type { RewardBundle } from "../game/types";

// --------------------------------------------------------------------------
// gacha
// --------------------------------------------------------------------------

export async function pullBanner(
  userId: string,
  bannerId: string,
  count: number,
): Promise<PullOutcome[]> {
  const banner = getBanner(bannerId);
  const [currencies, gacha, roster] = await Promise.all([
    currencyRepo.get(userId),
    gachaRepo.get(userId),
    rosterRepo.list(userId),
  ]);

  const cost = banner.costPerPull * count;
  if (currencies.gems < cost) throw new Error("Not enough gems");

  const { outcomes, nextState } = rollPulls(
    banner,
    count,
    gacha,
    roster.map((r) => r.character_key),
    Date.now() ^ (gacha.total_pulls << 8),
  );

  await currencyRepo.apply(userId, { gems: -cost });
  for (const o of outcomes) {
    if (o.isNew) await rosterRepo.add(userId, o.characterId);
    else await rosterRepo.addDupeShards(userId, o.characterId, o.dupeShards);
  }
  await gachaRepo.save(userId, {
    ...nextState,
    total_pulls: gacha.total_pulls + count,
  });

  return outcomes;
}

// --------------------------------------------------------------------------
// stage rewards
// --------------------------------------------------------------------------

export interface StageRewardResult {
  rewards: RewardBundle;
  firstClear: boolean;
  stars: number;
  unlockedStageId: string | null;
}

function starsFor(stageId: string, result: StageResult & { noDeaths: boolean }): number {
  if (!result.cleared) return 0;
  const stage = getStage(stageId);
  let stars = 1;
  if (result.rounds <= stage.clearWithinRounds) stars++;
  if (result.noDeaths) stars++;
  return stars;
}

export async function claimStageRewards(
  userId: string,
  stageId: string,
  result: StageResult & { noDeaths: boolean },
): Promise<StageRewardResult> {
  const stage = getStage(stageId);
  const prior = (await progressRepo.list(userId)).find((p) => p.stage_id === stageId);
  const firstClear = result.cleared && !prior?.cleared;
  const stars = starsFor(stageId, result);

  const rewards = result.cleared
    ? firstClear
      ? stage.rewards.firstClear
      : stage.rewards.repeat
    : {};

  if (Object.keys(rewards).length > 0) {
    await currencyRepo.apply(userId, {
      gems: rewards.gems ?? 0,
      gold: rewards.gold ?? 0,
      xp_items: rewards.xp_items ?? 0,
    });
  }
  await progressRepo.recordResult(userId, stageId, {
    cleared: result.cleared,
    stars,
    rounds: result.rounds,
  });

  return {
    rewards,
    firstClear,
    stars,
    unlockedStageId: firstClear ? nextStageId(stageId) : null,
  };
}

// --------------------------------------------------------------------------
// progression
// --------------------------------------------------------------------------

export async function levelUpCharacter(
  userId: string,
  ownedId: string,
  characterKey: string,
  targetLevel: number,
): Promise<void> {
  const character = getCharacter(characterKey);
  const owned = (await rosterRepo.list(userId)).find((r) => r.id === ownedId);
  if (!owned) throw new Error("Character not owned");

  const cap = levelCap(character.rarity);
  if (targetLevel <= owned.level || targetLevel > cap) {
    throw new Error(`Level must be between ${owned.level + 1} and ${cap}`);
  }

  const cost = totalLevelUpCost(owned.level, targetLevel);
  await currencyRepo.apply(userId, { gold: -cost.gold, xp_items: -cost.xp_items });
  await rosterRepo.update(ownedId, { level: targetLevel });
}

export async function starUpCharacter(userId: string, ownedId: string): Promise<void> {
  const owned = (await rosterRepo.list(userId)).find((r) => r.id === ownedId);
  if (!owned) throw new Error("Character not owned");

  const cost = starUpCost(owned.star);
  if (cost === null) throw new Error("Already at max star");
  if (owned.dupe_shards < cost) throw new Error("Not enough shards");

  await rosterRepo.update(ownedId, {
    star: owned.star + 1,
    dupe_shards: owned.dupe_shards - cost,
  });
}

// --------------------------------------------------------------------------
// endless
// --------------------------------------------------------------------------

export async function submitEndlessRun(userId: string, wave: number): Promise<number> {
  const run = await endlessRepo.submit(userId, wave);
  return run.best_wave;
}
