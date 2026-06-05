# Research Summary — NL Layouter

**Synthesized:** 2026-06-05  
**Sources:** STACK.md · FEATURES.md · ARCHITECTURE.md · PITFALLS.md  
**Overall Confidence:** HIGH (all stack versions live-verified; email compatibility rules validated against caniemail.com and MJML source)

---

## Executive Summary

NL Layouter is a visual HTML email builder — a category with well-understood patterns and well-documented failure modes. The core architectural insight is that the **builder canvas and the exported HTML are completely separate artifacts**: the canvas runs as a modern React SPA (flexbox, Tailwind, rich browser APIs), while the exported HTML must be a table-based, inline-styled document engineered for 2003-era rendering constraints imposed by Outlook's Word engine and Gmail's CSS stripping. Every major pitfall in this domain stems from blurring this boundary — using CSS classes in TipTap output that email clients strip, generating flex/grid layouts that Outlook collapses, or saving rendered HTML to the DB instead of a structured JSON document.

The recommended approach is a three-layer system: a React SPA (Zustand + dnd-kit + TipTap) for the editor, a Fastify REST API for persistence and export orchestration, and an HTML rendering pipeline (react-email + juice) that converts the canonical JSON document model into email-compatible HTML on demand. The canonical document — a `NewsletterDoc` JSON stored as a single JSONB column — is the system's spine: everything in the builder reads from it, every export is generated from it, nothing else is stored. This model is incompatible with retrofitting; it must be correct from Phase 1.

The stack is fully verified against live npm registries and official documentation. The most consequential version-specific finding is that **TipTap is now at v3 (3.26.0)**, not v2 — with significant package restructuring that must be accounted for from day one. All other stack choices (Drizzle over Prisma, Better Auth over Lucia, Fastify over Express/NestJS, dnd-kit over React DnD) have clear rationale and no credible competing alternatives for this use case.

---

## Key Findings

### 1. Two-Artifact Rule: Canvas HTML ≠ Export HTML

The single most important architectural constraint. The canvas uses Tailwind + flexbox for layout (developer-friendly, fully browser-supported). The exported HTML uses nested `<table>` elements with `cellpadding="0"` and MSO conditional comments (Outlook-compatible). These are **never the same markup**. `react-email`'s `<Row>` / `<Column>` / `<Section>` primitives, which compile to table HTML, are the recommended single source of truth for the rendering layer — used in both the export pipeline and the in-builder preview iframe.

### 2. TipTap v3 Has Breaking Package Changes

TipTap is at **v3 (3.26.0)** — not v2. Package structure changed significantly:
- `@tiptap/extensions` is a new consolidated package (replaces individual `@tiptap/extension-focus`, `@tiptap/extension-history`, etc.)
- `BubbleMenu` / `FloatingMenu` imports moved to `@tiptap/react/menus`
- `History` renamed to `UndoRedo`
- Do **not** mix v2 and v3 packages

Additionally, TipTap's default HTML output uses CSS classes (`has-text-align-center`, `has-color-#ff0000`) which are stripped by Gmail and Outlook. Every TipTap extension must be configured with custom `renderHTML` to emit **inline styles only** from Phase 1. This cannot be retrofitted.

### 3. JSON Document Model Is Non-Negotiable from Day 1

The entire newsletter must be stored as a single typed `NewsletterDoc` JSON blob in a PostgreSQL JSONB column — never as HTML, never split into per-row/per-element relational tables. The document is always loaded and saved atomically. HTML export is generated on-demand from the JSON. Violating this design makes the canvas non-loadable from saved state and requires a full persistence rewrite.

### 4. dnd-kit Requires Explicit Type/Accept Constraints

The builder has four distinct drag interaction types (palette layout card, palette element card, canvas section reorder, canvas element move). Using a single `DndContext` without `type` and `accept` guards causes state corruption and unresolvable collision conflicts. The `type`/`accept` system must be designed up front; DnD context architecture is hard to refactor once elements are built.

### 5. Drizzle ORM (Not Prisma) Despite Architecture Doc Using Prisma Syntax

