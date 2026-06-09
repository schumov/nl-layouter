# Roadmap: NL Layouter

## Overview

NL Layouter delivers a web-based drag-and-drop newsletter builder in 9 phases. Phases 1–3 build the non-interactive foundation (stack, CRUD, canvas rendering). Phases 4–7 layer in the full interaction model (DnD row-level, DnD element-level, image/button editors, rich text + TipTap). Phases 8–9 complete the product (header/footer presets, HTML export pipeline). The architectural spine — `NewsletterDoc` JSON model and TipTap inline-style output — is locked in Phase 1 and cannot be retrofitted.

---

## Phases

- [x] **Phase 1: Foundation & Stack Setup** — Monorepo, Fastify + Drizzle + PostgreSQL, NewsletterDoc types, TipTap v3 scaffold, DnD type constants
- [x] **Phase 2: Newsletter CRUD & Dashboard** — Full newsletter lifecycle: create, list, open, rename, delete, auto-save
- [x] **Phase 3: Canvas Shell & Layout Rendering** — Two-panel builder UI; all 5 layout types render with correct column proportions
- [x] **Phase 4: DnD — Row-Level Operations** — Drag layout sections from palette, reorder, delete, duplicate
- [x] **Phase 5: DnD — Element Placement** — Drag elements from palette into column slots; remove and replace elements
- [x] **Phase 6: Image & Button Elements** — Image, image-link, and button renderers + InspectorPanel editors
- [x] **Phase 7: Rich Text, Divider & TipTap** — TipTap v3 WYSIWYG with inline-style output; named styles; divider element
- [ ] **Phase 8: Header/Footer Presets & Pre-header** ✅ COMPLETE — Preset selector UI, seed data, pre-header text field
- [ ] **Phase 9: HTML Export Pipeline** — react-email + juice + MSO conditionals + browser download

---

## Phase 1: Foundation & Stack Setup

**Goal:** The monorepo scaffold, database connection, shared TypeScript types, and critical architectural constants are in place so both client and server can be developed on a solid foundation.

**Requirements covered:** *(none — infrastructure phase enabling all later phases)*

**Plans:** 7 plans across 4 waves

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold: pnpm workspace, root tsconfig.base.json, apps/client + apps/server package.json with all dependencies, pnpm install
- [x] 01-02-PLAN.md — Fastify server foundation: Zod env config (config.ts), Fastify entry with @fastify/cors + @fastify/cookie + GET /health
- [x] 01-03-PLAN.md — Database setup: docker-compose.yml, drizzle.config.ts, empty schema.ts, connection.ts; [BLOCKING] drizzle-kit push against Neon.tech
- [x] 01-04-PLAN.md — NewsletterDoc TypeScript types (TDD): full discriminated union with all 5 elements including DividerElement; Vitest type test confirms exhaustive switch
- [x] 01-05-PLAN.md — DnD type constants + TipTap v3 scaffold: DRAG_TYPES enum + ACCEPT_CONSTRAINTS; emailSafeExtensions with inline-style renderHTML stubs
- [x] 01-06-PLAN.md — React client foundation: Tailwind v4 CSS-first + shadcn init; main.tsx with QueryClientProvider + RouterProvider; Zustand + Immer store scaffold
- [x] 01-07-PLAN.md — Environment & dev tooling: .env.example, README quick-start; [VERIFY] pnpm dev starts both apps, /health responds

### Done When

- [x] `pnpm dev` starts client on port 3000 and server on port 3001 with zero errors
- [x] `GET /health` returns `{ "status": "ok" }` from Fastify
- [x] `drizzle-kit push` applies the initial schema against Neon.tech without errors
- [x] TypeScript strict-mode compilation passes on both `apps/client` and `apps/server` with 0 errors
- [x] `NewsletterDoc` type correctly models a newsletter with sections containing columns containing all 5 element types

---

## Phase 2: Newsletter CRUD & Dashboard

**Goal:** Users can create, name, list, open, rename, delete, and auto-save newsletters through a working API and dashboard UI.

**Requirements covered:** NL-01, NL-02, NL-03, NL-04, NL-05, NL-06

**Plans:** 9 plans across 7 waves

