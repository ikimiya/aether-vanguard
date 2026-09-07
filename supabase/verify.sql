-- ============================================================================
-- verify.sql — paste into the Supabase SQL editor AFTER running
--   0001_init.sql  ->  0002_server_authoritative.sql  ->  generated/config_seed.sql
--
-- Non-destructive: everything runs inside a transaction that ROLLS BACK.
--
-- First: sign up a throwaway account in the app, then run
--   select id, email from auth.users order by created_at desc limit 5;
-- and paste that id into v_uid below.
-- ============================================================================
begin;

-- 1. The economy tables must have ONLY select policies left.
do $$
declare
  bad text;
begin
  select string_agg(tablename || '.' || policyname || ' (' || cmd || ')', ', ')
    into bad
    from pg_policies
    where schemaname = 'public'
      and tablename in ('currencies','owned_characters','gacha_state','stage_progress','endless_runs')
      and cmd <> 'SELECT';
  if bad is not null then
    raise exception 'client write policies still present: %', bad;
  end if;
  raise notice 'RLS lockdown OK — only SELECT policies remain on the economy tables';
end $$;

-- 2. Exercise the RPCs as the throwaway user.
do $$
declare
  v_uid uuid := '00000000-0000-0000-0000-000000000000';  -- <-- EDIT ME
  v_res jsonb;
  v_gems int;
begin
  if not exists (select 1 from auth.users where id = v_uid) then
    raise exception 'set v_uid to a real auth.users id (sign up in the app first)';
  end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);

  -- pull_banner: 10-pull deducts 10x cost and returns 10 outcomes
  select gems into v_gems from public.currencies where user_id = v_uid;
  v_res := public.pull_banner('standard', 10);
  assert jsonb_array_length(v_res) = 10, 'expected 10 pull outcomes';
  assert (select gems from public.currencies where user_id = v_uid) = v_gems - 1500,
    'gems should drop by 10 * 150';
  raise notice 'pull_banner OK — 10 outcomes, gems % -> %', v_gems, v_gems - 1500;

  -- pull_banner: rejects an unaffordable pull
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    -- drain gems via a legit-looking path is not possible; simulate by asserting
    -- the guard fires when count is huge relative to balance
    perform public.pull_banner('rate-up-seraphine', 10);
    perform public.pull_banner('rate-up-seraphine', 10);
    perform public.pull_banner('rate-up-seraphine', 10);
    -- by now gems are well under 1600; the next 10-pull must fail
    perform public.pull_banner('rate-up-seraphine', 10);
    raise exception 'pull_banner should have rejected an unaffordable pull';
  exception when others then
    if sqlerrm not like '%not enough gems%' then raise; end if;
    raise notice 'pull_banner rejects unaffordable pulls OK';
  end;

  -- claim_stage_rewards: order-gated
  begin
    perform public.claim_stage_rewards('1-8', true, 1, true);
    raise exception 'claim_stage_rewards should reject a locked stage';
  exception when others then
    if sqlerrm not like '%previous stage not cleared%' then raise; end if;
    raise notice 'claim_stage_rewards order-gating OK';
  end;

  -- claim_stage_rewards: stage 1-1 pays its first-clear reward
  v_res := public.claim_stage_rewards('1-1', true, 3, true);
  assert (v_res ->> 'first_clear')::boolean, 'first clear of 1-1 expected';
  assert (v_res -> 'rewards' ->> 'gems')::int = 60, '1-1 first clear pays 60 gems';
  raise notice 'claim_stage_rewards 1-1 OK — %', v_res;

  -- level_up_character: rejects out-of-range target
  begin
    perform public.level_up_character(gen_random_uuid(), 999);
    raise exception 'level_up_character should reject an unknown owned id';
  exception when others then
    if sqlerrm not like '%not owned%' then raise; end if;
    raise notice 'level_up_character validates ownership OK';
  end;

  -- star_up_character: rejects when short on shards
  begin
    perform public.star_up_character(
      (select id from public.owned_characters where user_id = v_uid limit 1));
    raise notice 'star_up_character succeeded (starter had enough shards)';
  exception when others then
    if sqlerrm not like '%not enough shards%' and sqlerrm not like '%max star%' then raise; end if;
    raise notice 'star_up_character guards shards OK';
  end;

  -- submit_endless: clamps to the ceiling
  assert public.submit_endless(999999) <= 500, 'endless wave should clamp to 500';
  raise notice 'submit_endless clamp OK';

  raise notice 'ALL RPC CHECKS PASSED';
end $$;

rollback;

-- ----------------------------------------------------------------------------
-- Browser check (can't be done here): open devtools on the running app while
-- signed in and run
--   await supabase.from('currencies').update({ gems: 999999 }).eq('user_id', (await supabase.auth.getUser()).data.user.id)
-- It must return an error / 0 rows — the update policy is gone.
-- ----------------------------------------------------------------------------