**Note on discrepancy:** ARCHITECTURE.md uses Prisma schema syntax in its examples. STACK.md (live-verified) recommends **Drizzle ORM 0.45.2** instead — no codegen step, lighter runtime, TypeScript-native, serverless-ready. The ARCHITECTURE.md schema patterns translate directly to Drizzle. The roadmap should use Drizzle; treat Prisma schema blocks in ARCHITECTURE.md as pseudocode for the DB shape only.

### 6. Email Compatibility Rules Are a Hard Technical Constraint, Not a Polish Step

Four rules that cannot be deferred:
- **Table-based columns** for multi-column layouts (Outlook Word engine: `display:flex` → `n`, `display:grid` → `n`)
- **Inline CSS only** — `juice` runs on every export (Gmail strips `<head>/<style>` entirely)
- **px units only** in export HTML — `rem`, `em`, `vh`, `vw` have zero Outlook support
- **`width`/`height` as HTML attributes** on `<img>` tags (not CSS-only) — images collapse to 0×0 when blocked otherwise

These must be designed into the export pipeline from the start.

### 7. TipTap Performance Pattern: One Active Editor, Rest Static

Mounting a full TipTap/ProseMirror editor per rich-text element causes visible lag (20 elements = 20 ProseMirror instances). The correct pattern: render non-focused rich text blocks as static HTML via `@tiptap/static-renderer`'s `renderToHTMLString`; mount a single active `<EditorContent>` instance only for the selected element. This decision shapes how the InspectorPanel and ElementRenderer are built.

---

## Recommended Stack

| Layer | Technology | Version | Decision |
|-------|-----------|---------|----------|
| Frontend framework | React | 19.2.7 | ✅ Confirmed |
| Language | TypeScript | 6.0.3 | ✅ Confirmed (strict mode on) |
| Build tool | Vite + @vitejs/plugin-react | 8.0.16 / 6.0.2 | ✅ Confirmed |
| UI CSS | Tailwind CSS (builder UI only) | 4.3.0 | ✅ Confirmed — CSS-first config, no `tailwind.config.js` |
| Routing | react-router | 7.17.0 | ✅ Confirmed (~5 routes, SPA) |
| Canvas state | Zustand + Immer | 5.0.14 | ✅ Confirmed |
| Server state | @tanstack/react-query | 5.101.0 | ✅ Confirmed |
| Drag & Drop | dnd-kit (core/sortable/utilities/modifiers) | 6.3.1 / 10.0.0 / 3.2.2 / 9.0.0 | ✅ Confirmed (independent versioning is intentional) |
| Rich text | TipTap v3 | 3.26.0 | ✅ Confirmed — **v3 not v2** |
| UI components | shadcn/ui (CLI) + Radix UI | n/a / latest | ✅ Confirmed |
| Icons | lucide-react | 1.17.0 | ✅ Confirmed |
| Backend | Fastify | 5.8.5 | ✅ Confirmed |
| ORM | Drizzle ORM + drizzle-kit | 0.45.2 / 0.31.10 | ✅ Confirmed (Architecture doc uses Prisma syntax — treat as pseudocode) |
| DB driver | postgres.js | 3.4.9 | ✅ Confirmed |
| Database | PostgreSQL | 16+ | ✅ Confirmed |
| Auth | Better Auth | 1.6.14 | ✅ Confirmed (database sessions, not JWT) |
| Validation | Zod | 4.4.3 | ✅ Confirmed |
| Email rendering | react-email | latest | ✅ Confirmed — Row/Column/Section → table HTML |
| CSS inliner | juice | 12.1.0 | ✅ Confirmed |

**Dropped alternatives:** React Beautiful DnD (discontinued), Prisma (codegen overhead), Lucia (too minimal), MJML (wrong abstraction for a visual builder), NestJS (overkill for ~10 routes).

---

## Table Stakes Features

Must ship in v1 or the tool is unusable:

