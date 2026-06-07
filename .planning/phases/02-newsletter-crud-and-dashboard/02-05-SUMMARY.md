# Plan 02-05 Summary: Mutation Hooks

**Status**: Complete ✅
**Wave**: 4
**Completed**: 2026-06-07

## What Was Built

- `useCreateNewsletter` — POST /newsletters, invalidates list cache
- `useUpdateNewsletter(id)` — PUT /newsletters/:id (auto-save transport), updates updatedAt in list cache
- `useRenameNewsletter(id)` — PATCH /newsletters/:id, setQueryData on list + detail cache
- `useDeleteNewsletter` — optimistic remove, 5s undo window, Sonner toast with Undo action, rollback on DELETE error
- `useAutoSave(id)` — 1500ms debounce, isInitialLoadRef guard (StrictMode safe), D-09 auto-retry, D-11 3s fade, cleanup on unmount

## Verification

- `pnpm --filter ./apps/client exec tsc --noEmit` exits 0 ✅
- `pnpm --filter ./apps/client test --run` exits 0 ✅

## Files Modified

- `apps/client/src/hooks/useCreateNewsletter.ts` (created)
- `apps/client/src/hooks/useUpdateNewsletter.ts` (created)
- `apps/client/src/hooks/useRenameNewsletter.ts` (created)
- `apps/client/src/hooks/useDeleteNewsletter.ts` (created)
- `apps/client/src/hooks/useAutoSave.ts` (created)

## Deviations from Plan

None - plan executed exactly as written. `sonner` was already installed as a dependency; no package installation was required.

## Self-Check: PASSED