Plans:
- [x] 02-00-PLAN.md — Wave 0: Test stubs — vitest.config.ts (jsdom) + 4 stub test files for hooks/components
- [x] 02-01-PLAN.md — Drizzle schema: `newsletters` table (UUID PK, text title, JSONB document, timestamps); [BLOCKING] drizzle-kit push to Neon.tech
- [x] 02-02-PLAN.md — Client setup: install shadcn components (button, input, dialog, alert-dialog, dropdown-menu, sonner, card); CSS token override (Infineon Blue --primary + --ring)
- [x] 02-03-PLAN.md — Newsletter API routes: FastifyPluginAsync with 6 routes (GET list lean, POST create, GET/:id, PUT/:id auto-save, PATCH/:id rename, DELETE/:id); register in index.ts
- [x] 02-04-PLAN.md — Query hooks: `useNewsletters()` + `useNewsletter(id)` + shared types (NewsletterSummary, NEWSLETTERS_QUERY_KEY, NEWSLETTER_QUERY_KEY)
- [x] 02-05-PLAN.md — Mutation hooks: `useCreateNewsletter`, `useUpdateNewsletter`, `useRenameNewsletter`, `useDeleteNewsletter` (optimistic + undo), `useAutoSave` (1500ms debounce + save status machine)
- [x] 02-06-PLAN.md — Dashboard UI: `DashboardPage` (responsive grid + empty state) + `NewsletterCard` (title/timestamp/sectionCount + hover ⋮ menu + delete confirm AlertDialog)
- [x] 02-07-PLAN.md — Create flow + Builder shell: `CreateNewsletterDialog` (name validation + create-and-navigate) wired into DashboardPage; `BuilderPage` (doc load → Zustand + useAutoSave integration)
- [x] 02-08-PLAN.md — BuilderHeader (back arrow + click-to-edit title rename + save status + Export stub) + main.tsx final route wiring (DashboardPage, BuilderPage) + Sonner Toaster mount

### Done When

- [x] User can create a newsletter from the dashboard and see it in the list immediately
- [x] User can open a newsletter from the list, navigate away, return, and see the same document state
- [x] User can rename a newsletter; new name persists on page refresh and appears in both list and builder
- [x] User can delete a newsletter; it is removed from the list and `GET /newsletters/:id` returns 404
- [x] After the user stops editing for 1.5 s, the status shows "Saved ✓" and the document is present after hard reload

---

## Phase 3: Canvas Shell & Layout Rendering

**Goal:** The builder page displays a two-panel layout where the canvas correctly renders all five layout section types with proportional columns and empty-slot placeholders.

**Requirements covered:** CANVAS-01, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05

**Plans:** 4 plans across 3 waves

Plans:
- [x] 03-00-PLAN.md — Wave 0: Test infrastructure — install @testing-library devDeps, vitest setupFiles, test-setup.ts, FIXTURE_DOC fixture, three stub test files
- [x] 03-01-PLAN.md — Wave 1: Core rendering chain — CSS canvas token, ElementRenderer stub, ColumnSlot (empty placeholder), ColumnGrid (COLUMN_CLASSES record, all 5 layout types), RowBlock (section card); fill ColumnGrid + ColumnSlot tests
- [x] 03-02-PLAN.md — Wave 1: Palette shell (parallel) — install shadcn tabs via CLI, BuilderPalette with Layouts/Elements tabs and 5 layout cards
- [x] 03-03-PLAN.md — Wave 2: Canvas wiring — BuilderCanvas (left panel, bg-canvas, RowBlock render), BuilderPage replace `<main>` placeholder, dev fixture route in main.tsx; fill BuilderCanvas tests

### Done When

- [x] Navigating to `/newsletters/:id` shows a two-panel builder: scrollable canvas left, sticky palette right
- [x] All five layout types render with visually distinct, correctly-proportioned columns
- [x] Empty column slots show a dashed-border placeholder with hint text
- [x] The palette shows a "Layouts" tab listing all 5 layout names

**UI hint**: yes

---

## Phase 4: DnD — Row-Level Operations

**Goal:** Users can drag layout sections from the palette onto the canvas, reorder them by dragging, and delete or duplicate sections.

**Requirements covered:** CANVAS-02, CANVAS-03, CANVAS-04, CANVAS-05, CANVAS-06