1. **Auth** — register, login, user-scoped newsletters
2. **Newsletter CRUD** — create, name, save, load, list; auto-save with debounce
3. **Drag-and-drop canvas** — palette → canvas (add sections/elements); canvas section reorder; section delete
4. **Layout sections** — 1-col, 2-col, 3-col, small-left/big-right, small-right/big-left
5. **Content elements** — rich text (TipTap, WYSIWYG), image (URL + alt), image-with-link, button (label + href + colors + style)
6. **Named text styles** — Header, Subheader, Body, Code (applied via TipTap textStyle preset)
7. **Element property panel** — padding, background color, element-specific config (right panel / InspectorPanel)
8. **Section background color**
9. **Header / footer preset selection** — per-newsletter, from seeded template set
10. **HTML export** — `POST /newsletters/:id/export` → `.html` file download
11. **Inline CSS export** — juice runs on every export; no `<style>` tags in output
12. **Table-based multi-column layout** — export uses `<table>` + MSO conditional comments
13. **Desktop / mobile preview toggle** — renders export HTML in sandboxed `<iframe>`
14. **Fixed 600px content width** with fluid/responsive mobile behavior

**Strongly recommended for v1 (low complexity, high value):**
- Pre-header text field (hidden `<span>` injection; one text input)
- Divider / spacer element
- Section duplication
- Image alt text field (make required, not optional)

---

## Critical Constraints

Things that cannot be deferred or retrofitted without full rewrites:

### CC-1: JSON Document Model (Phase 1)
Store `NewsletterDoc` as JSONB. Never store HTML. Never split into per-element relational rows. Violating this makes saved newsletters non-loadable.

### CC-2: TipTap Inline-Style Output (Phase 1 — TipTap setup)
Configure every TipTap extension's `renderHTML` to emit inline `style=""` attributes, never CSS classes. Default TipTap output uses classes that Gmail and Outlook strip. This is a source-level configuration; patching at export time is insufficient.

### CC-3: Table-Based Export HTML (Phase — Export Pipeline)
The export renderer must produce `<table>` + `<td>` multi-column layouts. Must include `<!--[if mso]>` conditional table wrappers. react-email's `<Row>` / `<Column>` components handle this automatically. Do not attempt to use the canvas flex layout for export.

### CC-4: CSS Inlining on Every Export (Phase — Export Pipeline)
`juice` must run on every export output. No `<link>` or `<style>` tags in the final `.html` file. Gmail strips them.

### CC-5: DnD Type/Accept Architecture (Phase — DnD Setup)
Establish draggable `type` values (`'layout-card'`, `'row'`, `'element-card'`, `'element'`) and `accept` constraints on droppables before building any DnD interactions. Retrofitting type constraints after interactions are built causes state mutation bugs.

### CC-6: px-Only Measurements in Export (Phase — Export Pipeline + TipTap setup)
All dimensions, font sizes, padding, margins in exported HTML must be `px`. `rem`, `em`, `vh`, `vw` have zero Outlook support. Define a `rem→px` mapping table for the export layer.

### CC-7: DOCTYPE and MSO HTML Tag (Phase — Export Template)
Every exported HTML must use the XHTML transitional DOCTYPE and declare VML namespaces:
```html
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
```
Without this, Outlook silently ignores VML and MSO conditional content.

---

## Watch Out For

### ⛔ PITFALL-1: TipTap default HTML uses CSS classes (CRITICAL)
`editor.getHTML()` emits `<p class="has-text-align-center">` — stripped by Gmail. **Prevention:** Custom `renderHTML` on all extensions from day 1. Use `renderToHTMLString` (static renderer) for export, not `editor.getHTML()`.

### ⛔ PITFALL-2: Flexbox/grid in export HTML (CRITICAL)
Outlook 2007–2019 (Word engine) renders `display:flex` as nothing. **Prevention:** react-email `<Row>/<Column>` components compile to table HTML. Never write flex/grid in the export renderer. Treat export components as an entirely separate component tree from canvas components.

### ⛔ PITFALL-3: Saving HTML to the DB instead of JSON (CRITICAL)
Prevents reloading newsletters into the canvas. **Prevention:** Always `editor.getJSON()` for persistence, `generateHTML()` only at export time. Newsletter document = JSONB. Never `editor.getHTML()` for persistence.

### ⚠️ PITFALL-4: Single DnD context for palette + canvas (SERIOUS)
Causes ghost palette elements and ambiguous drop events. **Prevention:** Use dnd-kit's `type`/`accept` API. Four draggable types, each accepted only by its valid drop targets.

