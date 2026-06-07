# Plan 02-01 Summary: Newsletters DB Schema

**Status**: Complete ✅
**Wave**: 1
**Completed**: 2026-06-07

## What Was Built

- Updated `apps/server/src/db/schema.ts` with newsletters pgTable definition
  - UUID PK with `defaultRandom()`
  - `text('title').notNull()`
  - `jsonb('document').$type<NewsletterDoc>().notNull()` (inline opaque type)
  - `timestamp('created_at')` and `timestamp('updated_at')` with `defaultNow()` + `$onUpdate`
- Exported `Newsletter` and `NewNewsletter` TypeScript helper types
- Ran `drizzle-kit push` — newsletters table created in Neon.tech database

## Verification

- `pnpm --filter ./apps/server exec tsc --noEmit` exits 0 ✅
- `drizzle-kit push --force` exits 0, `[✓] Changes applied` ✅

## Files Modified

- `apps/server/src/db/schema.ts` (updated)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used `--force` flag for non-TTY drizzle-kit push**
- **Found during:** Task 2
- **Issue:** `drizzle-kit push` requires interactive TTY confirmation — the agent shell has no TTY, causing an interactive-prompt error.
- **Fix:** Added `--force` flag (`npx drizzle-kit push --force`) to bypass the confirmation prompt. The SQL shown in the warning (`CREATE TABLE "newsletters" ...`) was verified correct before applying.
- **Files modified:** None (runtime flag only)
- **Commit:** dc73981
