---
phase: 7
slug: rich-text-divider-and-tiptap
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-08
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.6 + @testing-library/react v16 + jsdom |
| **Config file** | `apps/client/vitest.config.ts` |
| **Quick run command** | `cd apps/client && pnpm test run` |
| **Full suite command** | `cd apps/client && pnpm test run` |
| **Estimated runtime** | ~25 seconds (84 tests passing at phase start) |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/client && pnpm test run`
- **After every plan wave:** Run `cd apps/client && pnpm test run` — full suite must be green
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Automated Command | Status |
|---------|------|------|-------------|-------------------|--------|
| 07-00 | 00-tdd-stubs | 0 | ELEM-06..09 | `cd apps/client && pnpm test run` | ⬜ pending |
| 07-01 | 01-tiptap-setup | 1 | ELEM-06, ELEM-08 | `cd apps/client && pnpm test run` | ⬜ pending |
| 07-02 | 02-divider | 1 | ELEM-09 | `cd apps/client && pnpm test run` | ⬜ pending |
| 07-03 | 03-store-defaults | 1 | ELEM-06, ELEM-09 | `cd apps/client && pnpm test run` | ⬜ pending |
| 07-04 | 04-static-renderer | 2 | ELEM-06, ELEM-07, ELEM-08 | `cd apps/client && pnpm test run` | ⬜ pending |
| 07-05 | 05-rich-text-editor | 2 | ELEM-06, ELEM-07, ELEM-08 | `cd apps/client && pnpm test run` | ⬜ pending |
| 07-06 | 06-integration | 3 | ELEM-06..09 | `cd apps/client && pnpm test run` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/client/src/components/builder/__tests__/DividerRenderer.test.tsx` — RED stubs for ELEM-09 (renders hr, border-top color, border-top thickness, padding from spacing)
- [ ] `apps/client/src/components/builder/__tests__/DividerEditor.test.tsx` — RED stubs for ELEM-09 (color picker, thickness slider, spacing input dispatch onUpdate)
- [ ] `apps/client/src/components/builder/__tests__/RichTextStaticRenderer.test.tsx` — RED stubs for ELEM-06/07/08 (renders HTML from JSON, applies preset style wrapper)
- [ ] **UPDATE** `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx` — add RED tests for divider editor rendering + rich-text editor rendering (Phase 7 stubs)
- [ ] Existing 84 tests must remain GREEN through Wave 0 (no regressions)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rich text bold/italic/underline render on canvas | ELEM-06 | Requires visual inspection of generated HTML | Drop rich-text element; type text; select text; click Bold in BubbleMenu; verify canvas shows `<strong>` wrapped text |
| Named preset typography | ELEM-07 | Requires visual comparison | Switch between Header/Subheader/Body Text/Code presets; verify font-size and weight change visually |
| Zero CSS classes in generated HTML | ELEM-08 | Requires DevTools inspection | Open DevTools; inspect rich-text canvas slot; confirm zero `has-text-align-*` or `has-color-*` class attributes in the rendered HTML |
| BubbleMenu appears on text selection | ELEM-06 | Requires live browser interaction | Click rich-text slot; select text; verify Bold/Italic/Underline/Link popup appears |
| Divider colour + thickness + spacing | ELEM-09 | Requires visual inspection | Drop divider element; change colour, thickness, spacing in DividerEditor; verify `<hr>` updates live on canvas |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 25s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
