import { supabase } from "./supabase";
import type { PullOutcome } from "../game/gacha";
import type { Rarity, RewardBundle } from "../game/types";

// Every economy mutation is a SECURITY DEFINER RPC (see
// supabase/migrations/0002_server_authoritative.sql). The client can't write the
// economy tables directly any more, so these are the only paths that change a
// save. Server derives the user from auth.uid(); no userId is passed.

interface PullRow {
  character_key: string;
  rarity: Rarity;
  is_new: boolean;
  is_featured: boolean;
  dupe_shards: number;
}

export async function pullBanner(bannerId: string, count: number): Promise<PullOutcome[]> {
  const { data, error } = await supabase.rpc("pull_banner", {
    p_banner_id: bannerId,
    p_count: count,
  });
  if (error) throw error;
  return (data as unknown as PullRow[]).map((r) => ({
    characterId: r.character_key,
    rarity: r.rarity,
    isNew: r.is_new,
    isFeatured: r.is_featured,
    dupeShards: r.dupe_shards,
  }));
}

export interface StageRewardResult {
  rewards: RewardBundle;
  firstClear: boolean;
  stars: number;
  unlockedStageId: string | null;
}

interface StageRewardRow {
  rewards: RewardBundle;
  first_clear: boolean;
  stars: number;
  unlocked_stage_id: string | null;
}

export async function claimStageRewards(
  stageId: string,
  result: { cleared: boolean; rounds: number; noDeaths: boolean },
): Promise<StageRewardResult> {
  const { data, error } = await supabase.rpc("claim_stage_rewards", {
    p_stage_id: stageId,
    p_cleared: result.cleared,
    p_rounds: result.rounds,
    p_no_deaths: result.noDeaths,
  });
  if (error) throw error;
  const row = data as unknown as StageRewardRow;
  return {
    rewards: row.rewards,
    firstClear: row.first_clear,
    stars: row.stars,
    unlockedStageId: row.unlocked_stage_id,
  };
}

export async function levelUpCharacter(ownedId: string, targetLevel: number): Promise<void> {
  const { error } = await supabase.rpc("level_up_character", {
    p_owned_id: ownedId,
    p_target_level: targetLevel,
  });
  if (error) throw error;
}

export async function starUpCharacter(ownedId: string): Promise<void> {
  const { error } = await supabase.rpc("star_up_character", { p_owned_id: ownedId });
  if (error) throw error;
}

export async function submitEndlessRun(wave: number): Promise<number> {
  const { data, error } = await supabase.rpc("submit_endless", { p_wave: wave });
  if (error) throw error;
  return data as number;
}
