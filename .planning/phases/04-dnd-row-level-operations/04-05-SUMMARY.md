---
plan: "04-05"
phase: "04-dnd-row-level-operations"
status: complete
wave: 2
completed_at: "2026-06-08"

key-files:
  created:
    - apps/client/src/components/builder/SortableRowList.tsx
---

# Plan 04-05 Summary: SortableRowList

## What was built

Created `SortableRowList.tsx` with two rendering modes:

### Empty state (rows.length === 0)
- `useDroppable({ id: CANVAS_ZONE_ID })` registers the div as a droppable zone
- `aria-label="Canvas drop zone. Drop a layout here."` for accessibility
- Default: `border-dashed border-neutral-300` (D-03)
- `isOver`: `border-blue-400 bg-blue-50` (D-04)

### Populated state (rows.length > 0)
- `SortableContext` with `verticalListSortingStrategy`
- `items={rows.map((s) => s.id)}` — matches `useSortable` IDs exactly (Pitfall 8)
- `SortableRowBlock` (local, NOT exported) bridges `useSortable` → dumb `RowBlock`

### SortableRowBlock (NOT exported)
- `useSortable({ id: section.id, data: { type: DRAG_TYPES.CANVAS_ROW } })` — REQUIRED data for type discrimination
- `CSS.Transform.toString(transform)` — handles null safely
- Passes `onDelete={() => removeSection(...)}` and `onDuplicate={() => duplicateSection(...)}` to RowBlock

## Test results

All 4 SortableRowList tests pass:
- `CANVAS-02: renders empty drop zone when rows is empty` ✅
- `CANVAS-02: empty drop zone has aria-label for accessibility` ✅
- `CANVAS-03: renders one row per section when rows is non-empty` ✅
- `does not render empty drop zone when rows is non-empty` ✅

## Self-Check: PASSED
