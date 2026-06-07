# Phase 2: Newsletter CRUD & Dashboard - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create, name, list, open, rename, delete, and auto-save newsletters through a working REST API and dashboard UI. This phase delivers: the `newsletters` DB table, all 6 CRUD API routes, TanStack Query hooks, the dashboard page (card grid), the builder page shell (BuilderHeader only — canvas comes in Phase 3), and auto-save with debounce.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Card Grid
- **D-01:** Each `NewsletterCard` shows: **title + last-saved timestamp + section count** (section count = `doc.rows.length`, gives users a quick sense of document size)
- **D-02:** Card actions exposed via **hover → ⋮ menu** with Rename and Delete items (clean default state; actions discoverable on hover)
- **D-03:** Grid is **responsive** — 1 column mobile → 2 columns tablet → 3 columns desktop (Tailwind `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- **D-04:** Empty state: **centered placeholder + "Create your first newsletter" CTA button** (friendly onboarding, displayed when `GET /newsletters` returns an empty array)

### Create Newsletter Flow
- **D-05:** Create dialog requires the user to **type a name** — no "Untitled" default. The Create button is disabled until the name field is non-empty.
- **D-06:** On successful `POST /newsletters`, **navigate directly to `/newsletters/:id`** (builder opens immediately; user starts editing without returning to dashboard)
- **D-07:** Initial `NewsletterDoc` on creation:
  ```json
  {
    "header": { "presetId": "infineon-default", "variables": {} },
    "footer": { "presetId": "infineon-default", "variables": {} },
    "rows": [],
    "globalStyles": {
      "fontFamily": "Arial, sans-serif",
      "backgroundColor": "#f4f4f4",
      "contentWidth": 600,
      "primaryColor": "#0066cc"
    }
  }
  ```
- **D-08:** Header and footer are **fixed single Infineon brand design** — global constants, hardcoded in the renderer. No user selection of presets.
  - Header contains: logo, company title, subtitle, header picture (all constant values)
  - Footer contains: "Copyright Infineon Technologies AG", current year, links to all Infineon social media channels
  - These are rendered by the Phase 8 renderer; Phase 2 simply stores `presetId: "infineon-default"` as a placeholder

### Auto-save UX
- **D-09:** On save error: show **"Save failed" indicator** in BuilderHeader + **auto-retry after 5 seconds** (silent recovery, no toast spam)
- **D-10:** **No indicator during initial load** — save status indicator only appears after the user makes their first edit in the session
- **D-11:** "Saved ✓" text **fades out after 3 seconds** after a successful save

### BuilderHeader Composition
- **D-12:** BuilderHeader bar contains (left to right): **← back arrow** (navigate to `/newsletters`) | **click-to-edit title** (center) | **Saving… / Saved ✓ / Save failed indicator** | **Export button** (right-aligned)
- **D-13:** Rename UX: clicking the title in the header **turns it into an `<input>`**; pressing Enter or blurring sends `PATCH /newsletters/:id`; the updated name is reflected in the dashboard card (via TanStack Query cache invalidation)
- **D-14:** Export button is **enabled but shows a toast** "Export is not yet available" when clicked — Phase 9 replaces this with real export logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 2 plans (8 tasks with done-when criteria)
- `.planning/REQUIREMENTS.md` — NL-01 through NL-06 (the 6 requirements this phase covers)

### Type System (Phase 1 — locked)
- `apps/client/src/types/newsletter.ts` — `NewsletterDoc`, `HeaderConfig`, `FooterConfig`, `GlobalStyles`, `Section`, `ElementUnion` — THE canonical data model; Phase 2 must not rename or restructure
- `apps/client/src/store/useNewsletterStore.ts` — Zustand store with `setDoc`, `clearDoc`, `selectedElementId` — Phase 2 wires `setDoc` to TanStack Query on open

### Client Setup (Phase 1 — partially placeholder)
- `apps/client/src/main.tsx` — QueryClient (staleTime 1 min, retry 1) + routes `/newsletters` and `/newsletters/:id` are placeholder stubs Phase 2 replaces

### Server Setup (Phase 1 — scaffold)
- `apps/server/src/index.ts` — Fastify server with CORS + cookie plugins; Phase 2 registers newsletter routes here
- `apps/server/src/db/schema.ts` — Empty Phase 1 placeholder; Phase 2 adds `newsletters` table
- `apps/server/src/db/connection.ts` — Drizzle DB connection; import in Phase 2 route handlers

### Architecture Decisions
- `.planning/STATE.md` — Locked decisions table (Drizzle ORM, JSONB storage, `NewsletterDoc` shape, stack versions)
- `.planning/phases/01-foundation-and-stack-setup/01-RESEARCH.md` — Drizzle patterns, Fastify route registration approach, TanStack Query setup

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useNewsletterStore.setDoc(doc)` — call this after `GET /newsletters/:id` resolves to load the document into canvas state
- `useNewsletterStore.clearDoc()` — call this when navigating back to the dashboard to clear stale canvas state
- `QueryClient` in `main.tsx` — already configured; Phase 2 hooks use `useQuery` / `useMutation` without additional setup
- `apps/client/src/lib/utils.ts` — shadcn/ui `cn()` utility available for class composition in dashboard/header components

### Established Patterns
- Fastify route registration: `server.get('/health', ...)` pattern in `index.ts` — newsletter routes follow the same inline-registration or plugin-module pattern
- Drizzle schema uses `export {}` placeholder — replace with real table definitions using `pgTable`, `uuid`, `text`, `jsonb`, `timestamp` columns
- React Router v7 **library mode** (`createBrowserRouter` + `RouterProvider`) — replace placeholder `element` props with real page components
- TanStack Query `staleTime: 1000 * 60` default — newsletters list may want a shorter staleTime or manual invalidation after mutations

### Integration Points
- Route `/newsletters` → replace placeholder div with `DashboardPage` component
- Route `/newsletters/:id` → replace placeholder div with `BuilderPage` component (this phase adds BuilderHeader only; Phase 3 adds the canvas)
- `POST /newsletters` → success → `navigate('/newsletters/:id')` using `useNavigate()` from react-router
- `PATCH /newsletters/:id` (rename) → success → invalidate `['newsletters']` and `['newsletter', id]` query keys so dashboard card updates
- `DELETE /newsletters/:id` → success → optimistic removal from `['newsletters']` list + undo toast

</code_context>

<specifics>
## Specific Requirements

- **Infineon header** (fixed, hardcoded): logo, company title, subtitle, header picture — values are brand constants, not user-configurable
- **Infineon footer** (fixed, hardcoded): "Copyright Infineon Technologies AG [current year]" + links to all Infineon social media channels
- **Section count on card**: computed from `doc.rows.length` — requires the API to return the `document` JSONB (or at least `rows.length`) in the list endpoint response. Consider returning `{ id, title, updatedAt, sectionCount }` from `GET /newsletters` (lean list response) rather than full documents.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 8 scope revision:** Header/footer are fixed Infineon brand constants (not selectable presets). Phase 8's goal should be updated from "Header/Footer Presets & Pre-header" to "Header/Footer Renderer & Pre-header" — it implements the fixed Infineon header/footer rendering and pre-header text field, but has no preset-selection UI. Note this when running `/gsd-discuss-phase 8`.
- **Lean list API response:** `GET /newsletters` returning `sectionCount` instead of full JSONB requires a DB-level `jsonb_array_length` query or a computed column — defer the optimization decision to Phase 2 planning. Planner should evaluate full-doc vs. lean list.

</deferred>

---

*Phase: 2 — Newsletter CRUD & Dashboard*
*Context gathered: 2026-06-07*
