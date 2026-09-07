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

You also need to create a Supabase project and run `supabase/migrations/0001_init.sql`
against it. See [`CLAUDE.md`](./CLAUDE.md) for architecture and full setup notes.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build to `dist/`
- `npm test` — run the test suite
- `npm run preview` — serve the production build locally

## Deploying

Push to `main`. The Actions workflow builds and publishes to Pages. Set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository **variables**
(Settings → Secrets and variables → Actions → Variables), and enable Pages with
"GitHub Actions" as the source.
