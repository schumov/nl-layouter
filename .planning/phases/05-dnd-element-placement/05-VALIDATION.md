---
phase: 5
slug: dnd-element-placement
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-08
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.6 + @testing-library/react |
| **Config file** | `apps/client/vitest.config.ts` |
| **Quick run command** | `cd apps/client && pnpm test run` |
| **Full suite command** | `cd apps/client && pnpm test run` |
| **Estimated runtime** | ~30 seconds (30 tests already passing) |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/client && pnpm test run`
- **After every plan wave:** Run `cd apps/client && pnpm test run` — full suite must be green
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Automated Command | Status |
|---------|------|------|-------------|-------------------|--------|
| 05-00 | 00-tdd-stubs | 0 | ELEM-10/11/12 | `cd apps/client && pnpm test run` | ⬜ pending |
| 05-01 | 01-store-actions | 1 | ELEM-10/11/12 | `cd apps/client && pnpm test run` | ⬜ pending |
| 05-02 | 02-element-cards | 1 | ELEM-10 | `cd apps/client && pnpm test run` | ⬜ pending |
| 05-03 | 03-slot-droppable | 2 | ELEM-10/11/12 | `cd apps/client && pnpm test run` | ⬜ pending |
| 05-04 | 04-drop-handler | 2 | ELEM-10/11 | `cd apps/client && pnpm test run` | ⬜ pending |
| 05-05 | 05-inspector-wiring | 3 | ELEM-10/11/12 | `cd apps/client && pnpm test run` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/client/src/components/builder/__tests__/ColumnSlot.test.tsx` — add `renderWithDnd` wrapper + stubs for `isOver` highlight, × button, selection state (RED until Wave 2)
- [ ] `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx` — stub for D-04/D-05 placeholder inspector (RED until Wave 2)
- [ ] Extend `apps/client/src/store/__tests__/useNewsletterStore.test.ts` — add `addElement`/`removeElement` stubs (RED until Wave 1)
- [ ] Extend `apps/client/src/components/builder/__tests__/DragDropProvider.test.tsx` — add ELEMENT_CARD drop stub (RED until Wave 2)
- [ ] Existing 30 tests must remain green through Wave 0

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Green border on hovered empty slot | D-01/D-02/D-03 | Requires real pointer interaction | Start dev server; drag element card over empty slot; verify `border-green-400 bg-green-50` appears only on hovered slot |
| Collision detection (slot wins over row) | Finding 1 | Requires live dnd-kit interaction | With 1-col section, drag element card over slot; onDragEnd should fire with slot UUID (not row UUID) in `over.id` |
| Right panel swap on click | D-04 | Requires live React state | Click occupied slot; verify right panel shows InspectorPanel with type name + note |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
