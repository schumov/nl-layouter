---
plan: 05-04
phase: 05-dnd-element-placement
status: complete
commit: 811cb2a
started_at: 2026-06-08T17:02:00Z
completed_at: 2026-06-08T17:05:00Z
---

# Plan 05-04 Summary: DragDropProvider Collision Fix + ELEMENT_CARD Handler

## What Was Built

Wired the ELEMENT_CARD drop flow into DragDropProvider — custom collision detection prevents
nested droppable collision in 1-column sections, and the ELEMENT_CARD onDragEnd branch
dispatches `addElement` to the store.

## Key Files Modified

- `apps/client/src/components/builder/DragDropProvider.tsx`
  - `CollisionDetection` type import added
  - `ELEMENT_NAMES` + `ELEMENT_CARD_ICONS` imported from BuilderPalette
  - `ActiveDrag` extended: `elementType?` + `elementLabel?`
  - `addElement` added to store destructure
  - `customCollision`: filters droppableContainers to slot-only when ELEMENT_CARD dragged
  - `handleDragStart`: ELEMENT_CARD branch populates `activeDrag.elementType/elementLabel`
  - `handleDragEnd`: ELEMENT_CARD branch calls `addElement(String(over.id), elementType)`
  - `DndContext`: `collisionDetection={customCollision}` (replaced `closestCenter`)
  - `DragOverlay`: ELEMENT_CARD ghost with icon + label at 80% opacity

- `apps/client/src/components/builder/__tests__/DragDropProvider.test.tsx`
  - RED stub replaced with real mount + store-wiring test
  - Full drag simulation is manual-only (JSDOM can't simulate dnd-kit pointer events)

## Critical Architecture: customCollision (RESEARCH Finding 1)

Without custom collision detection, `closestCenter` considers ALL registered droppables —
including `SortableRowBlock` row nodes. In 1-column sections the row and slot have nearly
identical centers, causing the row to steal the collision and `ColumnSlot.isOver` to
never fire.

Fix: filter `droppableContainers` to only those with `data.current.type === DRAG_TYPES.ELEMENT_CARD`
when the active drag is an ELEMENT_CARD. LAYOUT_CARD and CANVAS_ROW drags are unaffected.

## Test Results

| Category | Count | Notes |
|----------|-------|-------|
| Prior passing tests | 40 GREEN | No regressions |
| DragDropProvider RED→GREEN | +1 | RED stub replaced with real test |
| Remaining RED stubs | 5 | InspectorPanel only (Wave 3 implements) |
| TypeScript errors | 0 | Clean |

## Self-Check: PASSED

- ✅ `customCollision` defined and wired as `collisionDetection` prop
- ✅ `DRAG_TYPES.ELEMENT_CARD` used (CC-5 compliance) — no string literals
- ✅ `addElement(String(over.id), elementType)` in handleDragEnd
- ✅ ELEMENT_CARD DragOverlay ghost renders icon + label
- ✅ LAYOUT_CARD and CANVAS_ROW behaviours unchanged
- ✅ 41 tests passing, 5 expected RED (InspectorPanel)
- ✅ TypeScript strict-mode clean
- ✅ Committed as `811cb2a`
