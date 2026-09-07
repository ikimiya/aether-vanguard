# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A turn-based anime gacha game that runs entirely in the browser as a static site
on GitHub Pages. Supabase provides email/password auth and stores per-user
progress. Gameplay loop: **battle → rewards → gacha → level up → gacha**. Players
clear story stages or push endless mode.

Full design and milestone breakdown: `docs` is not used — see the approved plan at
`~/.claude/plans/i-want-to-make-calm-salamander.md` if present, otherwise the
sections below.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build | `npm run build` (runs `tsc -b` then `vite build`) |
| Preview the build | `npm run preview` |
| All tests | `npm test` |
| Single test file | `npm test -- src/game/engine/battle.test.ts` |
| Watch tests | `npm run test:watch` |
| Type-check only | `npm run typecheck` |
| Regenerate placeholder art | `npm run gen:art` |
| Validate the static data | `npm run validate` (schema / refs / assets; `gen:sql` runs it first) |
| Regenerate the DB config seed | `npm run gen:sql` (after any `src/game/data/` change) |

Tests run in Node (no jsdom). Anything imported into a `*.test.ts` file must not
pull in the DOM, React, or Phaser — the engine/data/gacha/progression modules are
written to be importable from Node.

## Local setup

1. `npm install`
2. Create a Supabase project. In the SQL editor run, in order:
   `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_server_authoritative.sql`, then
   `supabase/migrations/0003_formation.sql`, then
   `supabase/migrations/0004_banner_pipeline.sql`, then
   `supabase/generated/config_seed.sql`.
