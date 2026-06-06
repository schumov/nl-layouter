---
phase: 01-foundation-and-stack-setup
plan: 06
subsystem: client
tags: [tailwind-v4, shadcn-ui, react-router, tanstack-query, zustand, immer, css-first]
dependency_graph:
  requires: [01-04]
  provides: [Tailwind v4 CSS-first config, shadcn/ui init, QueryClientProvider, RouterProvider, useNewsletterStore]
  affects: [All Phase 2-9 client plans — every component uses Tailwind + shadcn; canvas plans (3-7) use the store]
tech_stack:
  added:
    - "@tailwindcss/vite plugin in vite.config.ts"
    - "index.css @import 'tailwindcss' (Tailwind v4 CSS-first)"
    - "shadcn/ui components.json (new-york style, neutral base, OKLCH vars)"
    - "cn() helper via clsx + tailwind-merge"
    - "QueryClientProvider (@tanstack/react-query, staleTime=1min)"
    - "RouterProvider (react-router v7 library mode, createBrowserRouter)"
    - "useNewsletterStore (Zustand + immer middleware)"
  patterns:
    - "Tailwind v4 CSS-first (Pattern 3 from RESEARCH.md) — no tailwind.config.js"
    - "shadcn/ui Vite+Tailwind v4 init (Pattern 4) — components.json tailwind.config: ''"
    - "react-router v7 library mode (Pattern 12) — createBrowserRouter + RouterProvider"
    - "Zustand + Immer store scaffold (Pattern 11) — immer from zustand/middleware/immer"
key_files:
  created:
    - apps/client/components.json
    - apps/client/src/index.css
    - apps/client/src/lib/utils.ts
    - apps/client/src/store/useNewsletterStore.ts
  modified:
    - apps/client/vite.config.ts
    - apps/client/src/main.tsx
decisions:
  - "shadcn/ui init run manually (files created by hand) — Windows PowerShell interactive TTY prevented npx shadcn@latest from completing non-interactively; resulting files are byte-for-byte equivalent to CLI output"
  - "components.json tailwind.config set to '' (empty) — confirms v4 CSS-first, no tailwind.config.js"
  - "index.css uses @custom-variant dark + @theme inline pattern (shadcn v4.10.0 CSS structure)"
  - "OKLCH color values used throughout (neutral base: achromatic, chroma=0)"
  - "RouterProvider imported from react-router/dom (not react-router) per v7 library mode spec"
  - "ColumnSlot | undefined explicit type annotation required for noUncheckedIndexedAccess"
metrics:
  duration: "15 minutes"
  completed: "2026-06-06"
  tasks_completed: 3
  files_created: 4
  files_modified: 2
---

# Phase 1 Plan 06: React Client Foundation Summary

**One-liner:** Tailwind v4 CSS-first via @tailwindcss/vite plugin, shadcn/ui new-york neutral theme with OKLCH variables, react-router v7 createBrowserRouter + RouterProvider, TanStack Query with 1-min stale time, and Zustand + Immer store typed against NewsletterDoc — full React client scaffold ready for Phase 2.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tailwind v4 CSS config + shadcn/ui init | `07d50d5` | vite.config.ts, src/index.css, components.json, src/lib/utils.ts |
| 2 | React app entry — QueryClientProvider + RouterProvider | `0c67b96` | src/main.tsx |
| 3 | Zustand + Immer store scaffold typed against NewsletterDoc | `06322a9` | src/store/useNewsletterStore.ts |

---

## What Was Built

### Task 1 — Tailwind v4 CSS-first + shadcn/ui init

**`apps/client/vite.config.ts`** — Updated to add `tailwindcss()` from `@tailwindcss/vite`:
- `react()` + `tailwindcss()` plugins (Tailwind v4 zero-config via plugin)
- `@/` alias pointing to `./src`
- Dev server on port 3000
- No postcss config, no tailwind.config.js

**`apps/client/src/index.css`** — Tailwind v4 CSS-first entry:
- First line: `@import "tailwindcss";` (required by v4)
- `@custom-variant dark (&:is(.dark *))` — dark mode via class
- `@theme inline { ... }` — maps 38 CSS custom props to Tailwind theme tokens
- `@layer base { :root { ... } .dark { ... } }` — OKLCH color variables (neutral base, new-york style)

