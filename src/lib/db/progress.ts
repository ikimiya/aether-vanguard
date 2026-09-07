import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type StageProgress = Database["public"]["Tables"]["stage_progress"]["Row"];

// Reads only. Stage results are recorded server-side by the claim_stage_rewards RPC.
export async function list(userId: string): Promise<StageProgress[]> {
  const { data, error } = await supabase
    .from("stage_progress")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}
