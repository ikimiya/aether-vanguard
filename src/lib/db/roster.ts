import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type OwnedCharacter = Database["public"]["Tables"]["owned_characters"]["Row"];
export type OwnedCharacterUpdate = Database["public"]["Tables"]["owned_characters"]["Update"];

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

export async function add(userId: string, characterKey: string): Promise<OwnedCharacter> {
  const { data, error } = await supabase
    .from("owned_characters")
    .insert({ user_id: userId, character_key: characterKey })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addDupeShards(
  userId: string,
  characterKey: string,
  shards: number,
): Promise<OwnedCharacter> {
  const existing = await get(userId, characterKey);
  if (!existing) throw new Error(`Character not owned: ${characterKey}`);
  return update(existing.id, { dupe_shards: existing.dupe_shards + shards });
}

export async function update(
  ownedId: string,
  patch: OwnedCharacterUpdate,
): Promise<OwnedCharacter> {
  const { data, error } = await supabase
    .from("owned_characters")
    .update(patch)
    .eq("id", ownedId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
