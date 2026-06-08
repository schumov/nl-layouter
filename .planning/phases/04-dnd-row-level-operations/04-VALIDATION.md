---
phase: 4
slug: dnd-row-level-operations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + @testing-library/react 16.3.2 |
| **Config file** | `apps/client/vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` (from `apps/client/`) |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose` (from `apps/client/`)
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-00-01 | 00 | 0 | CANVAS-02/03/04/06 | unit (store) | `npx vitest run src/store` | ❌ Wave 0 | ⬜ pending |
| 04-00-02 | 00 | 0 | CANVAS-02/03 | component | `npx vitest run src/components/builder/__tests__/SortableRowList.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 04-00-03 | 00 | 0 | CANVAS-05/06 | component | `npx vitest run src/components/builder/__tests__/RowBlock.test.tsx` | ✅ (extend) | ⬜ pending |
| 04-01-01 | 01 | 1 | — | component | `npx vitest run src/components/builder/__tests__/DragDropProvider.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 04-02-01 | 02 | 1 | CANVAS-02 | component | `npx vitest run src/components/builder/__tests__/BuilderPalette.test.tsx` | ✅ (extend) | ⬜ pending |
| 04-03-01 | 03 | 1 | CANVAS-02/03 | component | `npx vitest run src/components/builder/__tests__/SortableRowList.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 04-04-01 | 04 | 2 | CANVAS-04 | unit (store) | `npx vitest run src/store` | ❌ Wave 0 | ⬜ pending |
| 04-05-01 | 05 | 2 | CANVAS-02/03 | unit (store) | `npx vitest run src/store` | ❌ Wave 0 | ⬜ pending |
| 04-06-01 | 06 | 2 | CANVAS-04 | unit (store) | `npx vitest run src/store` | ❌ Wave 0 | ⬜ pending |
| 04-07-01 | 07 | 2 | CANVAS-05/06 | component | `npx vitest run src/components/builder/__tests__/RowBlock.test.tsx` | ✅ (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/client/src/store/__tests__/useNewsletterStore.test.ts` — pure store unit tests covering `addSection`, `removeSection`, `reorderSections`, `duplicateSection` (CANVAS-02, 03, 04, 05, 06)
- [ ] `apps/client/src/components/builder/__tests__/SortableRowList.test.tsx` — empty drop zone rendering + rows rendering (with `DndContext` wrapper) — CANVAS-02/03
- [ ] `apps/client/src/components/builder/__tests__/DragDropProvider.test.tsx` — renders children without crashing
- [ ] Extend `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` — add `DndContext` wrapper (prevent shared context Map mutation)
- [ ] Extend `apps/client/src/components/builder/__tests__/BuilderPalette.test.tsx` — add `DndContext` wrapper (prevent shared context Map mutation)
- [ ] Extend `apps/client/src/components/builder/__tests__/RowBlock.test.tsx` — add SectionControls render tests + delete confirm flow (CANVAS-05/06)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag ghost follows cursor at 80% opacity | CANVAS-02 | CSS transform + pointer position not testable in jsdom | Dev server: drag palette card, confirm semi-transparent ghost renders under cursor |
| SortableContext CSS reflow animation | CANVAS-04 | CSS transforms not computed in jsdom | Dev server: drag row handle, confirm other rows shift visually during drag |
| KeyboardSensor arrow-key reorder | CANVAS-04 | ARIA focus + keyboard events not fully simulated in jsdom | Dev server: focus grip handle, press Space to lift, arrow keys to move, Space to drop |
| Drop on empty canvas blue highlight | CANVAS-02 | `isOver` state + CSS class swap not triggerable via `fireEvent` for dnd-kit's PointerSensor | Dev server: drag palette card over empty canvas, confirm `bg-blue-50 border-blue-400` activates |

---

## Test Helpers

### `renderWithDnd` — DndContext wrapper for tests
```typescript
// Use in any test that renders a component containing useDraggable/useSortable/useDroppable
import { DndContext } from '@dnd-kit/core';

function renderWithDnd(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}
```

### Store reset pattern
```typescript
// Reset store before each test with structuredClone to prevent cross-test contamination
import { FIXTURE_DOC } from '../../fixtures/newsletter.fixture';

beforeEach(() => {
  useNewsletterStore.setState({ doc: structuredClone(FIXTURE_DOC), selectedElementId: null });
});
```

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
