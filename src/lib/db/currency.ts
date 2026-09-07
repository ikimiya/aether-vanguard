import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type Currencies = Database["public"]["Tables"]["currencies"]["Row"];

// Reads only. Currency changes go through the RPCs in ../operations.ts.
export async function get(userId: string): Promise<Currencies> {
  const { data, error } = await supabase
    .from("currencies")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}
