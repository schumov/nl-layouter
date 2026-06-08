---
plan: 05-03
phase: 05-dnd-element-placement
status: complete
commit: eba1952
started_at: 2026-06-08T16:59:00Z
completed_at: 2026-06-08T17:02:00Z
---

# Plan 05-03 Summary: ColumnSlot Droppable + Remove Controls

## What Was Built

Rewrote ColumnSlot.tsx from a Phase 3 display-only component into a full dnd-kit droppable
with Phase 5 interaction model: green hover highlight, × remove button with 2-step confirm,
click-to-select, and selection ring.

## Key Files Modified

- `apps/client/src/components/builder/ColumnSlot.tsx` — Complete rewrite:
  - `useDroppable(slot.id, { data: { type: DRAG_TYPES.ELEMENT_CARD } })` (CC-5)
  - Empty slot: green `border-green-400 bg-green-50` on `isOver`, dashed border when idle
  - Occupied slot: `relative group` wrapper, click fires `setSelectedElement(slot.id)` with `stopPropagation`
  - × button: `opacity-0 group-hover:opacity-100`, `opacity-100` when `isSelected`
  - 2-step confirm: `Remove?` + `Cancel` inline, `aria-live="polite"`
  - Remove? fires `removeElement(slot.id)` + `setSelectedElement(null)`
  - Selection: `ring-2 ring-ring ring-inset` when `selectedElementId === slot.id`

- `apps/client/src/components/builder/__tests__/ColumnSlot.test.tsx` — Updated:
  - All 4 RED stubs now GREEN (× button, D-11 click confirm, no-crash, ring-2)
  - Added ELEM-12 integration test (full flow: click × → confirm → verify state cleared)
  - Uses `fireEvent.click` (userEvent not installed — same behavior for sync interactions)

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| `forceMount` NOT used | ColumnSlot renders in its natural position; no tab container |
| Direct store reads | No isSelected prop — `useNewsletterStore(s => s.selectedElementId === slot.id)` |
| `sectionId` prop retained | Forward-compatibility with Phase 6+ inspector actions |
| `font-semibold` on "Remove?" | Phase 5 font weight rule — no `font-medium` |

## Test Results

| Category | Count | Notes |
|----------|-------|-------|
| Prior passing tests | 36 GREEN | No regressions |
| ColumnSlot RED→GREEN | +4 | All 4 stubs pass |
| ELEM-12 integration test | +1 | New test passes |
| Remaining RED stubs | 6 | InspectorPanel (5), DDP (1) |
| TypeScript errors | 0 | Clean |

## Self-Check: PASSED

- ✅ `useDroppable` with `DRAG_TYPES.ELEMENT_CARD` data
- ✅ Green hover on empty slot only (D-01/D-02)
- ✅ × button with 2-step confirm (D-09/D-11)
- ✅ `removeElement` + `setSelectedElement(null)` on confirm
- ✅ Selection ring `ring-2 ring-ring ring-inset` (D-10)
- ✅ No `useSortable`/`useDraggable` (RowBlock dumb invariant)
- ✅ 40 total tests passing, 6 expected RED
- ✅ Committed as `eba1952`