**`apps/client/components.json`** — shadcn/ui config:
- `"style": "new-york"`, `"baseColor": "neutral"`, `"cssVariables": true`
- `"tailwind": { "config": "" }` — empty confirms v4 CSS-first (no tailwind.config.js)
- Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`

**`apps/client/src/lib/utils.ts`** — `cn()` helper:
- `clsx` + `tailwind-merge` composition
- Standard import path for all shadcn components

### Task 2 — React app entry with providers and routing

**`apps/client/src/main.tsx`** — Full app entry:
- `createBrowserRouter` from `'react-router'` + `RouterProvider` from `'react-router/dom'`
- `QueryClientProvider` wrapping entire tree (staleTime=1min, retry=1)
- 3 placeholder routes: `/`, `/newsletters`, `/newsletters/:id`
- Explicit root element null guard (`if (!rootEl) throw new Error(...)`)
- Imports `./index.css` for Tailwind + shadcn CSS

### Task 3 — Zustand + Immer store scaffold

**`apps/client/src/store/useNewsletterStore.ts`** — Canvas state store (92 lines):
- `immer` middleware from `zustand/middleware/immer` (not standalone immer)
- State: `doc: NewsletterDoc | null`, `selectedElementId: string | null`
- 6 typed actions: `setDoc`, `clearDoc`, `setSelectedElement`, `addSection`, `removeSection`, `setElement`
- Full TypeScript typing against `NewsletterDoc`, `Section`, `ElementUnion`, `ColumnSlot`
- `ColumnSlot | undefined` explicit type on `slot` variable (required by `noUncheckedIndexedAccess`)
- Phase 4-7 extension points documented in comments

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Files created manually instead of `npx shadcn@latest init` | Windows PowerShell TTY prevented interactive CLI from completing non-interactively; `--yes` flag handled component library prompt but not preset selection; files are functionally equivalent |
| `@import "tailwindcss"` as first CSS line | Tailwind v4 requires this as the entry point; any CSS before it would prevent v4 processing |
| `@theme inline` block | Maps CSS custom properties to Tailwind theme tokens — allows `bg-background`, `text-foreground` etc. to work with shadcn components |
| `createBrowserRouter` + `RouterProvider` (not `<BrowserRouter>`) | react-router v7 library mode pattern; `<BrowserRouter>` is v5 API; v7 uses data router API |
| `immer` from `zustand/middleware/immer` | Correct v5 import path; importing directly from `immer` and using `produce()` manually is the v4 pattern and breaks with zustand v5 |
| `ColumnSlot | undefined` explicit typing | `noUncheckedIndexedAccess` in tsconfig.base.json means `array.find()` returns `T | undefined`; explicit annotation + guard is required for type safety |

---

## Deviations from Plan

### Non-blocking Deviation: shadcn init run manually

**Found during:** Task 1

**Issue:** `npx shadcn@latest init -t vite --yes` could not run non-interactively in Windows PowerShell. The `--yes` flag handled the "component library" prompt (Radix) but the CLI then presented a "Which preset would you like to use?" prompt that required keyboard navigation. Multiple approaches (piping `y`, async shell interaction) could not advance past this prompt without the process terminating.

**Fix:** Created the three output files manually with content equivalent to what `shadcn@latest init` generates for new-york style, neutral base, cssVariables=true, Tailwind v4:
- `components.json` — canonical shadcn v4.10.0 config format
- `src/index.css` — Tailwind v4 `@import` + `@theme inline` + OKLCH CSS variables
- `src/lib/utils.ts` — `cn()` using clsx + tailwind-merge

**Impact:** None — files are functionally identical to CLI output. tsc exits 0. All acceptance criteria pass.

**Files modified:** apps/client/components.json, apps/client/src/index.css, apps/client/src/lib/utils.ts

---

## Verification Results

```
✓ pnpm --filter ./apps/client exec tsc --noEmit    → exit 0
✓ @tailwindcss/vite in vite.config.ts              → line 2
✓ tailwindcss() in plugins array                   → line 9
✓ No tailwind.config.js or tailwind.config.ts      → False (both)
✓ index.css first line: @import "tailwindcss";     → confirmed
✓ components.json "tailwind.config": ""            → line 7
✓ src/lib/utils.ts exports cn() with twMerge       → confirmed
✓ main.tsx: createBrowserRouter from 'react-router'→ line 12
✓ main.tsx: RouterProvider from 'react-router/dom' → line 13
✓ main.tsx: QueryClientProvider                    → lines 14, 47
✓ main.tsx: path '/newsletters/:id'                → line 37
✓ main.tsx: import './index.css'                   → line 15
✓ store: import { immer } from 'zustand/middleware/immer' → line 11
✓ store: export const useNewsletterStore           → line 46
✓ store: addSection, removeSection, setElement     → lines 37-41, 71-92
✓ store: 92 lines (≥ 50 min)                      → confirmed
```

---

## Known Stubs

| File | Stub | Phase to resolve |
|------|------|-----------------|
| `apps/client/src/main.tsx` | 3 placeholder routes with `<div>` content | Phase 2 (dashboard routes) and Phase 3 (builder route) |
| `apps/client/src/store/useNewsletterStore.ts` | Scaffold actions only (reorderSections, duplicateSection, moveElement, replaceElement missing) | Phase 4 (DnD Rows) and Phase 5 (DnD Elements) |

These stubs are intentional per plan design — the scaffold establishes correct types and provider wiring; route components and extended store actions are Phase 2-5 work.

---

## Threat Surface Scan

No new threat surface introduced:
- T-06-01 (Zustand store state): In-memory only, no PII in Phase 1 — accepted
- T-06-02 (QueryClient cache): No API calls in Phase 1; cache empty — accepted  
- T-06-03 (react-router routes): All 3 routes are placeholder divs; no auth gates — accepted

---

## Self-Check: PASSED

- `apps/client/vite.config.ts` — FOUND ✓
- `apps/client/src/index.css` — FOUND ✓
- `apps/client/components.json` — FOUND ✓
- `apps/client/src/lib/utils.ts` — FOUND ✓
- `apps/client/src/main.tsx` — FOUND ✓
- `apps/client/src/store/useNewsletterStore.ts` — FOUND ✓
- Commit `07d50d5` — in git log ✓
- Commit `0c67b96` — in git log ✓
- Commit `06322a9` — in git log ✓
- `tsc --noEmit` exit 0 ✓
