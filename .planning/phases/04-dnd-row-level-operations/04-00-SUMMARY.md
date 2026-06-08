---
plan: "04-00"
phase: "04-dnd-row-level-operations"
status: complete
wave: 0
completed_at: "2026-06-08"

key-files:
  created:
    - apps/client/src/store/__tests__/useNewsletterStore.test.ts
    - apps/client/src/components/builder/__tests__/DragDropProvider.test.tsx
    - apps/client/src/components/builder/__tests__/SortableRowList.test.tsx
  modified:
    - apps/client/src/components/builder/__tests__/RowBlock.test.tsx
    - apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx
    - apps/client/src/components/builder/__tests__/BuilderPalette.test.tsx
---

# Plan 04-00 Summary: TDD Test Stubs

## What was built

Created all Phase 4 test files before implementation (Nyquist compliance). Wave 0 establishes the full test surface so subsequent waves get immediate feedback from `npx vitest run`.

## Test results (Wave 0 RED state — expected)

| File | Tests | Status |
|------|-------|--------|
| useNewsletterStore.test.ts | 6 | 2 PASS (addSection, removeSection), 4 RED (reorderSections ×2, duplicateSection ×2) |
| RowBlock.test.tsx | 6 | 2 PASS (existing), 4 RED (SectionControls tests) |
| DragDropProvider.test.tsx | 1 | RED (component not yet created) |
| SortableRowList.test.tsx | 4 | RED (component not yet created) |
| BuilderCanvas.test.tsx | 3 | ✅ 3 PASS (DndContext wrapper added) |
| BuilderPalette.test.tsx | 3 | ✅ 3 PASS (DndContext wrapper added) |

## Key decisions

- `structuredClone(FIXTURE_DOC)` in `beforeEach` ensures test isolation
- `renderWithDnd` wrapper added to BuilderCanvas + BuilderPalette tests preemptively — prevents DndContext shared Map mutation (Pitfall 3) when dnd-kit hooks are added in Plans 02/03
- RowBlock stays "dumb" — no dnd hooks, no DndContext wrapper needed in its tests

## Self-Check: PASSED
