-- ============================================================================
-- 0004_banner_pipeline.sql
--
-- Moves the featured-vs-off split and the star-up curve out of global constants
-- and into per-banner / per-character config, and adds server-enforced banner
-- windows. All of it is seeded from the TS data by `npm run gen:sql`.
--
-- Run order:  0001_init.sql -> 0002_server_authoritative.sql -> this file
--             -> supabase/generated/config_seed.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- app.banners: per-banner featured rate, pool restriction, and active window
-- ---------------------------------------------------------------------------
alter table app.banners
  add column if not exists featured_rate   jsonb not null default '{}'::jsonb,
  add column if not exists pool_characters jsonb,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at   timestamptz;

-- ---------------------------------------------------------------------------
-- app.star_up_cost: per-character, with character_key '*' as the default curve
-- (config_seed.sql truncates + reseeds this table, so no data migration needed)
-- ---------------------------------------------------------------------------
drop table if exists app.star_up_cost;
create table app.star_up_cost (
  character_key text not null,
  target_star   int  not null check (target_star between 2 and 6),
  shards        int  not null check (shards >= 0),
  primary key (character_key, target_star)
);

-- ---------------------------------------------------------------------------
-- pull_banner — now reads the featured rate, pool, and window from the banner
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
  v_featured_rate jsonb;
  v_pool_chars jsonb;
  v_starts timestamptz;
  v_ends timestamptz;
  v_gems int;
  v_since5 int;
  v_since4 int;
  v_guar boolean;
  v_hard int := app.const('hard5star');
  v_soft int := app.const('soft5star_start');
  v_g4 int := app.const('guaranteed4star');
  v_f5c numeric;
  v_f4c numeric;
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

  select cost_per_pull, featured, featured_rate, pool_characters, starts_at, ends_at
    into v_cost, v_featured, v_featured_rate, v_pool_chars, v_starts, v_ends
    from app.banners where banner_id = p_banner_id;
  if not found then raise exception 'unknown banner %', p_banner_id; end if;
  if v_starts is not null and now() < v_starts then raise exception 'banner not active'; end if;
  if v_ends is not null and now() >= v_ends then raise exception 'banner not active'; end if;

  v_f5c := coalesce((v_featured_rate ->> '5')::numeric, app.const('featured5_chance'));
  v_f4c := coalesce((v_featured_rate ->> '4')::numeric, app.const('featured4_chance'));

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
          where rarity = 5 and not (v_feat ? character_key)
            and (v_pool_chars is null or v_pool_chars ? character_key);
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
      select array_agg(character_key) into v_pool
        from app.characters
        where rarity = v_rarity
          and (v_pool_chars is null or v_pool_chars ? character_key);
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
-- star_up_character — per-character cost, falling back to the '*' default row
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
  v_char_key text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select star, dupe_shards, character_key into v_star, v_shards, v_char_key
    from public.owned_characters
    where id = p_owned_id and user_id = v_uid for update;
  if not found then raise exception 'character not owned'; end if;
  if v_star >= 5 then raise exception 'already at max star'; end if;

  select shards into v_cost from app.star_up_cost
    where character_key = v_char_key and target_star = v_star + 1;
  if v_cost is null then
    select shards into v_cost from app.star_up_cost
      where character_key = '*' and target_star = v_star + 1;
  end if;
  if v_cost is null then raise exception 'no star-up cost configured'; end if;
  if v_shards < v_cost then raise exception 'not enough shards'; end if;

  update public.owned_characters
    set star = v_star + 1, dupe_shards = dupe_shards - v_cost
    where id = p_owned_id;
end;
$$;
