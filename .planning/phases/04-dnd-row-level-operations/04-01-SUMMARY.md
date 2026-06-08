---
plan: "04-01"
phase: "04-dnd-row-level-operations"
status: complete
wave: 1
completed_at: "2026-06-08"

key-files:
  modified:
    - apps/client/src/store/useNewsletterStore.ts
---

# Plan 04-01 Summary: Store Actions — reorderSections + duplicateSection

## What was built

Extended `useNewsletterStore` with two new section mutation actions required for Phase 4 DnD.

### reorderSections(activeId, overId)
- Imports `arrayMove` from `@dnd-kit/sortable`
- Guards against invalid/missing/same IDs (no-op)
- Uses assignment pattern `state.doc.rows = arrayMove(...)` — consistent with `removeSection`

### duplicateSection(sectionId)
- Uses `current()` from `immer` to unwrap the Proxy draft before `structuredClone` (key deviation from plan — plan used bare `structuredClone`, but Immer Proxies are not serializable)
- Assigns fresh UUIDs to section + all slots + all non-null elements
- `splice(index + 1, 0, clone)` inserts clone immediately after original

## Deviation from plan

**Immer Proxy issue:** The plan specified `structuredClone<Section>(state.doc.rows[index])` but this throws `DataCloneError: #<Object> could not be cloned` because Immer wraps draft state in ES6 Proxies. Fix: `structuredClone<Section>(current(state.doc.rows[index]))` — `current()` returns a plain snapshot.

## Test results

All 6 store unit tests pass:
- addSection ✅, removeSection ✅, reorderSections ×2 ✅, duplicateSection ×2 ✅

TypeScript: 0 errors

## Self-Check: PASSED
