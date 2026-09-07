import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  console.warn(
    "Supabase env vars missing. Copy .env.example to .env and fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.",
  );
}

// Falls back to placeholder strings so the app still renders (with a config
// notice) when env vars are absent, e.g. a fresh clone before setup.
export const supabase = createClient<Database>(
  url || "http://localhost:54321",
  anonKey || "public-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
