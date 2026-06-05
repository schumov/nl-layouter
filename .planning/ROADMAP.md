# Roadmap: NL Layouter

## Overview

NL Layouter delivers a web-based drag-and-drop newsletter builder in 9 phases. Phases 1–3 build the non-interactive foundation (stack, CRUD, canvas rendering). Phases 4–7 layer in the full interaction model (DnD row-level, DnD element-level, image/button editors, rich text + TipTap). Phases 8–9 complete the product (header/footer presets, HTML export pipeline). The architectural spine — `NewsletterDoc` JSON model and TipTap inline-style output — is locked in Phase 1 and cannot be retrofitted.

---

## Phases

- [ ] **Phase 1: Foundation & Stack Setup** — Monorepo, Fastify + Drizzle + PostgreSQL, NewsletterDoc types, TipTap v3 scaffold, DnD type constants
- [ ] **Phase 2: Newsletter CRUD & Dashboard** — Full newsletter lifecycle: create, list, open, rename, delete, auto-save
- [ ] **Phase 3: Canvas Shell & Layout Rendering** — Two-panel builder UI; all 5 layout types render with correct column proportions
- [ ] **Phase 4: DnD — Row-Level Operations** — Drag layout sections from palette, reorder, delete, duplicate
- [ ] **Phase 5: DnD — Element Placement** — Drag elements from palette into column slots; remove and replace elements
- [ ] **Phase 6: Image & Button Elements** — Image, image-link, and button renderers + InspectorPanel editors
- [ ] **Phase 7: Rich Text, Divider & TipTap** — TipTap v3 WYSIWYG with inline-style output; named styles; divider element
- [ ] **Phase 8: Header/Footer Presets & Pre-header** — Preset selector UI, seed data, pre-header text field
- [ ] **Phase 9: HTML Export Pipeline** — react-email + juice + MSO conditionals + browser download

---

## Phase 1: Foundation & Stack Setup

**Goal:** The monorepo scaffold, database connection, shared TypeScript types, and critical architectural constants are in place so both client and server can be developed on a solid foundation.

**Requirements covered:** *(none — infrastructure phase enabling all later phases)*

**Plans:** 7 plans across 4 waves

Plans:
- [ ] 01-01-PLAN.md — Monorepo scaffold: pnpm workspace, root tsconfig.base.json, apps/client + apps/server package.json with all dependencies, pnpm install
- [ ] 01-02-PLAN.md — Fastify server foundation: Zod env config (config.ts), Fastify entry with @fastify/cors + @fastify/cookie + GET /health
- [ ] 01-03-PLAN.md — Database setup: docker-compose.yml, drizzle.config.ts, empty schema.ts, connection.ts; [BLOCKING] drizzle-kit push against Neon.tech
- [ ] 01-04-PLAN.md — NewsletterDoc TypeScript types (TDD): full discriminated union with all 5 elements including DividerElement; Vitest type test confirms exhaustive switch
- [ ] 01-05-PLAN.md — DnD type constants + TipTap v3 scaffold: DRAG_TYPES enum + ACCEPT_CONSTRAINTS; emailSafeExtensions with inline-style renderHTML stubs
- [ ] 01-06-PLAN.md — React client foundation: Tailwind v4 CSS-first + shadcn init; main.tsx with QueryClientProvider + RouterProvider; Zustand + Immer store scaffold
- [ ] 01-07-PLAN.md — Environment & dev tooling: .env.example, README quick-start; [VERIFY] pnpm dev starts both apps, /health responds

### Done When

- [ ] `pnpm dev` starts client on port 3000 and server on port 3001 with zero errors
- [ ] `GET /health` returns `{ "status": "ok" }` from Fastify
- [ ] `drizzle-kit push` applies the initial schema against local PostgreSQL without errors
- [ ] TypeScript strict-mode compilation passes on both `apps/client` and `apps/server` with 0 errors
- [ ] `NewsletterDoc` type correctly models a newsletter with sections containing columns containing all 5 element types

---

## Phase 2: Newsletter CRUD & Dashboard

**Goal:** Users can create, name, list, open, rename, delete, and auto-save newsletters through a working API and dashboard UI.

**Requirements covered:** NL-01, NL-02, NL-03, NL-04, NL-05, NL-06

### Plans

1. **Drizzle schema — newsletters** — `newsletters` table (`id` UUID PK, `title` text, `document` JSONB, `created_at`, `updated_at`); run migration
2. **Newsletter API routes** — `POST /newsletters`, `GET /newsletters`, `GET /newsletters/:id`, `PUT /newsletters/:id` (full document save), `PATCH /newsletters/:id` (title rename), `DELETE /newsletters/:id`; Zod validation on all request bodies
3. **TanStack Query hooks** — `useNewsletters()`, `useNewsletter(id)`, `useCreateNewsletter()`, `useUpdateNewsletter()`, `useDeleteNewsletter()` with optimistic cache updates
4. **Dashboard page** — Route `/newsletters`; `NewsletterCard` grid (title, last-saved timestamp); empty state with "Create your first newsletter" CTA
5. **Create newsletter dialog** — Name input + Create button → `POST /newsletters` → navigate to `/newsletters/:id`
6. **Rename newsletter** — Inline title edit in `BuilderHeader` (click-to-edit); `PATCH` on blur or Enter; reflected in dashboard card
7. **Delete newsletter** — Confirm dialog ("Delete *Newsletter Name*?") → `DELETE` → optimistic removal from list with undo toast
8. **Auto-save with debounce** — `useEffect` watching Zustand canvas state, 1500 ms debounce, mutation to `PUT /newsletters/:id`; "Saving…" → "Saved ✓" indicator in `BuilderHeader`

