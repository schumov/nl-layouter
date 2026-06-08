---
plan: "04-06"
phase: "04-dnd-row-level-operations"
status: complete
wave: 3
completed_at: "2026-06-08"

key-files:
  modified:
    - apps/client/src/components/builder/BuilderCanvas.tsx
    - apps/client/src/pages/BuilderPage.tsx
---

# Plan 04-06 Summary: BuilderCanvas + BuilderPage Integration

## What was built

Final wiring that makes Phase 4 DnD end-to-end functional at runtime.

### BuilderCanvas.tsx
- Replaced raw `RowBlock` map + empty-state paragraph with conditional:
  - `doc ? <SortableRowList rows={doc.rows} /> : <p>No sections yet...</p>`
- `doc=null` → shows fallback text (newsletter not loaded)
- `doc.rows.length === 0` → SortableRowList handles empty drop zone (D-03/D-04)

### BuilderPage.tsx
- Added `DragDropProvider` as outermost wrapper around the fully-loaded builder UI
- Loading/error early returns remain outside `DragDropProvider` (don't need DnD context)
- Both `BuilderCanvas` (→ SortableRowList → useSortable) and `BuilderPalette` (→ DraggableLayoutCard → useDraggable) are now inside the DndContext ancestor

## Full DnD flow (end-to-end wired)
```
BuilderPage
└── DragDropProvider (DndContext + sensors + handlers)
    ├── BuilderCanvas
    │   └── SortableRowList
    │       └── SortableRowBlock (useSortable → CANVAS_ROW)
    │           └── RowBlock (SectionControls: onDuplicate, onDelete)
    └── BuilderPalette
        └── DraggableLayoutCard (useDraggable → LAYOUT_CARD)
```

## Test results

Full vitest suite: **30 passed, 0 failed** (18 pre-existing skipped tests from Phase 2)
TypeScript: 0 errors

Tests covered:
- useNewsletterStore.test.ts: 6 ✅
- RowBlock.test.tsx: 6 ✅
- BuilderCanvas.test.tsx: 3 ✅
- BuilderPalette.test.tsx: 3 ✅
- SortableRowList.test.tsx: 4 ✅
- DragDropProvider.test.tsx: 1 ✅
- ColumnGrid.test.tsx: 5 ✅
- ColumnSlot.test.tsx: 2 ✅

## Self-Check: PASSED
