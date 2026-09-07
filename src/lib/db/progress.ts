import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type StageProgress = Database["public"]["Tables"]["stage_progress"]["Row"];

export async function list(userId: string): Promise<StageProgress[]> {
  const { data, error } = await supabase
    .from("stage_progress")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export interface StageResult {
  cleared: boolean;
  stars: number;
  rounds: number;
}

/**
 * Upsert a stage result, keeping the best stars and fewest rounds seen so far.
 */
export async function recordResult(
  userId: string,
  stageId: string,
  result: StageResult,
): Promise<StageProgress> {
  const { data: existing, error: readErr } = await supabase
    .from("stage_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("stage_id", stageId)
    .maybeSingle();
  if (readErr) throw readErr;

  const merged = {
    user_id: userId,
    stage_id: stageId,
    cleared: (existing?.cleared ?? false) || result.cleared,
    stars: Math.max(existing?.stars ?? 0, result.cleared ? result.stars : 0),
    best_rounds:
      result.cleared && (existing?.best_rounds == null || result.rounds < existing.best_rounds)
        ? result.rounds
        : (existing?.best_rounds ?? null),
  };

  const { data, error } = await supabase
    .from("stage_progress")
    .upsert(merged, { onConflict: "user_id,stage_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