3. `cp .env.example .env` and fill `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   from Supabase project settings → API.
4. `npm run dev`.

Optionally paste `supabase/verify.sql` (edit the throwaway user id first) to
smoke-test the RPCs and the RLS lockdown.

## Architecture

Four layers, deliberately decoupled:

- **React app** (`src/screens/`, `src/AppLayout.tsx`, `src/router.tsx`) — all
  menu screens, auth UI, routing. Uses `createMemoryRouter`: the browser URL
  never changes (stays the site root), screens swap in place — no deep links, no
  back/forward, a refresh returns to Home. There is no persistent nav bar; the
  Home screen (`/`) is the wallpaper main menu and the only hub. Other screens
  show a "‹ Menu" button in the app bar.
- **Phaser battle scene** (`src/phaser/`) — visualization and input for battles
  only. Lazy-loaded (Phaser is ~1.4 MB) so the menu bundle stays small. It
  renders state produced by the engine and reports the result back; it contains
  no game rules.
- **Battle engine** (`src/game/engine/`) — pure TypeScript. No DOM, no Phaser, no
  network. Takes team state + enemy state + player actions + a seeded RNG and
  returns state transitions plus an event log. Fully unit-tested. This is the
  source of truth for combat.
- **Static game data** (`src/game/data/`) — characters, skills, enemies, stages,
  elements, gacha config. Ships with the commit; **never** stored in the DB.
  Balance changes are code changes.

Supporting:

- **`src/lib/supabase.ts`** — the Supabase client singleton (has a "not
  configured" fallback so the app still renders before `.env` is set).
- **`src/lib/db/`** — the *only* place that *reads* Supabase tables. One
  repository module per table (`roster.ts`, `currency.ts`, `progress.ts`,
  `gacha.ts`, `endless.ts`, `profile.ts`), reads only. Screens never call
  `supabase.from(...)`.
- **`src/lib/operations.ts`** — the *only* place that *writes* the economy. Each
  function (`pullBanner`, `claimStageRewards`, `levelUpCharacter`,
  `starUpCharacter`, `submitEndlessRun`) is a thin `supabase.rpc(...)` call to a
  `SECURITY DEFINER` function in `0002_server_authoritative.sql`. The client has
  no direct INSERT/UPDATE on the economy tables. Screens call these, then
  `useGameData().reload()`.
- **`src/game-data/GameDataProvider.tsx`** — loads currencies/roster/progress/
  gacha_state/endless once per session; `useGameData()` exposes them plus
  `reload()`. Screens read from it and call `reload()` after an operation.
- **`src/game/progression.ts`** — level/star → stats, costs, rarity caps. Pure.
  Used for UI previews; the authoritative cost math is in `level_up_character()`.
- **`src/game/gacha.ts`** — reference implementation of the pull rules (pity,
  featured 50/50, dupe→shard). The authoritative version is `pull_banner()` in
  SQL; the tests here are the spec both must satisfy.
- **`src/game/endless.ts`** — deterministic scaled wave generator. Pure.
- **`src/battle/BattleView.tsx`** — React shell that owns a `BattleState`,
  renders `<PhaserBattle>` plus the action/target/swap/result UI. While mounted
  it holds the battle lock (`src/battle/BattleLock.tsx`), which strips the nav
  out of `AppLayout`'s header so a stray tap can't leave a fight; Retreat is a
  two-step confirm.
- **`src/gacha/SummonAnimation.tsx`** — full-screen pull reveal (charging orb →
  burst → one card at a time, tap to advance). Shown by `Gacha` before the
  results grid; skips itself under `prefers-reduced-motion`.

### Routes

In-memory router. `/login`, `/signup`, and `/sandbox` (a dev-only fixed-team
battle tester, now only reachable in code) are outside the auth guard. Everything
else is under `RequireAuth` + `AppLayout` (+ `GameDataProvider`): `/`, `/stages`,
`/stages/:stageId`,
`/gacha`, `/roster`, `/roster/:characterKey`, `/endless`.

### Data ownership

Balance data (rarity, stats, skills, art paths, enemy/stage/wave defs, gacha
rates, costs) lives in `src/game/data/` + `src/game/progression.ts`. It is the
single source of truth. `npm run gen:sql` mirrors the slice the server needs
(character→rarity, rate/pity constants, banner configs, stage rewards, star-up
costs) into `supabase/generated/config_seed.sql`, which seeds the `app.*` config
tables the RPCs read. `src/game/data/sql-seed.test.ts` fails if the seed is stale.

The `public` DB tables store only per-user mutable state: `profiles`,
`currencies`, `owned_characters` (keyed by `character_key`, must resolve against
`src/game/data/characters/`), `stage_progress`, `endless_runs`, `gacha_state`.
RLS locks every row to `auth.uid()`; the economy tables now expose SELECT only,
with all writes going through the RPCs. `profiles` is not an economy table:
`profiles.formation` (a `jsonb` array of up to 5 `character_key`s, migration
`0003`) is written directly by the client via `profileRepo.saveFormation` under
the existing "update own" policy. `src/game/party.ts` `resolveTeam()` cleans it
against the roster and falls back to `suggestTeam()`; `StageBattle`/`Endless`
build their party from it.

**Residual trust gap:** a battle's outcome (won / rounds / no-deaths) is asserted
by the client — verifying it would need a server-side replay engine.
`claim_stage_rewards` trusts those args but pays only the config-defined reward,
gates first-clear on clearing the previous stage, and `submit_endless` clamps the
wave. Acceptable for a hobby game; not for competitive leaderboards.

### The data pipeline (characters / banners → SQL)

`src/game/data/` is the single source of truth. `npm run validate`
(`scripts/validate.ts`) checks the whole set — unique ids, skill/character refs,
featured-rarity match, rates summing to 1, `featuredRate`/`starUp` ranges, banner
windows, and that every referenced art file exists. `npm run gen:sql`
(`scripts/gen-sql-config.ts`) runs `validate()` first, then regenerates
`supabase/generated/config_seed.sql` — the `app.*` config the economy RPCs read
(`app.characters` id→rarity, `app.rarity_config`, `app.banners` incl.
`featured_rate` / `pool_characters` / `starts_at` / `ends_at`, `app.stages`,
`app.star_up_cost` keyed by `(character_key, target_star)` with `'*'` as the
default curve, `app.game_constants`). `sql-seed.test.ts` fails if the checked-in
seed drifts. After `gen:sql`, re-run `config_seed.sql` in the Supabase SQL editor.

### Changing balance

Edit a number in `src/game/data/` (or the cost constants in `progression.ts`) →
`npm run gen:sql` → re-run `config_seed.sql`. That's it — no SQL by hand. Only a
*rule* change (pity ramp, star cap, a new mechanic) needs both
`src/game/gacha.ts`/`progression.ts` **and** the matching plpgsql in
`0002` / `0004` updated together.

### Adding a character

The character's `id` string is the join key everywhere — `CHARACTERS_BY_ID`, the
gacha pool, banner `featured` lists, and the DB `owned_characters.character_key`.

1. Data file `src/game/data/characters/<id>.ts` — copy `kai.ts`; set `id`,
   `name`, `rarity` (`3 | 4 | 5`), `element`, `role`, `baseStats`/`growth`,
   `maxMp`/`mpRegen`, `skills` (ids from `src/game/data/skills/index.ts`), the
   `art` paths, and optionally `starUp` (per-star shard override; omitted stars
   fall back to `STAR_UP_SHARDS`).
2. Register it: `import` + one array line in `src/game/data/characters/index.ts`.
3. Art at `public/assets/characters/<id>/portrait.png` (512×512) and `battle.png`
   (420×560); optional `splash.png` (wide) as `art.splash` — see "Menu
   wallpaper". No real art yet? add `["<id>", "<element>", <rarity>]` to the
   `characters` array in `scripts/gen-placeholders.mjs`, then `npm run gen:art`.
4. Optional: rate it up on a banner (see "Adding / scheduling a banner").
5. `npm run validate` → `npm run gen:sql` → re-run `config_seed.sql` in the
   Supabase SQL editor.
6. `npm test`, commit, push.

Rarity is a field on the character object, not a folder; the gacha filters the
pool by it. `validate` / `gen:sql` fail if any referenced art file is missing or
a skill ref is unknown. `art.*` can point anywhere, but folder == id by
convention.

### Adding / scheduling a banner

One file per banner. A banner names character **IDs** + rate-up + window — it
never touches a character definition.

1. `src/game/data/gacha/banners/<id>.ts` — export a `Banner`: `id`, `name`,
   `costPerPull`, `featured: { 5: ["<charId>"], 4: [...] }`, optional
   `featuredRate: { 5: 0.55 }` (featured-vs-off split; default 0.5 / 0.5),
   optional `poolCharacters` (restrict the non-featured pool), optional
   `startsAt` / `endsAt` (ISO — the server rejects out-of-window pulls), `art`.
2. `import` + one array line in `src/game/data/gacha/banners/index.ts`.
3. Banner art `public/assets/banners/<id>.png` (or add to
   `scripts/gen-placeholders.mjs` + `npm run gen:art`).
4. `npm run validate` → `npm run gen:sql` → re-run `config_seed.sql` in Supabase.
5. `npm test`, commit, push. It goes live at `startsAt` and closes at `endsAt`
   with no redeploy.

### Renaming a character id

The id is the DB `character_key`, so a rename is a data migration — an existing
`owned_characters` row keyed by the old id resolves to nothing and the unit
silently disappears from the roster (`tryGetCharacter` / the Roster guard hide
it).

1. Rename the data file, its `export const`, the `id:` field, and the `art`
   folder paths; rename `public/assets/characters/<old>/` → `<new>/`.
2. Update `characters/index.ts`, the `characters` list in
   `scripts/gen-placeholders.mjs`, any banner file
   (`src/game/data/gacha/banners/*.ts`) that lists the id in
   `featured`/`poolCharacters`, and the hardcoded ids in the test fixtures
   (`src/game/{gacha,party}.test.ts`, `src/game/engine/battle.test.ts`) and
   `src/screens/BattleSandbox.tsx`.
3. `npm run gen:sql` → re-run `config_seed.sql` in the SQL editor.
4. Fix existing saves in the SQL editor:
   `update public.owned_characters set character_key = '<new>' where character_key = '<old>';`
   If you're renaming the starter (`kai`), also `create or replace function
   app.starter_character() ... select '<new>'`. Or wipe with
   `supabase/dev_reset.sql`.
5. `npm test`, commit, push.

### Menu wallpaper

The home menu shows `public/assets/menu-bg.png` as a full-screen wallpaper —
overwrite that one file to change it (any wide image, ~16:10). A character's
optional `art.splash` overrides it while that unit leads the team. `npm run
gen:art` regenerates `menu-bg.png` (and every other placeholder).

## Deployment

Push to `main` → `.github/workflows/deploy.yml` runs `npm ci && npm test &&
npm run build` and publishes `dist/` to Pages. Supabase URL and anon key are
injected as GitHub Actions **repository variables** (`vars.VITE_SUPABASE_URL`,
`vars.VITE_SUPABASE_ANON_KEY`) — the anon key is public by design; RLS is the
security boundary.

`vite.config.ts` uses `base: "./"` (relative) so the build works under any Pages
subpath without hardcoding the repo name. Combined with the in-memory router
(one served URL, ever) this needs no per-repo configuration.

## Conventions specific to this repo

- Keep the engine, `progression.ts`, `gacha.ts`, and everything under
  `src/game/data/` free of React/Phaser/DOM/Supabase imports so they stay
  Node-testable and reusable.
- Battle randomness always goes through the seeded RNG in
  `src/game/engine/rng.ts` — never `Math.random()` in engine code — so battles
  are reproducible in tests.
- Screens read the backend through `src/lib/db/` repositories and write the
  economy only through `src/lib/operations.ts` RPC wrappers; after a mutation,
  call `useGameData().reload()`. The only non-economy client writes are the
  `profiles` repo helpers (`setUsername`, `saveFormation`).
- The economy is server-authoritative (see Data ownership). Don't add client-side
  currency/roster writes — they'll be rejected by RLS. Add an RPC instead.
- Endless battles currently start each wave at full HP/MP (no carry-over).
