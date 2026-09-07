-- ============================================================================
-- 0002_server_authoritative.sql
--
-- Moves every economy write behind SECURITY DEFINER functions and revokes the
-- client's direct INSERT/UPDATE on the five economy tables. After this, a signed-
-- in user can only change their save by calling pull_banner / claim_stage_rewards
-- / level_up_character / star_up_character / submit_endless.
--
-- Run order:  0001_init.sql  ->  this file  ->  supabase/generated/config_seed.sql
--
-- The functions are owned by `postgres` (whoever runs this in the SQL editor),
-- which has BYPASSRLS in Supabase, so they can write rows the dropped policies
-- would now block. They still scope every write to auth.uid().
--
-- Battle outcomes (cleared / rounds / no-deaths) cannot be verified server-side
-- without a replay engine, so claim_stage_rewards trusts those args but pays only
-- the config-defined reward, gates first-clear on the previous stage, and
-- submit_endless clamps the wave to app.game_constants.endless_max_wave.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Config tables. Schema `app` is never added to PostgREST's exposed schemas, so
-- these are invisible to the client API; the definer functions read them.
-- Rows are populated by supabase/generated/config_seed.sql (from the TS data).
-- ---------------------------------------------------------------------------
revoke all on schema app from anon, authenticated;

create table if not exists app.characters (
  character_key text primary key,
  rarity int not null check (rarity in (3, 4, 5))
);

create table if not exists app.rarity_config (
  rarity int primary key check (rarity in (3, 4, 5)),
  base_rate numeric not null,
  level_cap int not null,
  dupe_shards int not null
);

create table if not exists app.banners (
  banner_id text primary key,
  cost_per_pull int not null check (cost_per_pull > 0),
  featured jsonb not null default '{}'::jsonb
);

create table if not exists app.stages (
  stage_id text primary key,
  ordinal int not null unique,
  clear_within_rounds int not null,
  first_clear jsonb not null,
  repeat jsonb not null
);

create table if not exists app.star_up_cost (
  target_star int primary key check (target_star between 2 and 6),
  shards int not null check (shards >= 0)
);

create table if not exists app.game_constants (
  key text primary key,
  value numeric not null
);

create or replace function app.const(p_key text)
returns numeric language sql stable
set search_path = app
as $$ select value from app.game_constants where key = p_key $$;

-- ---------------------------------------------------------------------------
-- pull_banner — rolls `p_count` (1 or 10) pulls, mirrors src/game/gacha.ts.
-- ---------------------------------------------------------------------------
create or replace function public.pull_banner(p_banner_id text, p_count int)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_uid uuid := auth.uid();
  v_cost int;
  v_featured jsonb;
  v_gems int;
  v_since5 int;
  v_since4 int;
  v_guar boolean;
  v_hard int := app.const('hard5star');
  v_soft int := app.const('soft5star_start');
  v_g4 int := app.const('guaranteed4star');
  v_f5c numeric := app.const('featured5_chance');
  v_f4c numeric := app.const('featured4_chance');
  v_r4 numeric;
  v_r5 numeric;
  v_out jsonb := '[]'::jsonb;
  i int;
  v_rate5 numeric;
  v_roll numeric;
  v_rarity int;
  v_feat jsonb;
  v_flen int;
  v_key text;
  v_is_featured boolean;
  v_is_new boolean;
  v_shards int;
  v_pool text[];
  v_owned_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_count is null or p_count not in (1, 10) then
    raise exception 'pull count must be 1 or 10';
  end if;

  select cost_per_pull, featured into v_cost, v_featured
    from app.banners where banner_id = p_banner_id;
  if not found then raise exception 'unknown banner %', p_banner_id; end if;

  select gems into v_gems from public.currencies where user_id = v_uid for update;
  select pulls_since_5star, pulls_since_4star, guaranteed_featured
    into v_since5, v_since4, v_guar
    from public.gacha_state where user_id = v_uid for update;

  if v_gems < v_cost * p_count then raise exception 'not enough gems'; end if;

  select base_rate into v_r4 from app.rarity_config where rarity = 4;
  select base_rate into v_r5 from app.rarity_config where rarity = 5;

  for i in 1..p_count loop
    v_since5 := v_since5 + 1;
    v_since4 := v_since4 + 1;

    if v_since5 >= v_hard then
      v_rarity := 5;
    else
      v_rate5 := v_r5;
      if v_since5 >= v_soft then
        v_rate5 := v_r5 + ((v_since5 - v_soft + 1)::numeric / (v_hard - v_soft)) * (1 - v_r5);
      end if;
      v_roll := random();
      if v_roll < v_rate5 then
        v_rarity := 5;
      elsif v_since4 >= v_g4 - 1 then
        v_rarity := 4;
      elsif v_roll < v_rate5 + v_r4 then
        v_rarity := 4;
      else
        v_rarity := 3;
      end if;
    end if;

    if v_rarity = 5 then v_since5 := 0; end if;
    if v_rarity >= 4 then v_since4 := 0; end if;

    v_feat := coalesce(v_featured -> v_rarity::text, '[]'::jsonb);
    v_flen := jsonb_array_length(v_feat);
    v_is_featured := false;

    if v_rarity = 5 and v_flen > 0 then
      if v_guar or random() < v_f5c then
        v_key := v_feat ->> floor(random() * v_flen)::int;
        v_is_featured := true;
        v_guar := false;
      else
        v_guar := true;
        select array_agg(character_key) into v_pool
          from app.characters
          where rarity = 5 and not (v_feat ? character_key);
        if v_pool is null then
          v_key := v_feat ->> 0;
        else
          v_key := v_pool[1 + floor(random() * array_length(v_pool, 1))::int];
        end if;
      end if;
    elsif v_rarity = 4 and v_flen > 0 and random() < v_f4c then
      v_key := v_feat ->> floor(random() * v_flen)::int;
      v_is_featured := true;
    else
      select array_agg(character_key) into v_pool from app.characters where rarity = v_rarity;
      v_key := v_pool[1 + floor(random() * array_length(v_pool, 1))::int];
    end if;

    select id into v_owned_id from public.owned_characters
      where user_id = v_uid and character_key = v_key;
    if found then
      select dupe_shards into v_shards from app.rarity_config where rarity = v_rarity;
      update public.owned_characters set dupe_shards = dupe_shards + v_shards
        where id = v_owned_id;
      v_is_new := false;
    else
      insert into public.owned_characters (user_id, character_key) values (v_uid, v_key);
      v_is_new := true;
      v_shards := 0;
    end if;

    v_out := v_out || jsonb_build_object(
      'character_key', v_key,
      'rarity', v_rarity,
      'is_new', v_is_new,
      'is_featured', v_is_featured,
      'dupe_shards', v_shards
    );
  end loop;

  update public.currencies set gems = gems - v_cost * p_count where user_id = v_uid;
  update public.gacha_state set
    pulls_since_5star = v_since5,
    pulls_since_4star = v_since4,
    guaranteed_featured = v_guar,
    total_pulls = total_pulls + p_count
    where user_id = v_uid;

  return v_out;
