# Plan 09-06 Summary — Export API Route

**Status**: COMPLETE  
**Commit**: e46d008

## What was done
- Created `apps/server/src/routes/export.ts`: Fastify plugin for `POST /newsletters/:id/export`
  - Loads newsletter + presets from DB (Neon)
  - `getPresetHtml()` helper with graceful empty-string fallback on DB miss
  - `toFilename()` helper sanitizes newsletter title to safe kebab filename
  - Returns HTML as `Content-Disposition: attachment; filename="<title>.html"`
- Registered `exportRoute` in `apps/server/src/index.ts`

## Outcome
Export endpoint live. DB connectivity handled gracefully when presets table unavailable.