### ⚠️ PITFALL-5: Multiple simultaneous TipTap instances (SERIOUS)
20+ editors = 500ms+ lag, memory leaks on section deletion. **Prevention:** One active editor in InspectorPanel; all other rich-text elements render as static HTML via `@tiptap/static-renderer`. Destroy editor instance on unmount.

### ⚠️ PITFALL-6: Auto-save without debounce (MODERATE)
Every keystroke triggers a PUT request, saturating the DB connection pool. **Prevention:** 1000ms minimum debounce (3000ms recommended) on all auto-save triggers. Show "Saving..." / "Saved" indicator.

### ℹ️ PITFALL-7: Image size via CSS only (SERIOUS)
Outlook ignores CSS `width`/`height` on images; layout collapses when images are blocked. **Prevention:** Always set `width` and `height` as HTML attributes on `<img>` tags in export, alongside inline CSS `max-width: 100%; height: auto;`.

---

## Phase Implications

Research establishes a clear dependency chain. Suggested build order (from ARCHITECTURE.md, validated against PITFALLS.md phase warnings):

### Phase 1 — Foundation: Auth + Project Scaffold
**Delivers:** Working auth (register/login/session), empty newsletter creation, basic shell UI  
**Features:** Auth, newsletter CRUD skeleton, Drizzle schema (users + newsletters JSONB)  
**Key constraint:** Design the `NewsletterDoc` TypeScript types and JSON document model here — even before the canvas. This is the spine of the entire system.  
**Pitfalls to avoid:** CC-1 (JSON model); CC-5 (plan DnD types even if not implemented yet)  
**Research flag:** Standard patterns — no phase research needed

### Phase 2 — Canvas: Read-Only Rendering
**Delivers:** Builder page that renders a hardcoded/static `NewsletterDoc` document visually (no editing yet)  
**Features:** BuilderCanvas, RowBlock, ColumnGrid, ColumnSlot, ElementRenderer (all 4 element types), EmptySlot  
**Rationale:** Proves the TypeScript model and rendering pipeline before adding DnD complexity; forces correct component boundaries early  
**Key constraint:** react-email components for column rendering (not flex)  
**Research flag:** Standard patterns — no phase research needed

### Phase 3 — DnD: Row-Level Operations
**Delivers:** Users can drag layout sections from palette to canvas, reorder them, and delete them  
**Features:** DragDropProvider, palette LayoutCards, SortableRowList, section delete  
**Key constraint:** CC-5 type/accept system; PITFALL-4 (separate drag types); collision priority setup  
**Research flag:** Consider `/gsd-research-phase` — dnd-kit type/accept with nested containers has gotchas documented in PITFALLS.md SERIOUS-1 and SERIOUS-2

### Phase 4 — DnD: Element Placement
**Delivers:** Users can drag elements from palette into column slots; move elements between slots  
**Features:** Palette ElementCards, ColumnSlot droppable, element move  
**Key constraint:** Collision detection priority (column slots rank higher than section; SERIOUS-2)  
**Research flag:** Follows from Phase 3 — standard extension of same patterns

### Phase 5 — Element Editors + TipTap
**Delivers:** Users can select elements and edit their properties (rich text, image URL/alt, button config)  
**Features:** InspectorPanel, ImageEditor, ButtonEditor, RichTextEditor (TipTap)  
**Key constraint:** CC-2 (TipTap inline-style renderHTML); PITFALL-5 (one active editor); PITFALL-1 (inline styles not CSS classes)  
**Research flag:** TipTap v3 configuration for inline-style output is well-documented in PITFALLS.md — follow the `renderHTML` pattern exactly

### Phase 6 — Header/Footer Presets
**Delivers:** Users can select header and footer preset templates per newsletter  
**Features:** Preset seed data, presets API, PresetSelector UI  
**Rationale:** Relatively self-contained; can be slotted before or after Phase 5  
**Research flag:** Standard patterns — no phase research needed

### Phase 7 — HTML Export Pipeline
**Delivers:** Users can export the finished newsletter as a standalone `.html` file  
**Features:** `POST /newsletters/:id/export`, react-email render, juice CSS inliner, DOCTYPE/MSO wrapper, browser download trigger  
**Key constraints:** CC-3 (table-based), CC-4 (juice inlining), CC-6 (px units), CC-7 (DOCTYPE + VML namespaces); MSO reset styles in `<head>`; `width`/`height` attributes on `<img>` tags  
**Research flag:** **Recommend `/gsd-research-phase`** — export pipeline has the most failure modes and requires verifying MSO conditional comment patterns, juice options, and react-email column width rendering

