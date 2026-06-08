---
phase: 6
slug: image-and-button-elements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-08
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.6 + @testing-library/react v16 + jsdom |
| **Config file** | `apps/client/vitest.config.ts` |
| **Quick run command** | `cd apps/client && pnpm test run` |
| **Full suite command** | `cd apps/client && pnpm test run` |
| **Estimated runtime** | ~15 seconds (46 tests passing at phase start) |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/client && pnpm test run`
- **After every plan wave:** Run `cd apps/client && pnpm test run` — full suite must be green
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Automated Command | Status |
|---------|------|------|-------------|-------------------|--------|
| 06-00 | 00-tdd-stubs | 0 | ELEM-01..05 | `cd apps/client && pnpm test run` | ⬜ pending |
| 06-01 | 01-update-element | 1 | ELEM-01..05 | `cd apps/client && pnpm test run` | ⬜ pending |
| 06-02 | 02-image-renderers | 1 | ELEM-01, ELEM-02, ELEM-03 | `cd apps/client && pnpm test run` | ⬜ pending |
| 06-03 | 03-button-renderer | 1 | ELEM-04, ELEM-05 | `cd apps/client && pnpm test run` | ⬜ pending |
| 06-04 | 04-element-renderer | 2 | ELEM-01..05 | `cd apps/client && pnpm test run` | ⬜ pending |
| 06-05 | 05-editors | 2 | ELEM-01..05 | `cd apps/client && pnpm test run` | ⬜ pending |
| 06-06 | 06-inspector-wiring | 3 | ELEM-01..05 | `cd apps/client && pnpm test run` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/client/src/components/builder/__tests__/ImageRenderer.test.tsx` — RED stubs for ELEM-01 (renders img, empty-state placeholder, min-h-[70px]) and ELEM-02 (alt attr)
- [ ] `apps/client/src/components/builder/__tests__/ImageLinkRenderer.test.tsx` — RED stubs for ELEM-03 (anchor wrap, ExternalLink badge, data-builder-only)
- [ ] `apps/client/src/components/builder/__tests__/ButtonRenderer.test.tsx` — RED stubs for ELEM-04 (label, href), ELEM-05 (solid bg style, outline transparent+border)
- [ ] `apps/client/src/components/builder/__tests__/ImageEditor.test.tsx` — RED stubs for editor fields (src, alt, width dispatch onUpdate)
- [ ] `apps/client/src/components/builder/__tests__/ButtonEditor.test.tsx` — RED stubs for editor fields (label, href, bgColor, textColor, style toggle dispatch)
- [ ] **UPDATE** `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx` — rewrite to use `element={...} onUpdate={vi.fn()}` prop signature (breaking change D-08); tests RED for behaviour, GREEN for compilation
- [ ] **UPDATE** `apps/client/src/components/builder/__tests__/ColumnSlot.test.tsx` — change `getByText('[image]')` → check for "Add image URL" placeholder text (Pitfall 2)
- [ ] **UPDATE** `apps/client/src/store/__tests__/useNewsletterStore.test.ts` — add RED stubs for `updateElement` (merges patch, no-op on unknown slotId, no-op on empty slot)
- [ ] Existing 46 tests must remain green through Wave 0 (no regressions)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Canvas updates live on every keystroke | D-07 | Requires live React + Zustand | Open builder; drop image element; type in src URL field character-by-character; canvas `<img>` src must update on each keystroke, no debounce |
| ExternalLink badge visible in builder only | D-11 | Requires visual inspection | Drop image-link element; verify ExternalLink icon badge appears top-right in builder; verify badge carries `data-builder-only="true"` in DOM |
| Button Filled vs Outline render | ELEM-05 | Requires visual verification | Drop button element; toggle Filled/Outline in ButtonEditor; verify Filled = solid background, Outline = transparent + border in canvas |
| href navigation blocked during editing | Pitfall 4 | Requires browser interaction | Drop button element with href set; click the button element on canvas; verify no navigation occurs (builder stays on page) |
| Colour picker hex input sync | ELEM-04 | Requires live input interaction | Open ButtonEditor; use native colour swatch to change colour; verify hex text field updates; manually type hex value; verify colour swatch updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
