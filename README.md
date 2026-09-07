# Aether Vanguard

A turn-based anime gacha game that runs in the browser. Static site on GitHub
Pages, with Supabase for login and saved progress.

**Loop:** battle → rewards → gacha → level up → gacha. Clear story stages or push
endless mode.

## Stack

- React + Vite + TypeScript for the UI
- Phaser 3 for the battle scene
- Supabase (Postgres + Auth) for accounts and per-user data
- Deployed to GitHub Pages via GitHub Actions

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

You also need a Supabase project. In its SQL editor, run in order:

1. `supabase/migrations/0001_init.sql` — tables, RLS, new-user trigger
2. `supabase/migrations/0002_server_authoritative.sql` — economy RPCs + write lockdown
3. `supabase/generated/config_seed.sql` — balance data for the RPCs

Then, in Auth settings, add your dev/Pages origins to the redirect URLs (and turn
off "Confirm email" if you want one-step signup). See [`CLAUDE.md`](./CLAUDE.md)
for architecture and the balance-change workflow.

### Resetting a test account

The economy tables are RLS-locked to reads for the client, so gems and progress
can only be changed from the Supabase side. Paste `supabase/dev_reset.sql` into
the SQL editor — it has blocks to top up currencies, reset progress in place, or
fully wipe an account (delete the auth user, then sign up again to re-trigger the
starter grants). Edit the `v_email` line in the block you want before running it.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build to `dist/`
- `npm test` — run the test suite
- `npm run preview` — serve the production build locally
- `npm run gen:sql` — regenerate `config_seed.sql` after a `src/game/data/` change

## Deploying

Push to `main`. The Actions workflow builds and publishes to Pages. Set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository **variables**
(Settings → Secrets and variables → Actions → Variables), and enable Pages with
"GitHub Actions" as the source.