**Plans:** 7 plans across 4 waves

Plans:
- [x] 04-00-PLAN.md — Wave 0: Test scaffolding — useNewsletterStore.test.ts (store unit tests), extend RowBlock.test.tsx (SectionControls), DragDropProvider.test.tsx + SortableRowList.test.tsx stubs, add DndContext wrappers to BuilderCanvas + BuilderPalette tests
- [x] 04-01-PLAN.md — Wave 1: Store extensions — add reorderSections (arrayMove) + duplicateSection (structuredClone + fresh UUIDs) to useNewsletterStore.ts
- [x] 04-02-PLAN.md — Wave 1: RowBlock upgrade — extend RowBlock with sortable props + SectionControls sub-component (GripVertical + Copy + Trash2 with inline delete confirm per D-05/D-06/D-07)
- [x] 04-03-PLAN.md — Wave 1: BuilderPalette draggable — extract DraggableLayoutCard with useDraggable (DRAG_TYPES.LAYOUT_CARD data); export LAYOUT_NAMES
- [x] 04-04-PLAN.md — Wave 2: DragDropProvider — DndContext with PointerSensor (8px) + KeyboardSensor; onDragStart/onDragEnd handlers; DragOverlay with LAYOUT_CARD + CANVAS_ROW ghosts
- [x] 04-05-PLAN.md — Wave 2: SortableRowList — empty drop zone (useDroppable, D-03/D-04 blue hover) + SortableRowBlock (local, calls useSortable with DRAG_TYPES.CANVAS_ROW data)
- [x] 04-06-PLAN.md — Wave 3: Canvas + Page wiring — BuilderCanvas uses SortableRowList; BuilderPage wraps with DragDropProvider; full test suite green

### Done When

- [ ] Dragging a layout card from the palette onto the canvas creates a new section of that layout type
- [ ] New sections append in drop order (top-to-bottom); order survives save + reload
- [ ] Dragging a section's grip handle reorders it; the canvas reflows immediately
- [ ] The Delete button removes a section; the canvas gap closes
- [ ] The Duplicate button inserts an identical copy directly below the original

**UI hint**: yes

---

## Phase 5: DnD — Element Placement

**Goal:** Users can drag element types from the palette into any column slot, remove elements from slots, and replace an element by dropping a new type.

**Requirements covered:** ELEM-10, ELEM-11, ELEM-12

**Plans:** 6 plans across 4 waves

Plans:
- [x] 05-00-PLAN.md — Wave 0: TDD stubs — InspectorPanel.tsx minimal stub + InspectorPanel.test.tsx RED stubs; ColumnSlot.test.tsx renderWithDnd upgrade + RED stubs; useNewsletterStore.test.ts addElement/removeElement RED stubs; DragDropProvider.test.tsx ELEMENT_CARD RED stub
- [x] 05-01-PLAN.md — Wave 1: Store actions — addElement(slotId, elementType) + removeElement(slotId) + createDefaultElement helper in useNewsletterStore.ts; turns 5 RED store stubs GREEN
- [x] 05-02-PLAN.md — Wave 1: DraggableElementCard palette — 5 draggable cards (lucide icon + label) in Elements tab; export ELEMENT_NAMES + ELEMENT_CARD_ICONS for DragDropProvider ghost
- [x] 05-03-PLAN.md — Wave 2: ColumnSlot droppable — useDroppable (DRAG_TYPES.ELEMENT_CARD); green hover highlight (D-01–D-03); × remove button with 2-step inline confirm (D-09–D-11); click-to-select + ring (D-10)
- [x] 05-04-PLAN.md — Wave 2: DragDropProvider collision + ELEMENT_CARD handler — custom collisionDetection filters slot droppables for ELEMENT_CARD (Finding 1); ELEMENT_CARD branch in onDragEnd calls addElement; DragOverlay ghost
- [x] 05-05-PLAN.md — Wave 3: InspectorPanel + wiring — full InspectorPanel placeholder (type name + back arrow + note); BuilderPage conditional right panel; BuilderCanvas onCanvasClick for D-06 deselect

### Done When

