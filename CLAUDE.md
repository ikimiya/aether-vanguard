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

Tests run in Node (no jsdom). Anything imported into a `*.test.ts` file must not
pull in the DOM, React, or Phaser — the engine/data/gacha/progression modules are
written to be importable from Node.

## Local setup

1. `npm install`
2. Create a Supabase project. Run `supabase/migrations/0001_init.sql` in the SQL
   editor (or `supabase db push` with the CLI linked).
3. `cp .env.example .env` and fill `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   from Supabase project settings → API.
4. `npm run dev`.

## Architecture

Four layers, deliberately decoupled:

- **React app** (`src/screens/`, `src/AppLayout.tsx`, `src/router.tsx`) — all
  menu screens, auth UI, routing. Uses `createHashRouter`: GitHub Pages serves a
  single `index.html`, so routes must live after the `#`.
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

- **`src/lib/supabase.ts`** — the Supabase client singleton.
- **`src/lib/db/`** — the *only* place that reads/writes Supabase tables. One
  repository module per table (`roster.ts`, `currency.ts`, `progress.ts`, …).
  Screens call repositories, never `supabase.from(...)` directly.
- **`src/game/progression.ts`** — level/star → stats, level-up and star-up costs,
  rarity level caps. Pure.
- **`src/game/gacha.ts`** — pull logic: pool building, pity, rate rolls, dupe →
  shard conversion. Pure; the DB writes happen in `src/lib/db/gacha.ts`.

### Data ownership

Repo data (stats, skills, art paths, rarity, enemy/stage/wave defs, gacha rates)
lives in `src/game/data/`. The DB stores only per-user mutable state:
`profiles`, `currencies`, `owned_characters` (keyed by `character_key` — a string
that must resolve against `src/game/data/characters/`), `stage_progress`,
`endless_runs`, `gacha_state`. Every table has RLS locked to `auth.uid()`.

### Adding a character

1. Drop art at `public/assets/characters/<id>/portrait.png` and `battle.png`.
2. Add `src/game/data/characters/<id>.ts`.
3. Add one line to `src/game/data/characters/index.ts`.

Rarity is a field on the character object (`rarity: 3 | 4 | 5`), not a folder.
The gacha filters the pool by that field.

## Deployment

Push to `main` → `.github/workflows/deploy.yml` runs `npm ci && npm test &&
npm run build` and publishes `dist/` to Pages. Supabase URL and anon key are
injected as GitHub Actions **repository variables** (`vars.VITE_SUPABASE_URL`,
`vars.VITE_SUPABASE_ANON_KEY`) — the anon key is public by design; RLS is the
security boundary.

`vite.config.ts` uses `base: "./"` (relative) so the build works under any Pages
subpath without hardcoding the repo name. Combined with HashRouter this needs no
per-repo configuration.

## Conventions specific to this repo

- Keep the engine, `progression.ts`, `gacha.ts`, and everything under
  `src/game/data/` free of React/Phaser/DOM/Supabase imports so they stay
  Node-testable and reusable.
- Battle randomness always goes through the seeded RNG in
  `src/game/engine/rng.ts` — never `Math.random()` in engine code — so battles
  are reproducible in tests.
- Screens talk to the backend only through `src/lib/db/` repositories.
