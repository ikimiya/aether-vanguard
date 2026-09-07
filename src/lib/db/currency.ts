import { supabase } from "../supabase";
import type { Database } from "./database.types";

export type Currencies = Database["public"]["Tables"]["currencies"]["Row"];
export type CurrencyKind = "gems" | "gold" | "xp_items";
export type CurrencyDelta = Partial<Record<CurrencyKind, number>>;

export async function get(userId: string): Promise<Currencies> {
  const { data, error } = await supabase
    .from("currencies")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Read-modify-write. Single-player hobby game, so no atomic RPC — but we do
 * guard against overspend and surface it as an error the UI can show.
 */
export async function apply(userId: string, delta: CurrencyDelta): Promise<Currencies> {
  const current = await get(userId);
  const next: CurrencyDelta = {};
  for (const kind of ["gems", "gold", "xp_items"] as const) {
    const change = delta[kind] ?? 0;
    if (change === 0) continue;
    const value = current[kind] + change;
    if (value < 0) throw new Error(`Not enough ${kind.replace("_", " ")}`);
    next[kind] = value;
  }
  if (Object.keys(next).length === 0) return current;

  const { data, error } = await supabase
    .from("currencies")
    .update(next)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
