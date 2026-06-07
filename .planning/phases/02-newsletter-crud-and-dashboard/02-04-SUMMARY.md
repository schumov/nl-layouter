# Plan 02-04 Summary: TanStack Query Hooks — Newsletter List + Detail

**Status**: Complete ✅
**Wave**: 3
**Completed**: 2026-06-07

## What Was Built

- Created `apps/client/src/hooks/useNewsletters.ts`:
  - `useNewsletters()` — GET /newsletters list, staleTime:0
  - `useNewsletter(id)` — GET /newsletters/:id detail, staleTime:1min
  - `NEWSLETTERS_QUERY_KEY` = ['newsletters'] as const
  - `NEWSLETTER_QUERY_KEY(id)` = ['newsletter', id] as const
  - `NewsletterSummary` and `NewsletterDetail` interfaces

## Verification

- `pnpm --filter ./apps/client exec tsc --noEmit` exits 0 ✅
- `pnpm --filter ./apps/client test --run` exits 0 ✅

## Files Modified

- `apps/client/src/hooks/useNewsletters.ts` (created)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `apps/client/src/hooks/useNewsletters.ts` — FOUND ✅
- Commit `bcfefc1` — FOUND ✅
