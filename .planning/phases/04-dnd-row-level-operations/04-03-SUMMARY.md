---
plan: "04-03"
phase: "04-dnd-row-level-operations"
status: complete
wave: 1
completed_at: "2026-06-08"

key-files:
  modified:
    - apps/client/src/components/builder/BuilderPalette.tsx
---

# Plan 04-03 Summary: BuilderPalette Draggable Cards

## What was built

Added `DraggableLayoutCard` sub-component to `BuilderPalette.tsx`, making all 5 layout cards draggable sources for the palette → canvas DnD flow.

### DraggableLayoutCard (NOT exported)
- `useDraggable({ id: layoutType, data: { type: DRAG_TYPES.LAYOUT_CARD, layoutType } })`
- `{...attributes}` and `{...listeners}` on card div — full card surface is drag activator
- `isDragging`: `opacity-40 cursor-grabbing` — source fades, DragOverlay ghost takes over
- CC-5 compliance: `DRAG_TYPES.LAYOUT_CARD` (never string literal `'LAYOUT_CARD'`)

### LAYOUT_NAMES exported
Changed from `const LAYOUT_NAMES` to `export const LAYOUT_NAMES: Record<LayoutType, string>` — DragDropProvider (Plan 04) can import this for ghost overlay label text.

## Test results

All 3 existing BuilderPalette tests pass (renderWithDnd wrapper added in Plan 00 prevents DndContext errors).

## Self-Check: PASSED