### Done When

- [ ] User can create a newsletter from the dashboard and see it in the list immediately
- [ ] User can open a newsletter from the list, navigate away, return, and see the same document state
- [ ] User can rename a newsletter; new name persists on page refresh and appears in both list and builder
- [ ] User can delete a newsletter; it is removed from the list and `GET /newsletters/:id` returns 404
- [ ] After the user stops editing for 1.5 s, the status shows "Saved ✓" and the document is present after hard reload

---

## Phase 3: Canvas Shell & Layout Rendering

**Goal:** The builder page displays a two-panel layout where the canvas correctly renders all five layout section types with proportional columns and empty-slot placeholders.

**Requirements covered:** CANVAS-01, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05

### Plans

1. **Builder page route** — `/newsletters/:id`; loads newsletter via `useNewsletter(id)` into Zustand canvas store on mount; loading + error states
2. **BuilderHeader** — Title display (editable inline), save-status indicator, placeholder Export button; sticky top bar
3. **BuilderCanvas shell** — Left panel (~60% width), vertical scroll, `#f4f4f5` background, centered content area capped at 640 px
4. **BuilderPalette shell** — Right panel (~40% width), sticky; tab group: "Layouts" tab and "Elements" tab (both empty stubs for now)
5. **`RowBlock` + `ColumnGrid`** — `RowBlock` renders one section wrapper; `ColumnGrid` renders correct column widths for all 5 layout variants using Tailwind flex (builder UI only): 1-col (100%), 2-col (50/50), 3-col (33/33/33), small-left/big-right (33/67), big-left/small-right (67/33)
6. **`ColumnSlot`** — Empty slot with dashed border, `Drop element here` hint text; renders `ElementRenderer` child when slot has content
7. **Fixture validation** — Hardcoded `NewsletterDoc` with one section of each layout type (all slots empty); render all 5 on builder canvas; visually confirm column proportions

### Done When

- [ ] Navigating to `/newsletters/:id` shows a two-panel builder: scrollable canvas left, sticky palette right
- [ ] All five layout types render with visually distinct, correctly-proportioned columns
- [ ] Empty column slots show a dashed-border placeholder with hint text
- [ ] The palette shows a "Layouts" tab listing all 5 layout names

**UI hint**: yes

---

## Phase 4: DnD — Row-Level Operations

**Goal:** Users can drag layout sections from the palette onto the canvas, reorder them by dragging, and delete or duplicate sections.

**Requirements covered:** CANVAS-02, CANVAS-03, CANVAS-04, CANVAS-05, CANVAS-06

### Plans

1. **`DragDropProvider`** — Wrap `BuilderPage` in `DndContext` with `PointerSensor` + `KeyboardSensor`; set collision detection to `closestCenter`; configure sensors with 8 px activation distance
2. **Palette `LayoutCards`** — 5 draggable cards using `useDraggable(type: DRAG_TYPES.LAYOUT_CARD, data: { layoutType })`; drag overlay renders a ghost card thumbnail
3. **Canvas droppable zone** — `useDroppable` on canvas area accepting `DRAG_TYPES.LAYOUT_CARD`; blue highlight border on active drag-over
4. **`SortableRowList` + `useSortable`** — Wrap section list in `SortableContext` (`verticalListSortingStrategy`); each `RowBlock` uses `useSortable(type: DRAG_TYPES.CANVAS_ROW)`
5. **Drop handler — palette → canvas** — `onDragEnd`: detect `LAYOUT_CARD` drop on canvas zone → dispatch `addSection(layoutType)` to Zustand; new section appends at bottom
6. **Reorder handler** — `onDragEnd`: detect `CANVAS_ROW` drag within `SortableContext` → dispatch `reorderSections(activeId, overId)` using `arrayMove`; Zustand mutates section array
7. **Section controls** — GripVertical drag handle; trash Delete button → dispatch `removeSection(id)`; Duplicate button → dispatch `duplicateSection(id)` (deep clone with fresh UUIDs for section, columns, elements)

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

### Plans

