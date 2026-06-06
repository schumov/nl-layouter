---
phase: 01-foundation-and-stack-setup
plan: "04"
subsystem: types
tags: [typescript, vitest, newsletter, discriminated-union, type-guards]

dependency_graph:
  requires:
    - phase: 01-01
      provides: apps/client scaffolded with vitest in devDependencies
  provides:
    - apps/client/src/types/newsletter.ts (canonical NewsletterDoc type system with all 5 element types)
    - apps/client/vitest.config.ts (vitest config with typecheck enabled for test-d.ts)
    - apps/client/src/types/__tests__/newsletter.test-d.ts (7 type-level assertions)
  affects:
    - 01-05 (DnD constants — imports ElementUnion for typed drag payloads)
    - 02 (Newsletter CRUD — imports NewsletterDoc for API request/response types)
    - 03 (Canvas Shell — imports Section, ColumnSlot, ElementUnion for canvas state)
    - all phases 4-9 (every phase that touches canvas elements imports from newsletter.ts)

tech-stack:
  added:
    - vitest 3.2.6 (already in devDeps; wired via vitest.config.ts)
  patterns:
    - "Discriminated union on `type` field — exhaustive switch with assertNeverElement in default case"
    - "Type guard functions (isImageElement, isDividerElement, etc.) for conditional rendering"
    - "test-d.ts convention for vitest type-level tests using expectTypeOf"
    - "import type — all cross-module type usage uses type-only imports"

key-files:
  created:
    - apps/client/src/types/newsletter.ts
    - apps/client/vitest.config.ts
    - apps/client/src/types/__tests__/newsletter.test-d.ts
  modified: []

key-decisions:
  - "DividerElement explicitly added to ElementUnion (ARCHITECTURE.md listed only 4 types; REQUIREMENTS.md ELEM-09 confirms 5th is required)"
  - "Section (not Row) and ColumnSlot (not Slot) field names match ROADMAP naming conventions"
  - "assertNeverElement exported from newsletter.ts so all switches import the same exhaustiveness helper"
  - "Type-only imports enforced — all consumers use `import type { ... } from './types/newsletter'`"

patterns-established:
  - "Pattern: All element rendering code uses switch(el.type) + assertNeverElement default"
  - "Pattern: Phase 1 types file is the single source of truth — no duplicating interfaces elsewhere"

requirements-completed: []  # Infrastructure phase — no v1 requirements mapped to Phase 1

duration: 7min
completed: 2026-06-06
---

# Phase 1 Plan 04: NewsletterDoc Type System Summary

**Complete TypeScript discriminated union for all 5 newsletter element types (image, image-link, button, rich-text, divider) with type guards, exhaustive switch helper, and vitest type-level tests proving correctness.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-06T05:49:15Z
- **Completed:** 2026-06-06T05:56:00Z
- **Tasks:** 2 (RED + GREEN)
- **Files created:** 3

## Accomplishments

- `newsletter.ts` exports the complete `NewsletterDoc` type system — the single source of truth for all phases 2–9
- `DividerElement` (with `color`, `spacing`, `thickness`) explicitly added — absent from ARCHITECTURE.md but required by REQUIREMENTS.md ELEM-09; adding it now prevents a breaking type change in Phase 7
- `assertNeverElement` exported for exhaustive switch enforcement — TypeScript will fail at compile time if any element type is unhandled
- 5 type guard functions (`isImageElement`, `isImageLinkElement`, `isButtonElement`, `isRichTextElement`, `isDividerElement`) provide ergonomic narrowing
- Vitest config established with `typecheck.enabled: true` for `test-d.ts` type-level assertions

## TDD Gate Compliance

| Gate | Status | Commit |
|------|--------|--------|
| RED (test commit) | ✅ | 069a7cb |
| GREEN (feat commit) | ✅ | 79bda5a |
| REFACTOR | N/A — no cleanup needed |

**RED phase note:** Vitest typecheck mode treats `import type` from a missing module as `any` (tests pass trivially). The true RED state was confirmed via direct `tsc --ignoreConfig` which returned `TS2307: Cannot find module '../newsletter'` as expected. After implementing `newsletter.ts`, both vitest and tsc exit 0 with real, non-trivial type assertions.

