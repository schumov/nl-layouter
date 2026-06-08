# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-07)

**Core value:** Users can build a fully structured, export-ready HTML newsletter without writing any code.
**Current focus:** Phase 5 — DnD Element Placement

---

## Active Phase

**Phase 5: DnD — Element Placement**

Goal: Users can drag element types from the palette into any column slot, remove elements from slots, and replace an element by dropping a new type.

---

## Workflow

| Setting | Value |
|---------|-------|
| Mode | YOLO |
| Granularity | Fine |
| Parallelization | Parallel |
| Research | Enabled |
| Plan Check | Enabled |
| Verifier | Enabled |
| Nyquist Validation | Enabled |
| Auto Advance | Disabled |

---

## Status

**Phase 1 Verified ✅** — All 7 plans executed + smoke test passed + verification report written
**Phase 2 Verified ✅** — All 9 plans executed, UAT 12/13 passed (1 skipped: auto-save pending Phase 3 canvas), CORS fix applied
**Phase 3 Verified ✅** — All 4 plans executed, 15 tests passing, two-panel layout + 5 layout types verified
**Phase 4 Verified ✅** — All 7 plans executed, 30 tests passing, DnD row-level operations fully wired
**Phase 5 Executed ✅** — All 6 plans executed, 46 tests passing, element placement + InspectorPanel + canvas click deselect wired

---

## Current Position

```
Phase  5 / 9  ████████████████░░░░  ~55% (Phase 5 executed ✅ — awaiting verification)
Plan   6 / 6  (all plans complete)
Status Phase 5 — executed, pending verification
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 9 |
| Phases complete | 4 ✅ |
| Requirements mapped | 40 / 40 |
| Plans created | 31 |
| Plans complete | 33 |

---

## Accumulated Context

### Architecture Decisions Locked

| Decision | Rationale | Phase Locked |
|----------|-----------|--------------|
| `NewsletterDoc` JSONB — never store HTML | HTML cannot be re-parsed into canvas state | Phase 1 |
| TipTap inline-style `renderHTML` — no CSS classes | Gmail + Outlook strip `<style>` and `class=` | Phase 1 |
| DnD `DRAG_TYPES` enum with typed `accept` constraints | Prevents collision conflicts in nested containers | Phase 1 |
| Table-based export HTML (react-email Row/Column) | Outlook Word engine has zero flex/grid support | Phase 9 |
| `juice` CSS inliner on every export | Gmail strips `<head><style>` entirely | Phase 9 |
| Drizzle ORM (not Prisma) | No codegen step; TypeScript-native; lighter runtime | Phase 1 |
| Better Auth for v2 auth (v1 is single-user, no login) | Database sessions > stateless JWT for this use case | v2 |
| One active TipTap editor instance; static-renderer for rest | 20+ ProseMirror instances = 500 ms+ lag | Phase 7 |
| GET /health response schema locked to `{status: string}` only | No env info, uptime, or version exposed (T-02-01) | Phase 1 |
| `DividerElement` explicitly in `ElementUnion` — 5th type missing from ARCHITECTURE.md | REQUIREMENTS.md ELEM-09 requires it; Phase 7 depends on it; adding in Phase 1 prevents breaking change | Phase 1 |
| `Section`/`ColumnSlot` naming (not `Row`/`Slot`) | Matches ROADMAP naming conventions throughout codebase | Phase 1 |
| `assertNeverElement` exported from `newsletter.ts` | Single exhaustiveness helper for all phases' switch statements | Phase 1 |
| `drizzle.config.ts` excluded from `tsconfig.json` include — `rootDir=./src` conflict | drizzle-kit runs its own TS transpilation (esbuild); file works with CLI, tsc not needed | Phase 1 |

### Critical Constraints (from research)

- **CC-1**: `NewsletterDoc` as JSONB — never HTML, never per-element relational rows
- **CC-2**: TipTap `renderHTML` emits `style=""` only — configure at extension creation, not export time
- **CC-3**: Export renderer uses `<table>` + `<td>` — react-email Row/Column primitives
- **CC-4**: `juice` runs on every export — no `<style>` blocks in final HTML
- **CC-5**: DnD type/accept architecture defined in Phase 1 — 4 drag types, typed accept on every droppable
- **CC-6**: All export HTML dimensions in `px` — `rem`/`em`/`vh` have zero Outlook support
- **CC-7**: XHTML DOCTYPE + VML namespaces on every exported file

### Stack Versions (verified 2026-06-05)

| Package | Version |
|---------|---------|
| React | 19.2.7 |
| TypeScript | 6.0.3 |
| Vite | 8.0.16 |
| Tailwind CSS | 4.3.0 |
| react-router | 7.17.0 |
| Zustand | 5.0.14 |
| @tanstack/react-query | 5.101.0 |
| @tiptap/react | 3.26.0 |
| @dnd-kit/core | 6.3.1 |
| @dnd-kit/sortable | 10.0.0 |
| Fastify | 5.8.5 |
| drizzle-orm | 0.45.2 |
| postgres.js | 3.4.9 |
| better-auth | 1.6.14 |
| zod | 4.4.3 |
| juice | 12.1.0 |

### Open Questions

1. **react-email version** — STACK.md does not pin a version. Resolve during Phase 9 planning (research recommended for export phase).
2. **Better Auth session vs JWT** — ARCHITECTURE.md references JWT; STACK.md recommends Better Auth database sessions. No conflict in v1 (no auth), but decide integration pattern before v2.
3. **Undo/redo state** — Deferred to v2, but Zustand + Immer + flat ID map supports history stacks. Confirm approach before finalising Phase 1 store shape.

### Todos

- [ ] Confirm `react-email` version during Phase 9 research
- [ ] Pin fractional-indexing library version if section ordering needs it (PITFALL CRITICAL-4)

### Blockers

*(none)*

---

## Session Continuity

Last updated: 2026-06-10 (Phase 5 executed — all 6 plans complete)
Next action: Run /gsd-verify-work 5 to verify phase goal

### Phase Dependency Chain

```
Phase 1 (Foundation)
  └── Phase 2 (Newsletter CRUD)
        └── Phase 3 (Canvas Shell)
              └── Phase 4 (DnD Rows)
                    └── Phase 5 (DnD Elements)
                          ├── Phase 6 (Image + Button)
                          │     └── Phase 7 (Rich Text + Divider)
                          └── Phase 8 (Header/Footer Presets)  [parallel with 6-7]
                                └── Phase 9 (Export Pipeline)
```

Phases 6, 7, and 8 all depend on Phase 5. Phases 6 and 8 may be worked in parallel. Phase 9 depends on all preceding phases.

