import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function get(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setUsername(userId: string, username: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ username }).eq("id", userId);
  if (error) throw error;
}