- [ ] All element type cards appear in the "Elements" tab of the palette
- [ ] Dragging an element card into an empty slot creates that element type in the slot
- [ ] The remove button (×) on an occupied slot reverts it to empty/placeholder
- [ ] Dropping a different element type onto an occupied slot replaces it with the new type
- [ ] The selected element's slot is visually distinguished (highlight ring or shadow)

**UI hint**: yes

---

## Phase 6: Image & Button Elements

**Goal:** Image, image-with-link, and button elements render correctly on the canvas and are fully configurable via the InspectorPanel.

**Requirements covered:** ELEM-01, ELEM-02, ELEM-03, ELEM-04, ELEM-05

**Plans:** 7 plans across 4 waves

Plans:
- [ ] 06-00-PLAN.md — Wave 0: TDD stubs — 5 new test files (ImageRenderer, ImageLinkRenderer, ButtonRenderer, ImageEditor, ButtonEditor) + update InspectorPanel.test (D-08 prop rename), ColumnSlot.test ([image]→Add image URL), useNewsletterStore.test (updateElement stubs)
- [ ] 06-01-PLAN.md — Wave 1: updateElement store action (Immer Object.assign patch merge) + remove deprecated setElement
- [ ] 06-02-PLAN.md — Wave 1: ImageRenderer (branded placeholder + <img> with objectFit:cover) + ImageLinkRenderer (<a> wrapper + data-builder-only ExternalLink badge)
- [ ] 06-03-PLAN.md — Wave 1: ButtonRenderer (solid/outline variants via inline styles; ghost falls through to solid per D-05; CC-2/CC-6)
- [ ] 06-04-PLAN.md — Wave 2: ElementRenderer dispatch switch (replaces Phase 5 stub; routes image/image-link/button to renderers; rich-text/divider to named stubs; assertNeverElement default)
- [ ] 06-05-PLAN.md — Wave 2: ImageEditor (src, alt, width, conditional href) + ButtonEditor (label, href, colour pickers, Filled/Outline style toggle)
- [ ] 06-06-PLAN.md — Wave 3: InspectorPanel upgrade (element: ElementUnion prop + onUpdate + body routing switch) + BuilderPage wiring (selectedElement selector + updateElement dispatch)

### Done When

- [ ] Image elements render the image at the configured URL; alt text is set correctly (visible in browser inspector)
- [ ] Image-with-link elements open the configured href in a new tab when clicked
- [ ] Button elements render in both filled and outline variants with the configured label and colours
- [ ] Clicking an element on the canvas opens its editor in the right panel, replacing the palette tabs
- [ ] Changing any editor field updates the canvas element in real time without a page reload

**UI hint**: yes

---

## Phase 7: Rich Text, Divider & TipTap

**Goal:** Rich text elements are fully editable with TipTap v3 configured for inline-style output, named text styles apply visible formatting, and divider elements are configurable — with zero CSS classes in any persisted content.

**Requirements covered:** ELEM-06, ELEM-07, ELEM-08, ELEM-09

**Plans:** 7 plans

Plans:
- [x] 07-00-PLAN.md — TDD RED stubs: create failing test contracts for all Phase 7 components
- [x] 07-01-PLAN.md — Package install + shared TipTap extension module (`lib/tiptap-extensions.ts`)
- [x] 07-02-PLAN.md — `DividerRenderer` + `DividerEditor` (inline-styled hr + color/thickness/spacing editor)
- [x] 07-03-PLAN.md — `addElement` defaults: rich-text content fix + store unit tests
- [x] 07-04-PLAN.md — `RichTextStaticRenderer` (generateHTML + dangerouslySetInnerHTML + preset CSS)
- [x] 07-05-PLAN.md — `RichTextEditor` (useEditor + BubbleMenu + named preset picker)
- [x] 07-06-PLAN.md — Full integration: ElementRenderer lifecycle guard + InspectorPanel routing

### Done When

- [ ] Rich text elements show bold, italic, links, and bullet lists rendered on the canvas
- [ ] Named styles (Header, Subheader, Body Text, Code) apply visually distinct formatting on canvas
- [ ] Browser DevTools inspection of a formatted rich text element confirms all formatting is in `style=""` attributes — zero occurrences of `has-text-align-*`, `has-color-*`, or any class-based TipTap marks
- [ ] Selecting a rich text element mounts the TipTap editor; deselecting destroys it with no console errors
- [ ] Divider elements render as styled horizontal rules; colour and spacing changes in the editor reflect on canvas immediately

