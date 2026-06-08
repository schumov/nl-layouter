# Plan 05-05 Summary: InspectorPanel + BuilderPage Wiring

**Status:** Complete  
**Wave:** 3  
**Commit:** f58d3d6

## What was done

### Task 1 — InspectorPanel.tsx (full implementation)
Replaced the Wave 0 stub with a real placeholder component:
- `ELEMENT_LABELS` record maps all 5 `ElementUnion['type']` values to display names
- Header: ArrowLeft icon Button (`variant="ghost" size="icon-sm" aria-label="Back to palette"`) + element type name (`font-semibold`)
- Body: "Editing available in the next step." note (`text-muted-foreground`)
- Layout: `flex-[2] min-w-0 border-l bg-background overflow-y-auto flex flex-col` (same sizing contract as BuilderPalette)
- All 5 InspectorPanel RED stubs from Plan 05-00 turned GREEN

### Task 2 — BuilderPage.tsx
- Added `InspectorPanel` import
- Added `selectedElementId` and `setSelectedElement` store reads
- Added `selectedElementType` derived selector (nested loop over `doc.rows[].slots[]` finds `slot.element.type` by matching `slot.id === selectedElementId`)
- Conditionally renders `<InspectorPanel elementType={...} onBack={...} />` when both are non-null, else `<BuilderPalette />` (D-04)
- Passes `onCanvasClick={() => setSelectedElement(null)}` to `<BuilderCanvas>` (D-06)

### Task 2 — BuilderCanvas.tsx
- Extended `BuilderCanvasProps` with `onCanvasClick?: () => void`
- Forwarded prop to outer div `onClick` — canvas background click clears selection (D-06)

## Test results
- Before: 41 passing, 5 failing (InspectorPanel RED stubs)
- After: **46 passing, 0 failing**
- TypeScript: 0 errors (`npx tsc --noEmit`)

## Key decisions
- `size="icon-sm"` confirmed present in the project's Button component
- `selectedElementType` derived in BuilderPage (not InspectorPanel) — keeps InspectorPanel pure/testable
- `ColumnSlot` calls `e.stopPropagation()` on occupied slot clicks → canvas `onClick` only fires on true background clicks (D-06 propagation chain confirmed)