1. **Palette `ElementCards`** — 5 draggable element cards (image, image-link, button, rich-text, divider) using `useDraggable(type: DRAG_TYPES.ELEMENT_CARD, data: { elementType })`; renders element icon + label
2. **`ColumnSlot` droppable** — Convert `ColumnSlot` to `useDroppable(accept: [DRAG_TYPES.ELEMENT_CARD])`; pulsing green outline on active drag-over; slot renders `EmptySlot` or `ElementRenderer` based on slot state
3. **Element selection state** — Click element → `setSelectedElement(slotId, elementId)` in Zustand; click outside any element → clear selection; selected slot gets highlight ring
4. **Drop handler — palette → slot** — `onDragEnd`: `ELEMENT_CARD` dropped on droppable slot → dispatch `addElement(slotId, elementType)` creating element with default config (empty strings, default colours); replaces existing element automatically
5. **Remove element** — "×" control on element toolbar (visible on hover/select) → dispatch `removeElement(slotId)`; slot returns to `EmptySlot`
6. **Replace element** — Drop new `ELEMENT_CARD` onto occupied slot → dispatch `replaceElement(slotId, newElementType)` creating fresh default config; previous element content discarded

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

### Plans

1. **`ImageRenderer`** — `<img>` with `src` and `alt` from element config; `width` defaults to 100%; grey placeholder frame (with broken-image icon) when `src` is empty; `object-fit: cover` in builder
2. **`ImageLinkRenderer`** — `ImageRenderer` wrapped in `<a href={element.href} target="_blank">`; link icon badge overlaid in builder; configurable href
3. **`ButtonRenderer`** — Two style variants: *filled* (solid background, white/configured text) and *outline* (transparent, border + text in configured colour); configurable `label`, `href`, `bgColor`, `textColor`; centred in column
4. **`InspectorPanel` shell** — Right panel swaps from palette tabs to `InspectorPanel` when `selectedElementId` is set; back arrow → deselect + return to palette; header shows element type name
5. **`ImageEditor`** — `src` URL input, `alt` text input (marked required with `*`), `width` input (px or `%`); every field change dispatches `updateElement(id, patch)` to Zustand for live canvas update
6. **`ButtonEditor`** — Label input, href input, background colour picker (hex text + colour swatch), text colour picker, style toggle (Filled / Outline); colour picker uses native `<input type="color">` with hex display

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

### Plans

1. **TipTap inline-style extensions** — Override `renderHTML` on TextAlign, Color, Bold, Italic, Underline, and Link extensions to emit `style=""` attributes only; write unit test asserting zero `class=` attributes on any formatting mark in `editor.getHTML()` output
2. **Named text style presets** — Implement `TextStyle` presets as `RichTextPreset` type: *Header* (`font-size:24px;font-weight:700`), *Subheader* (`font-size:18px;font-weight:600`), *Body Text* (`font-size:14px`), *Code* (`font-family:monospace;font-size:13px`); accessible via toolbar dropdown
3. **`RichTextStaticRenderer`** — Use `@tiptap/static-renderer` `renderToHTMLString` with custom `nodeMapping` + `markMapping` that matches inline-style extensions; renders non-focused rich text blocks on canvas as static HTML (no ProseMirror instance)
4. **`RichTextEditor` (active instance)** — Single `<EditorContent>` in `InspectorPanel`; `BubbleMenu` from `@tiptap/react/menus` with Bold / Italic / Underline / Link buttons; named-style picker dropdown; `useEffect` cleanup destroys editor on element deselect
5. **Editor lifecycle guard** — Verify only one TipTap editor instance mounted at a time; navigate between multiple rich text elements; confirm console shows no "Editor destroyed" leaks or duplicate-instance warnings
6. **`DividerRenderer`** — `<hr>` with inline `style="border-top: {thickness}px solid {color}; margin: {spacingTop}px 0 {spacingBottom}px"` from element config; default: 1 px `#cccccc`, 16 px spacing
7. **`DividerEditor`** — Colour picker, thickness input (1–8 px slider), padding-top + padding-bottom inputs; all values dispatch `updateElement(id, patch)` for live canvas preview

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
| 1. Foundation & Stack Setup | 0/8 | Not started | — |
| 2. Newsletter CRUD & Dashboard | 0/8 | Not started | — |
| 3. Canvas Shell & Layout Rendering | 0/7 | Not started | — |
| 4. DnD — Row-Level Operations | 0/7 | Not started | — |
| 5. DnD — Element Placement | 0/6 | Not started | — |
| 6. Image & Button Elements | 0/6 | Not started | — |
| 7. Rich Text, Divider & TipTap | 0/7 | Not started | — |
| 8. Header/Footer Presets & Pre-header | 0/7 | Not started | — |
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
| HF-01 | Phase 8 | Pending |
| HF-02 | Phase 8 | Pending |
| HF-03 | Phase 8 | Pending |
| HF-04 | Phase 8 | Pending |
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
| ELEM-01 | Phase 6 | Pending |
| ELEM-02 | Phase 6 | Pending |
| ELEM-03 | Phase 6 | Pending |
| ELEM-04 | Phase 6 | Pending |
| ELEM-05 | Phase 6 | Pending |
| ELEM-06 | Phase 7 | Pending |
| ELEM-07 | Phase 7 | Pending |
| ELEM-08 | Phase 7 | Pending |
| ELEM-09 | Phase 7 | Pending |
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