### Phase 8 — Polish + Preview
**Delivers:** Auto-save with indicator, desktop/mobile preview toggle, global styles, pre-header field, section duplication, divider element, empty-state UX  
**Features:** All "strongly recommended for v1" features; iframe preview; auto-save debounce  
**Key constraint:** PITFALL-6 (debounce auto-save); preview iframe must render the exported HTML, not the canvas HTML  
**Research flag:** Standard patterns — no phase research needed

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Stack versions | **HIGH** | Live npm registry, 2026-06-05; Context7 official docs for all major packages |
| Feature scope | **HIGH** | Synthesized from Unlayer, MJML, Beefree, Mailchimp, Mosaico analysis + caniemail.com empirical data |
| Architecture patterns | **HIGH** | Context7 docs for dnd-kit, TipTap, react-email, Zustand, Fastify, Drizzle |
| Email compatibility rules | **HIGH** | caniemail.com API (307 items, verified); MJML source code (verified) |
| Export pipeline | **MEDIUM→HIGH** | Approach is well-established; actual rendering must be validated with real email clients (Gmail, Outlook, Apple Mail) before shipping |
| Drizzle vs Prisma discrepancy | **RESOLVED** | STACK.md (live-verified) supersedes ARCHITECTURE.md schema examples; use Drizzle |

### Gaps to Address During Planning

1. **Real email client testing**: The export pipeline approach is architecturally sound, but actual rendering in Outlook 2016/2019, Gmail webmail, and Apple Mail must be validated during Phase 7 with real test sends. Caniemail data is reliable but not a substitute for client testing.
2. **react-email version pinning**: ARCHITECTURE.md recommends react-email but STACK.md doesn't give a version. Pin this during Phase 7 research.
3. **Better Auth session handling vs JWT**: ARCHITECTURE.md references JWT (`Authorization: Bearer <jwt>`) while STACK.md recommends Better Auth's database sessions. These are not mutually exclusive (Better Auth can issue session tokens used as Bearer tokens) but the integration pattern needs a decision during Phase 1.
4. **Undo/redo state design**: FEATURES.md flags this as deferred to v2 but notes "design state management to support it even if not exposed yet." The Zustand + Immer + flat ID map pattern in ARCHITECTURE.md supports undo/redo via history stacks — confirm this is the approach before finalizing Phase 1 state shape.

---

## Sources (Aggregated)

| Source | Confidence | Used In |
|--------|------------|---------|
| npm registry (live, 2026-06-05) | HIGH | STACK.md |
| Context7: TipTap v3 docs + migration guide | HIGH | STACK.md, ARCHITECTURE.md, PITFALLS.md |
| Context7: Fastify v5 docs | HIGH | STACK.md, ARCHITECTURE.md |
| Context7: Drizzle ORM docs (PostgreSQL) | HIGH | STACK.md |
| Context7: Better Auth Fastify integration | HIGH | STACK.md |
| Context7: dnd-kit docs (multi-container, type/accept) | HIGH | STACK.md, ARCHITECTURE.md, PITFALLS.md |
| Context7: react-email (Row/Column/Section, render) | HIGH | ARCHITECTURE.md |
| Context7: Zustand + Immer docs | HIGH | STACK.md, ARCHITECTURE.md |
| Context7: juice CSS inliner | HIGH | STACK.md, PITFALLS.md |
| Context7: MJML source (skeleton, section, msobutton) | HIGH | PITFALLS.md |
| caniemail.com API (307 items, verified) | HIGH | FEATURES.md, PITFALLS.md |
| Litmus email client market share (Feb 2026) | MEDIUM | FEATURES.md |
| Litmus dark mode guide + design best practices | HIGH | FEATURES.md |
| Unlayer built-in tools docs | HIGH | FEATURES.md |
| MJML documentation | HIGH | FEATURES.md |
| Beefree/RGE Studio product page | HIGH | FEATURES.md |
| Mosaico GitHub (open-source reference) | HIGH | FEATURES.md |