**UI hint**: yes

---

## Phase 8: Header/Footer Presets & Pre-header

**Goal:** Users can select header and footer template presets for each newsletter and enter hidden pre-header inbox-preview text.

**Requirements covered:** HF-01, HF-02, HF-03, HF-04

### Plans

1. **Presets DB schema** — `presets` table (`id` UUID, `type` TEXT `'header'|'footer'`, `name` TEXT, `html_content` TEXT, `preview_thumbnail` TEXT nullable); Drizzle schema + migration
2. **Preset seed data** — 2 header presets (*Minimal Logo*, *Logo + Banner*) and 2 footer presets (*Simple Links*, *Address + Unsubscribe*) seeded via `drizzle-kit` seed script
3. **Presets API** — `GET /presets?type=header|footer` returns array of preset summaries; presets are read-only at runtime (managed via seed)
4. **`HeaderPresetSlot`** — Non-sortable zone pinned at canvas top; renders selected header preset's `html_content` as a sanitised HTML preview; "None selected" placeholder when `doc.headerId` is null
5. **`FooterPresetSlot`** — Same approach, pinned at canvas bottom
6. **`PresetSelector` UI** — Popover/modal triggered by "Header" / "Footer" buttons in `BuilderHeader`; thumbnail grid of presets; clicking one dispatches `updateHeader(presetId)` / `updateFooter(presetId)` to Zustand doc; "None" option to clear
7. **Pre-header text field** — Collapsible input row in `BuilderHeader` area; 90-char soft limit with character count; dispatches `updatePreHeader(text)` to Zustand doc; included in auto-save payload

### Done When

- [ ] Builder header shows "Header" and "Footer" selector buttons
- [ ] At least 2 header presets and 2 footer presets are available and named correctly in the selector
- [ ] Selecting a header preset renders it visually at the top of the canvas
- [ ] Selecting a footer preset renders it at the bottom of the canvas
- [ ] Pre-header text field is accessible; entered text persists on newsletter save and reload

**UI hint**: yes

---

## Phase 9: HTML Export Pipeline

**Goal:** Users can export the finished newsletter as a self-contained `.html` file that uses table-based layout, inlined CSS, MSO conditional comments for Outlook, and embeds the pre-header span.

**Requirements covered:** EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, EXPORT-05, EXPORT-06, EXPORT-07

### Plans

1. **react-email component primitives** — Install `react-email`; create email-layer components (`EmailDocument`, `EmailSection`, `EmailRow`, `EmailColumn`) wrapping react-email `Section` / `Row` / `Column` primitives that compile to `<table>` / `<td>` HTML
2. **Element-to-email renderers** — Per-element render functions: `imageToEmail()`, `imageLinkToEmail()`, `buttonToEmail()`, `richTextToEmail()` (raw inline-styled HTML from static-renderer), `dividerToEmail()`; all use `px` units; `<img>` tags carry both `width`/`height` HTML attributes and `style="max-width:100%;height:auto;"`
3. **`documentToEmailTree()`** — Maps `NewsletterDoc` → react-email component tree: section list → `EmailRow` + `EmailColumn`s; elements → typed renderers; prepends header `html_content`; appends footer `html_content`; injects pre-header hidden `<span>` after `<body>` open tag
4. **react-email `render()`** — Server-side `render(EmailDocument)` → raw HTML string; assert output contains zero `display:flex` or `display:grid` occurrences
5. **Juice CSS inlining** — `juice(html, { removeStyleTags: true, preserveMediaQueries: false })` → all `style=` attributes inlined; assert no `<style>` blocks remain; all CSS class references from react-email internals resolved
6. **DOCTYPE + MSO wrapper** — Prepend XHTML 1.0 Transitional `<!doctype>` with `xmlns:v` + `xmlns:o` VML namespaces; add `<!--[if mso]>` reset block; multi-column `EmailRow` sections wrapped in MSO conditional `<table>` per PITFALL-2 pattern
7. **Export API route** — `POST /newsletters/:id/export`: load doc from DB → run full pipeline → respond with `Content-Type: text/html; charset=UTF-8` and `Content-Disposition: attachment; filename="<title>.html"`
8. **Export button UI** — "Export HTML" button in `BuilderHeader` → `fetch` export route → `new Blob([html], { type: 'text/html' })` → `URL.createObjectURL` → programmatic `<a download>` click → `URL.revokeObjectURL` cleanup

