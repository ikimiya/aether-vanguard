-- Aether Vanguard schema. Run in the Supabase SQL editor, or `supabase db push`.
-- Every table is owned by a single auth user and locked with RLS to auth.uid().
-- Players may select/insert/update their own rows; deletes are not exposed.

-- Starter grants handed out on signup.
create schema if not exists app;
create or replace function app.starter_gems() returns int language sql immutable as $$ select 1600 $$;
create or replace function app.starter_gold() returns int language sql immutable as $$ select 500 $$;
create or replace function app.starter_character() returns text language sql immutable as $$ select 'kai' $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- currencies (one row per user)
-- ---------------------------------------------------------------------------
create table public.currencies (
  user_id uuid primary key references auth.users (id) on delete cascade,
  gems int not null default 0 check (gems >= 0),
  gold int not null default 0 check (gold >= 0),
  xp_items int not null default 0 check (xp_items >= 0)
);
alter table public.currencies enable row level security;

create policy "currencies: read own" on public.currencies
  for select using (auth.uid() = user_id);
create policy "currencies: update own" on public.currencies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- owned_characters
-- ---------------------------------------------------------------------------
create table public.owned_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  character_key text not null,
  level int not null default 1 check (level >= 1),
  exp int not null default 0 check (exp >= 0),
  star int not null default 1 check (star between 1 and 6),
  dupe_shards int not null default 0 check (dupe_shards >= 0),
  acquired_at timestamptz not null default now(),
  unique (user_id, character_key)
);
alter table public.owned_characters enable row level security;
create index owned_characters_user_idx on public.owned_characters (user_id);

create policy "owned_characters: read own" on public.owned_characters
  for select using (auth.uid() = user_id);
create policy "owned_characters: insert own" on public.owned_characters
  for insert with check (auth.uid() = user_id);
create policy "owned_characters: update own" on public.owned_characters
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- stage_progress
-- ---------------------------------------------------------------------------
create table public.stage_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  stage_id text not null,
  cleared boolean not null default false,
  stars int not null default 0 check (stars between 0 and 3),
  best_rounds int check (best_rounds is null or best_rounds > 0),
  primary key (user_id, stage_id)
);
alter table public.stage_progress enable row level security;

create policy "stage_progress: read own" on public.stage_progress
  for select using (auth.uid() = user_id);
create policy "stage_progress: insert own" on public.stage_progress
  for insert with check (auth.uid() = user_id);
create policy "stage_progress: update own" on public.stage_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- endless_runs (one row per user, best score only)
-- ---------------------------------------------------------------------------
create table public.endless_runs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  best_wave int not null default 0 check (best_wave >= 0),
  updated_at timestamptz not null default now()
);
alter table public.endless_runs enable row level security;

create policy "endless_runs: read own" on public.endless_runs
  for select using (auth.uid() = user_id);
create policy "endless_runs: insert own" on public.endless_runs
  for insert with check (auth.uid() = user_id);
create policy "endless_runs: update own" on public.endless_runs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- gacha_state (pity counters, one row per user)
-- ---------------------------------------------------------------------------
create table public.gacha_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pulls_since_5star int not null default 0 check (pulls_since_5star >= 0),
  pulls_since_4star int not null default 0 check (pulls_since_4star >= 0),
  guaranteed_featured boolean not null default false,
  total_pulls int not null default 0 check (total_pulls >= 0)
);
alter table public.gacha_state enable row level security;

create policy "gacha_state: read own" on public.gacha_state
  for select using (auth.uid() = user_id);
create policy "gacha_state: update own" on public.gacha_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- New-user bootstrap: profile, currencies, gacha_state, starter character.
-- SECURITY DEFINER so it can insert while the row's RLS policies would block a
-- plain client. Fired after Supabase creates the auth.users row.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
    values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'Commander'));

  insert into public.currencies (user_id, gems, gold)
    values (new.id, app.starter_gems(), app.starter_gold());

  insert into public.gacha_state (user_id) values (new.id);

  insert into public.endless_runs (user_id) values (new.id);

  insert into public.owned_characters (user_id, character_key)
    values (new.id, app.starter_character());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
