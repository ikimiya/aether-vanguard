import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type OwnedCharacter = Database["public"]["Tables"]["owned_characters"]["Row"];

// Reads only. Roster changes (gacha grants, level/star up) go through the RPCs
// in ../operations.ts.
export async function list(userId: string): Promise<OwnedCharacter[]> {
  const { data, error } = await supabase
    .from("owned_characters")
    .select("*")
    .eq("user_id", userId)
    .order("acquired_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function get(userId: string, characterKey: string): Promise<OwnedCharacter | null> {
  const { data, error } = await supabase
    .from("owned_characters")
    .select("*")
    .eq("user_id", userId)
    .eq("character_key", characterKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}
