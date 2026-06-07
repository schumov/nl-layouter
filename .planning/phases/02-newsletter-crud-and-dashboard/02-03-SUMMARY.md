# Plan 02-03 Summary: Newsletter CRUD API Routes

**Status**: Complete ✅
**Wave**: 2
**Completed**: 2026-06-07

## What Was Built

- Created `apps/server/src/routes/newsletters.ts` — FastifyPluginAsync with 6 CRUD routes
  - `GET /newsletters` — lean list with sectionCount computed via COALESCE(jsonb_array_length)
  - `POST /newsletters` — creates newsletter with INITIAL_DOC, returns 201 + full row
  - `GET /newsletters/:id` — returns full row for builder, 404 on miss
  - `PUT /newsletters/:id` — auto-save document, $onUpdate handles updatedAt
  - `PATCH /newsletters/:id` — rename title, returns {id, title, updatedAt}
  - `DELETE /newsletters/:id` — hard delete, returns 204
- Registered plugin in `apps/server/src/index.ts`

## Verification

- `pnpm --filter ./apps/server exec tsc --noEmit` exits 0 ✅
- All 6 route method calls present in routes file ✅

## Files Modified

- `apps/server/src/routes/newsletters.ts` (created)
- `apps/server/src/index.ts` (updated: import + register)

## Deviations from Plan

None — plan executed exactly as written.
