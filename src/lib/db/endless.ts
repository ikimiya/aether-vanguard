import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type EndlessRun = Database["public"]["Tables"]["endless_runs"]["Row"];

// Reads only. New bests are submitted server-side by the submit_endless RPC.
export async function get(userId: string): Promise<EndlessRun> {
  const { data, error } = await supabase
    .from("endless_runs")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}
