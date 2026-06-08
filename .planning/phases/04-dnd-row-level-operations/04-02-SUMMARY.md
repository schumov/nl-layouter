---
plan: "04-02"
phase: "04-dnd-row-level-operations"
status: complete
wave: 1
completed_at: "2026-06-08"

key-files:
  modified:
    - apps/client/src/components/builder/RowBlock.tsx
---

# Plan 04-02 Summary: RowBlock SectionControls + Sortable Props

## What was built

Rewrote `RowBlock.tsx` to accept sortable bindings and render an inline `SectionControls` sub-component (GripVertical drag handle + Copy duplicate + Trash2 delete with inline confirm).

### RowBlock is "dumb" (architectural invariant preserved)
- Accepts 7 new optional props: `listeners, attributes, setNodeRef, style, isDragging, onDuplicate, onDelete`
- Does NOT import or call `useSortable` — stays a pure presentational component
- Existing tests required no DndContext wrapper

### SectionControls (NOT exported)
- Always visible (D-06) — no hover gating
- `{...listeners}` on GripVertical button ONLY (Pitfall 5)
- `isConfirming` local `useState` for two-step delete (D-07)
- Positioned `absolute right-0 top-1/2 -translate-y-1/2 translate-x-full` — floats outside right edge (D-05)

### Style ordering
- `...style` (sortable transform) spread BEFORE `backgroundColor`/padding — ensures drag animation isn't overridden

## Test results

All 6 RowBlock tests pass:
- `renders a white card with border and shadow` ✅
- `applies section.backgroundColor via inline style` ✅
- `renders SectionControls with all three buttons` ✅
- `delete confirm flow` ✅
- `delete confirm cancel returns to normal state` ✅
- `applies opacity-40 when isDragging=true` ✅

## Self-Check: PASSED
