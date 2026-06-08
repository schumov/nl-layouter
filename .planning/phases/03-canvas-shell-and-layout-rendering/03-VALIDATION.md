---
phase: 3
slug: canvas-shell-and-layout-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + jsdom + @testing-library/react |
| **Config file** | `apps/client/vitest.config.ts` (exists from Phase 2) |
| **Quick run command** | `pnpm --filter ./apps/client test --run` |
| **Full suite command** | `pnpm --filter ./apps/client test --run && pnpm --filter ./apps/client exec tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter ./apps/client test --run`
- **After every plan wave:** Run `pnpm --filter ./apps/client test --run && pnpm --filter ./apps/client exec tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-W0-01 | W0 | 0 | — | — | N/A | install | `pnpm --filter ./apps/client add -D @testing-library/react @testing-library/jest-dom` | ❌ W0 | ⬜ pending |
| 3-W0-02 | W0 | 0 | — | — | N/A | setup | `pnpm --filter ./apps/client test --run` (green baseline) | ❌ W0 | ⬜ pending |
| 3-01 | canvas-panels | 1 | CANVAS-01 | — | N/A | component render | `pnpm --filter ./apps/client test --run BuilderCanvas` | ❌ W0 | ⬜ pending |
| 3-02 | palette-shell | 1 | CANVAS-01 | — | N/A | component render | `pnpm --filter ./apps/client test --run BuilderPalette` | ❌ W0 | ⬜ pending |
| 3-03 | column-grid-1col | 1 | LAYOUT-01 | — | N/A | component render | `pnpm --filter ./apps/client test --run ColumnGrid` | ❌ W0 | ⬜ pending |
| 3-04 | column-grid-2col | 1 | LAYOUT-02 | — | N/A | component render | `pnpm --filter ./apps/client test --run ColumnGrid` | ❌ W0 | ⬜ pending |
| 3-05 | column-grid-3col | 1 | LAYOUT-03 | — | N/A | component render | `pnpm --filter ./apps/client test --run ColumnGrid` | ❌ W0 | ⬜ pending |
| 3-06 | column-grid-layout04 | 1 | LAYOUT-04 | — | N/A | component render | `pnpm --filter ./apps/client test --run ColumnGrid` | ❌ W0 | ⬜ pending |
| 3-07 | column-grid-layout05 | 1 | LAYOUT-05 | — | N/A | component render | `pnpm --filter ./apps/client test --run ColumnGrid` | ❌ W0 | ⬜ pending |
| 3-08 | column-slot-empty | 1 | LAYOUT-01–05 | — | N/A | component render | `pnpm --filter ./apps/client test --run ColumnSlot` | ❌ W0 | ⬜ pending |
| 3-09 | row-block | 1 | CANVAS-01 | — | N/A | component render | `pnpm --filter ./apps/client test --run RowBlock` | ❌ W0 | ⬜ pending |
| 3-10 | fixture-validation | 2 | LAYOUT-01–05 | — | N/A | integration render | `pnpm --filter ./apps/client test --run fixture` | ❌ W0 | ⬜ pending |
| 3-11 | type-check | 2 | — | — | N/A | type | `pnpm --filter ./apps/client exec tsc --noEmit` | ✅ exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/client/src/components/builder/__tests__/ColumnGrid.test.tsx` — stubs for LAYOUT-01–05
- [ ] `apps/client/src/components/builder/__tests__/ColumnSlot.test.tsx` — stubs for empty slot rendering
- [ ] `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` — stubs for CANVAS-01
- [ ] `apps/client/src/fixtures/newsletter.fixture.ts` — shared fixture with one section per layout type
- [ ] `@testing-library/react` + `@testing-library/jest-dom` devDependency install
- [ ] `apps/client/src/test-setup.ts` — `import '@testing-library/jest-dom'` (if not already present)
- [ ] `apps/client/vitest.config.ts` — add `setupFiles: ['./src/test-setup.ts']` (if not already present)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Column proportions visually correct | LAYOUT-01–05 | CSS flex rendering cannot be precisely verified in jsdom (no layout engine) | Open `/newsletters/:id` in browser; confirm 1-col is full-width, 2-col halves are equal, 3-col thirds are equal, 33/67 and 67/33 are visually proportional |
| Palette is sticky (doesn't scroll with canvas) | CANVAS-01 | Scroll behavior not testable in jsdom | Scroll the canvas past multiple sections; confirm palette stays fixed |
| "Drop element here" hint text visible in empty slots | LAYOUT-01–05 | Visual affordance check | Confirm dashed border and hint text visible in all empty slots in the fixture view |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
