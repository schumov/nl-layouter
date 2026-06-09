# Plan 08-01 Summary — DB Schema

**Status**: COMPLETE  
**Commit**: 351f8c5

## What was done
- Added `presets` table to `apps/server/src/db/schema.ts` (TEXT PK slug, type, name, html_content, preview_thumbnail)
- Exported `Preset` and `NewPreset` types
- Created `migrate-presets.ts` standalone SQL migration helper
- Added `db:push`, `migrate:presets`, `seed` scripts to `apps/server/package.json`

## Known limitation
`drizzle-kit push` and direct postgres.js connections fail with `ECONNRESET` in this environment (Neon free-tier cold-start). Actual DB migration requires running `pnpm --filter nl-layouter-server migrate:presets` when connectivity is restored.
