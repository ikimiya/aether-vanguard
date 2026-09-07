import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type EndlessRun = Database["public"]["Tables"]["endless_runs"]["Row"];

export async function get(userId: string): Promise<EndlessRun> {
  const { data, error } = await supabase
    .from("endless_runs")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

/** Persist a run only if it beats the stored best. Returns the current best. */
export async function submit(userId: string, wave: number): Promise<EndlessRun> {
  const current = await get(userId);
  if (wave <= current.best_wave) return current;

  const { data, error } = await supabase
    .from("endless_runs")
    .update({ best_wave: wave, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