## Task Commits

1. **Task 1 (RED): Write failing type tests + vitest config** — `069a7cb` (test)
2. **Task 2 (GREEN): Implement newsletter.ts** — `79bda5a` (feat)

## Files Created/Modified

- `apps/client/src/types/newsletter.ts` — 160-line canonical type system: LayoutType, 5 element interfaces, ElementUnion, TiptapJSONDoc, ColumnSlot, Section, HeaderConfig, FooterConfig, GlobalStyles, NewsletterDoc, 5 type guards, assertNeverElement
- `apps/client/vitest.config.ts` — Vitest config with `environment: node`, includes `test-d.ts` files, `typecheck.enabled: true`
- `apps/client/src/types/__tests__/newsletter.test-d.ts` — 7 type-level assertions: ElementUnion covers divider, Extract<ElementUnion, {type:'divider'}> not never, exhaustive switch compiles, NewsletterDoc.rows is Section[], Section.slots is ColumnSlot[], ColumnSlot.element is ElementUnion|null, DividerElement fields

## Decisions Made

- **DividerElement added to ElementUnion:** ARCHITECTURE.md lists only 4 element types. REQUIREMENTS.md ELEM-09 and the research Pitfall 4 both confirm DividerElement is required. Added now to prevent a Phase 7 breaking change that would cascade through all exhaustive switches.
- **`Section`/`ColumnSlot` naming:** Used these names (not `Row`/`Slot`) to match ROADMAP naming conventions throughout the codebase.
- **`assertNeverElement` from newsletter.ts:** Single shared helper — all exhaustive switches across all phases import the same function.

## Deviations from Plan

**None** — plan executed exactly as written.

**TDD note:** The RED phase behaved differently than typical TDD — vitest typecheck gave trivially-passing results for the missing-module case. This is expected behavior for `test-d.ts` files and was confirmed via direct tsc. The GREEN phase assertions are fully meaningful (real types, not `any`).

## Issues Encountered

- **Vitest typecheck + missing module:** During RED phase, vitest treated `import type { ... } from '../newsletter'` as `any` when the module was absent, causing all 7 type tests to pass trivially. Investigated, confirmed via `tsc --ignoreConfig` that the true RED state exists (`TS2307`). No fix needed — this is a known vitest typecheck limitation with missing modules. After GREEN implementation, all assertions are non-trivial and meaningful.

## Known Stubs

None — `newsletter.ts` is a pure type definition file with no runtime data. Type guards are fully implemented.

## Threat Flags

None — pure TypeScript type definitions; no network endpoints, auth paths, or JSONB deserialization in this plan (T-04-01 and T-04-02 accepted as noted in plan threat model; Zod schemas will be added in Phase 2).

## Next Phase Readiness

- ✅ `NewsletterDoc`, `Section`, `ColumnSlot`, `ElementUnion`, `DividerElement` all exported and ready for import
- ✅ All 7 type-level tests pass; `tsc --noEmit` exits 0
- ✅ `assertNeverElement` available for any exhaustive switch across all future phases
- Plan 01-05 (DnD types/constants) can now use `ElementUnion` for typed drag payload definitions
- Phase 2 (Newsletter CRUD) can import `NewsletterDoc` for API types

---
*Phase: 01-foundation-and-stack-setup*
*Completed: 2026-06-06*

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `apps/client/src/types/newsletter.ts` exists | ✅ |
| `apps/client/vitest.config.ts` exists | ✅ |
| `apps/client/src/types/__tests__/newsletter.test-d.ts` exists | ✅ |
| `.planning/phases/01-foundation-and-stack-setup/01-04-SUMMARY.md` exists | ✅ |
| RED commit `069a7cb` exists | ✅ |
| GREEN commit `79bda5a` exists | ✅ |
| `pnpm --filter ./apps/client test --run` exits 0 | ✅ 14 tests pass |
| `pnpm --filter ./apps/client exec tsc --noEmit` exits 0 | ✅ |
| `newsletter.ts` contains `DividerElement` interface | ✅ |
| `newsletter.ts` contains `| DividerElement` in ElementUnion | ✅ |
| `newsletter.ts` line count ≥ 80 | ✅ 160 lines |
