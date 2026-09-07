-- Player's saved battle formation: an ordered list of up to 5 character_keys.
-- First 3 are the active slots (order = turn priority), last 2 are the bench.
-- Not an economy table — the existing "profiles: update own" RLS policy already
-- governs writes, so the client updates this column directly.
alter table public.profiles
  add column if not exists formation jsonb not null default '[]'::jsonb;