### Done When

- [ ] Clicking "Export HTML" triggers a `.html` file download named after the newsletter title
- [ ] Opening the downloaded file in a browser displays the complete newsletter (header, content sections, footer) with correct visual formatting
- [ ] Inspecting the HTML source confirms: multi-column layout uses only `<table>` / `<td>` (zero `display:flex` or `display:grid`), all CSS is in `style=""` attributes (zero `<style>` blocks), `<!--[if mso | IE]>` comments wrap multi-column rows
- [ ] Pre-header text appears as a hidden `<span style="display:none;...">` near the top of the `<body>`
- [ ] All `<img>` tags carry both HTML `width`/`height` attributes and `style="max-width:100%;height:auto;"`

**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation & Stack Setup | 7/7 | Complete ✅ | 2026-06-05 |
| 2. Newsletter CRUD & Dashboard | 9/9 | Complete ✅ | 2026-06-06 |
| 3. Canvas Shell & Layout Rendering | 4/4 | Complete ✅ | 2026-06-07 |
| 4. DnD — Row-Level Operations | 7/7 | Complete ✅ | 2026-06-08 |
| 5. DnD — Element Placement | 6/6 | Complete ✅ | 2026-06-08 |
| 6. Image & Button Elements | 0/6 | Not started | — |
| 7. Rich Text, Divider & TipTap | 0/7 | Not started | — |
| 8. Header/Footer Presets & Pre-header | 8/8 | ✅ Complete | ab12521 |
| 9. HTML Export Pipeline | 0/8 | Not started | — |

---

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| NL-01 | Phase 2 | Pending |
| NL-02 | Phase 2 | Pending |
| NL-03 | Phase 2 | Pending |
| NL-04 | Phase 2 | Pending |
| NL-05 | Phase 2 | Pending |
| NL-06 | Phase 2 | Pending |
| HF-01 | Phase 8 | ✅ Complete |
| HF-02 | Phase 8 | ✅ Complete |
| HF-03 | Phase 8 | ✅ Complete |
| HF-04 | Phase 8 | ✅ Complete |
| CANVAS-01 | Phase 3 | Pending |
| CANVAS-02 | Phase 4 | Pending |
| CANVAS-03 | Phase 4 | Pending |
| CANVAS-04 | Phase 4 | Pending |
| CANVAS-05 | Phase 4 | Pending |
| CANVAS-06 | Phase 4 | Pending |
| LAYOUT-01 | Phase 3 | Pending |
| LAYOUT-02 | Phase 3 | Pending |
| LAYOUT-03 | Phase 3 | Pending |
| LAYOUT-04 | Phase 3 | Pending |
| LAYOUT-05 | Phase 3 | Pending |
| ELEM-01 | Phase 6 | Complete |
| ELEM-02 | Phase 6 | Complete |
| ELEM-03 | Phase 6 | Complete |
| ELEM-04 | Phase 6 | Complete |
| ELEM-05 | Phase 6 | Complete |
| ELEM-06 | Phase 7 | Complete |
| ELEM-07 | Phase 7 | Complete |
| ELEM-08 | Phase 7 | Complete |
| ELEM-09 | Phase 7 | Complete |
| ELEM-10 | Phase 5 | Pending |
| ELEM-11 | Phase 5 | Pending |
| ELEM-12 | Phase 5 | Pending |
| EXPORT-01 | Phase 9 | Pending |
| EXPORT-02 | Phase 9 | Pending |
| EXPORT-03 | Phase 9 | Pending |
| EXPORT-04 | Phase 9 | Pending |
| EXPORT-05 | Phase 9 | Pending |
| EXPORT-06 | Phase 9 | Pending |
| EXPORT-07 | Phase 9 | Pending |

**v1 requirements mapped: 40/40 ✓**

---

*Roadmap created: 2026-06-05*
*Granularity: Fine (9 phases, 6–8 plans each)*
*Parallelization: enabled — independent plans within each phase may run concurrently*