end;
$$;

-- ---------------------------------------------------------------------------
-- claim_stage_rewards
-- ---------------------------------------------------------------------------
create or replace function public.claim_stage_rewards(
  p_stage_id text, p_cleared boolean, p_rounds int, p_no_deaths boolean
) returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_uid uuid := auth.uid();
  v_ordinal int;
  v_within int;
  v_first_clear jsonb;
  v_repeat jsonb;
  v_prev_cleared boolean;
  v_prior_cleared boolean;
  v_is_first boolean;
  v_stars int := 0;
  v_reward jsonb := '{}'::jsonb;
  v_rounds int := greatest(coalesce(p_rounds, 1), 1);
  v_next text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select ordinal, clear_within_rounds, first_clear, repeat
    into v_ordinal, v_within, v_first_clear, v_repeat
    from app.stages where stage_id = p_stage_id;
  if not found then raise exception 'unknown stage %', p_stage_id; end if;

  if v_ordinal > 1 then
    select coalesce(bool_or(sp.cleared), false) into v_prev_cleared
      from app.stages s
      left join public.stage_progress sp
        on sp.user_id = v_uid and sp.stage_id = s.stage_id
      where s.ordinal = v_ordinal - 1;
    if not v_prev_cleared then raise exception 'previous stage not cleared'; end if;
  end if;

  select cleared into v_prior_cleared from public.stage_progress
    where user_id = v_uid and stage_id = p_stage_id;
  v_is_first := coalesce(p_cleared, false) and coalesce(v_prior_cleared, false) = false;

  if coalesce(p_cleared, false) then
    v_stars := 1;
    if v_rounds <= v_within then v_stars := v_stars + 1; end if;
    if coalesce(p_no_deaths, false) then v_stars := v_stars + 1; end if;
    v_reward := case when v_is_first then v_first_clear else v_repeat end;
  end if;

  if v_reward <> '{}'::jsonb then
    update public.currencies set
      gems = gems + coalesce((v_reward ->> 'gems')::int, 0),
      gold = gold + coalesce((v_reward ->> 'gold')::int, 0),
      xp_items = xp_items + coalesce((v_reward ->> 'xp_items')::int, 0)
      where user_id = v_uid;
  end if;

  insert into public.stage_progress (user_id, stage_id, cleared, stars, best_rounds)
    values (
      v_uid, p_stage_id, coalesce(p_cleared, false),
      case when coalesce(p_cleared, false) then v_stars else 0 end,
      case when coalesce(p_cleared, false) then v_rounds else null end
    )
  on conflict (user_id, stage_id) do update set
    cleared = stage_progress.cleared or excluded.cleared,
    stars = greatest(stage_progress.stars, excluded.stars),
    best_rounds = case
      when excluded.best_rounds is null then stage_progress.best_rounds
      when stage_progress.best_rounds is null then excluded.best_rounds
      else least(stage_progress.best_rounds, excluded.best_rounds)
    end;

  select stage_id into v_next from app.stages where ordinal = v_ordinal + 1;

  return jsonb_build_object(
    'rewards', v_reward,
    'first_clear', v_is_first,
    'stars', v_stars,
    'unlocked_stage_id', case when v_is_first then v_next else null end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- level_up_character
-- ---------------------------------------------------------------------------
create or replace function public.level_up_character(p_owned_id uuid, p_target_level int)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_uid uuid := auth.uid();
  v_level int;
  v_cap int;
  v_gold_cost bigint;
  v_xp_cost bigint;
  v_gb numeric := app.const('level_cost_gold_base');
  v_gp numeric := app.const('level_cost_gold_per');
  v_xd numeric := app.const('level_cost_xp_divisor');
  v_gold int;
  v_xp int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select oc.level, rc.level_cap into v_level, v_cap
    from public.owned_characters oc
    join app.characters ac on ac.character_key = oc.character_key
    join app.rarity_config rc on rc.rarity = ac.rarity
    where oc.id = p_owned_id and oc.user_id = v_uid
    for update of oc;
  if not found then raise exception 'character not owned'; end if;

  if p_target_level is null or p_target_level <= v_level or p_target_level > v_cap then
    raise exception 'target level must be between % and %', v_level + 1, v_cap;
  end if;

  select
    coalesce(sum(v_gb + v_gp * l), 0),
    coalesce(sum(1 + floor(l / v_xd)), 0)
    into v_gold_cost, v_xp_cost
    from generate_series(v_level, p_target_level - 1) as l;

  select gold, xp_items into v_gold, v_xp from public.currencies
    where user_id = v_uid for update;
  if v_gold < v_gold_cost or v_xp < v_xp_cost then
    raise exception 'not enough resources';
  end if;

  update public.currencies
    set gold = gold - v_gold_cost, xp_items = xp_items - v_xp_cost
    where user_id = v_uid;
  update public.owned_characters set level = p_target_level where id = p_owned_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- star_up_character
-- ---------------------------------------------------------------------------
create or replace function public.star_up_character(p_owned_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_uid uuid := auth.uid();
  v_star int;
  v_shards int;
  v_cost int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select star, dupe_shards into v_star, v_shards
    from public.owned_characters
    where id = p_owned_id and user_id = v_uid for update;
  if not found then raise exception 'character not owned'; end if;
  if v_star >= 5 then raise exception 'already at max star'; end if;

  select shards into v_cost from app.star_up_cost where target_star = v_star + 1;
  if v_cost is null then raise exception 'no star-up cost configured'; end if;
  if v_shards < v_cost then raise exception 'not enough shards'; end if;

  update public.owned_characters
    set star = v_star + 1, dupe_shards = dupe_shards - v_cost
    where id = p_owned_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_endless
-- ---------------------------------------------------------------------------
create or replace function public.submit_endless(p_wave int)
returns int
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_uid uuid := auth.uid();
  v_max int := app.const('endless_max_wave');
  v_wave int := greatest(0, least(coalesce(p_wave, 0), v_max));
  v_best int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  insert into public.endless_runs (user_id, best_wave, updated_at)
    values (v_uid, v_wave, now())
  on conflict (user_id) do update set
    best_wave = greatest(endless_runs.best_wave, excluded.best_wave),
    updated_at = now();

  select best_wave into v_best from public.endless_runs where user_id = v_uid;
  return v_best;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lock down client writes: drop INSERT/UPDATE policies on the economy tables.
-- SELECT policies stay; profiles keeps its update policy (username only).
-- ---------------------------------------------------------------------------
drop policy if exists "currencies: update own" on public.currencies;
drop policy if exists "owned_characters: insert own" on public.owned_characters;
drop policy if exists "owned_characters: update own" on public.owned_characters;
drop policy if exists "gacha_state: update own" on public.gacha_state;
drop policy if exists "stage_progress: insert own" on public.stage_progress;
drop policy if exists "stage_progress: update own" on public.stage_progress;
drop policy if exists "endless_runs: insert own" on public.endless_runs;
drop policy if exists "endless_runs: update own" on public.endless_runs;

-- ---------------------------------------------------------------------------
-- Only signed-in users may call the RPCs.
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.pull_banner(text, int)',
    'public.claim_stage_rewards(text, boolean, int, boolean)',
    'public.level_up_character(uuid, int)',
    'public.star_up_character(uuid)',
    'public.submit_endless(int)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;
