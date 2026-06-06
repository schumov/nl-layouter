---
phase: 01-foundation-and-stack-setup
plan: 05
subsystem: client
tags: [dnd-kit, tiptap, constants, extensions, email-safe]
dependency_graph:
  requires: [01-04]
  provides: [DRAG_TYPES constants, emailSafeExtensions array]
  affects: [Phase 4 DragDropProvider, Phase 7 RichTextEditor]
tech_stack:
  added: []
  patterns: [DRAG_TYPES enum pattern (CC-5), TipTap inline-style renderHTML (CC-2)]
key_files:
  created:
    - apps/client/src/dnd/types.ts
    - apps/client/src/editor/extensions.ts
  modified: []
decisions:
  - "DnD DRAG_TYPES uses 4 string literal values with `as const` for exhaustive type safety"
  - "ACCEPT_CONSTRAINTS maps each droppable zone to its valid drag types — no ad-hoc arrays"
  - "UndoRedo imported from @tiptap/extensions (v3 consolidated package), not deprecated @tiptap/extension-history"
  - "StarterKit.configure({ undoRedo: false }) prevents double-registration of undo/redo in TipTap v3"
  - "renderHTML stubs use style= pattern from Phase 1; Phase 7 fills in full inline-style values (CC-2)"
metrics:
  duration: "5 minutes"
  completed: "2026-06-06"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 1 Plan 05: DnD Type Constants + TipTap v3 Extensions Summary

**One-liner:** DRAG_TYPES enum (4 typed drag interactions) and emailSafeExtensions (TipTap v3 with UndoRedo from @tiptap/extensions, style=-only renderHTML contract) locked as immutable Phase 1 foundations.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | DnD type constants and accept constraints | `0a3c6f1` | apps/client/src/dnd/types.ts |
| 2 | TipTap v3 extensions scaffold with inline-style renderHTML stubs | `2e609c4` | apps/client/src/editor/extensions.ts |

---

## What Was Built

### Task 1 — `apps/client/src/dnd/types.ts`

- `DRAG_TYPES` constant object with 4 string literal values (`LAYOUT_CARD`, `ELEMENT_CARD`, `CANVAS_ROW`, `CANVAS_ELEMENT`) marked `as const`
- `DragType` union type derived from the object (`(typeof DRAG_TYPES)[keyof typeof DRAG_TYPES]`)
- `ACCEPT_CONSTRAINTS` map documenting which drag types each droppable zone accepts:
  - `CANVAS_SECTION_LIST` → `[LAYOUT_CARD, CANVAS_ROW]` (palette add + reorder)
  - `COLUMN_SLOT` → `[ELEMENT_CARD, CANVAS_ELEMENT]` (palette place + relocate)
- `AcceptConstraintKey` type for map key access

### Task 2 — `apps/client/src/editor/extensions.ts`

- `emailSafeExtensions` array — single source of truth for TipTap configuration
- `StarterKit.configure({ undoRedo: false })` — disables StarterKit's built-in undo/redo
- `UndoRedo` from `@tiptap/extensions` (v3 renamed from History; correct v3 package)
- `TextStyle` + `Color` for inline text color support
- `Placeholder.configure({ placeholder: 'Start typing…' })`
- Phase 7 TODO comments documenting the full inline-style renderHTML pattern for Bold, Italic, Color, TextAlign
- Zero `class=` attributes in any non-comment code (CC-2 enforced)

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| `as const` on DRAG_TYPES | TypeScript narrows type to string literals — `DragType` is a union of literal types, not `string` |
| ACCEPT_CONSTRAINTS separate export | Consumers copy these arrays directly into `useDroppable({ accept: ... })` — no ad-hoc arrays that can drift |
| `undoRedo: false` in StarterKit (not `history: false`) | TipTap v3 renamed the key; `history: false` would be silently ignored and cause double-registration |
| UndoRedo from `@tiptap/extensions` | v3 consolidated package; `@tiptap/extension-history` is a v2 package and is NOT installed |
| renderHTML stubs with empty `style=""` | Phase 1 establishes the `style=` contract; Phase 7 fills in values — changing strategy after Phase 7 would require rewriting all extensions |

---

## Verification Results

```
✓ pnpm --filter ./apps/client exec tsc --noEmit   → exit 0
✓ DRAG_TYPES has 4 values: LAYOUT_CARD, ELEMENT_CARD, CANVAS_ROW, CANVAS_ELEMENT
✓ ACCEPT_CONSTRAINTS present with CANVAS_SECTION_LIST and COLUMN_SLOT keys
✓ emailSafeExtensions exported from @tiptap/extensions (UndoRedo, Placeholder)
✓ undoRedo: false in StarterKit.configure
✓ No import statement from @tiptap/extension-history
✓ No class= attributes in non-comment code
```

---

## Deviations from Plan

None — plan executed exactly as written. Comment in extensions.ts mentions `@tiptap/extension-history` in a warning context (explaining NOT to use it); this is per the plan's exact code and does not represent an actual import.

---

## Known Stubs

| File | Stub | Phase to resolve |
|------|------|-----------------|
| `apps/client/src/editor/extensions.ts` | renderHTML stubs have empty `style=""` values (Bold, Italic, Color, TextAlign not yet extended) | Phase 7 (RichTextEditor implementation) |

These stubs are intentional per plan design — the `style=` contract is established now; Phase 7 fills in the style values when building the RichTextEditor component.

---

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| CC-2 enforced | apps/client/src/editor/extensions.ts | T-05-01 mitigated: all renderHTML overrides use `style=""` only; no `class=` attributes in non-comment code |

---

## Self-Check: PASSED

- `apps/client/src/dnd/types.ts` — FOUND ✓
- `apps/client/src/editor/extensions.ts` — FOUND ✓
- Commit `0a3c6f1` — FOUND in git log ✓
- Commit `2e609c4` — FOUND in git log ✓
- `tsc --noEmit` exit 0 ✓
