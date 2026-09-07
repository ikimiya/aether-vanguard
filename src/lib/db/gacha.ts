import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type GachaState = Database["public"]["Tables"]["gacha_state"]["Row"];
export type GachaStateUpdate = Database["public"]["Tables"]["gacha_state"]["Update"];

export async function get(userId: string): Promise<GachaState> {
  const { data, error } = await supabase
    .from("gacha_state")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function save(userId: string, patch: GachaStateUpdate): Promise<GachaState> {
  const { data, error } = await supabase
    .from("gacha_state")
    .update(patch)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
