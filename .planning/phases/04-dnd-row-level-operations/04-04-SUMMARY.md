---
plan: "04-04"
phase: "04-dnd-row-level-operations"
status: complete
wave: 2
completed_at: "2026-06-08"

key-files:
  created:
    - apps/client/src/components/builder/DragDropProvider.tsx
---

# Plan 04-04 Summary: DragDropProvider

## What was built

Created `DragDropProvider.tsx` — the single `DndContext` root for the builder, owning all drag event handlers and the `DragOverlay` ghost.

### Sensors
- `PointerSensor` with `distance: 8` — prevents accidental drag on click
- `KeyboardSensor` with `sortableKeyboardCoordinates` — arrow-key navigation

### Event handlers
- `handleDragStart`: sets `activeDrag` state for both `LAYOUT_CARD` and `CANVAS_ROW` drag types
- `handleDragEnd`:
  - `LAYOUT_CARD + over !== null` → `addSection(createSection(layoutType))` (CANVAS-02/03)
  - `CANVAS_ROW + over !== null + active.id !== over.id` → `reorderSections(...)` (CANVAS-04)

### DragOverlay ghosts
- `LAYOUT_CARD`: palette card clone with `LAYOUT_NAMES[layoutType]` label (D-01)
- `CANVAS_ROW`: `<RowBlock>` clone wrapped in `opacity-80` (D-02)

### createSection helper
Inline factory (not in store) mapping `LayoutType → Section` with correct slot count.

## Test results

DragDropProvider.test.tsx: 1/1 passed
TypeScript: 0 errors

## Self-Check: PASSED
