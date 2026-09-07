-- ============================================================================
-- dev_reset.sql — testing helpers for the Supabase SQL editor.
--
-- The economy tables are RLS-locked to SELECT for the client (see
-- 0002_server_authoritative.sql), so gems / roster / progress can only be
-- changed here (the SQL editor runs as `postgres`, which bypasses RLS) or in the
-- dashboard's Table Editor — never from the app or browser devtools.
--
-- Each block below is independent. Edit the `v_email` line in the block you want
-- and run just that block.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. TOP UP CURRENCIES — generous test wallet.
-- ----------------------------------------------------------------------------
do $$
declare
  v_email text := 'you@example.com';  -- <-- EDIT ME
  v_uid uuid := (select id from auth.users where email = v_email);
begin
  if v_uid is null then raise exception 'no auth user for %', v_email; end if;

  update public.currencies
    set gems = 999999, gold = 999999, xp_items = 9999
    -- starter values instead:  set gems = app.starter_gems(), gold = app.starter_gold(), xp_items = 0
    where user_id = v_uid;

  raise notice 'currencies topped up for %', v_email;
end $$;


-- ----------------------------------------------------------------------------
-- 2. IN-PLACE RESET — keep the login, wipe all progress back to a fresh signup.
-- ----------------------------------------------------------------------------
do $$
declare
  v_email text := 'you@example.com';  -- <-- EDIT ME
  v_uid uuid := (select id from auth.users where email = v_email);
begin
  if v_uid is null then raise exception 'no auth user for %', v_email; end if;

  update public.currencies
    set gems = app.starter_gems(), gold = app.starter_gold(), xp_items = 0
    where user_id = v_uid;

  delete from public.owned_characters
    where user_id = v_uid and character_key <> app.starter_character();
  update public.owned_characters
    set level = 1, exp = 0, star = 1, dupe_shards = 0
    where user_id = v_uid;

  delete from public.stage_progress where user_id = v_uid;

  update public.gacha_state
    set pulls_since_5star = 0, pulls_since_4star = 0,
        guaranteed_featured = false, total_pulls = 0
    where user_id = v_uid;

  update public.endless_runs
    set best_wave = 0, updated_at = now()
    where user_id = v_uid;

  -- Only if 0003_formation.sql has been applied:
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'formation'
  ) then
    update public.profiles set formation = '[]'::jsonb where id = v_uid;
  end if;

  raise notice 'account reset in place for % — starter roster, no progress', v_email;
end $$;


-- ----------------------------------------------------------------------------
-- 3. FULL WIPE — DESTRUCTIVE. Deletes the auth user; every public.* row cascades
--    away. Sign up again (same or new email) and handle_new_user() re-grants the
--    starter gems / gold / character.
-- ----------------------------------------------------------------------------
do $$
declare
  v_email text := 'you@example.com';  -- <-- EDIT ME
begin
  delete from auth.users where email = v_email;
  raise notice 'deleted auth user % (all saved data cascaded)', v_email;
end $$;
