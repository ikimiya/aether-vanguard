import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type GachaState = Database["public"]["Tables"]["gacha_state"]["Row"];

// Reads only. Pity state is advanced server-side by the pull_banner RPC.
export async function get(userId: string): Promise<GachaState> {
  const { data, error } = await supabase
    .from("gacha_state")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}
