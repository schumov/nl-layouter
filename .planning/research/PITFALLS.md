# Domain Pitfalls: Visual HTML Email/Newsletter Builder

**Domain:** Web-based drag-and-drop HTML newsletter/email builder
**Project:** NL Layouter
**Stack:** React + TypeScript / @dnd-kit / TipTap / Node.js / PostgreSQL
**Researched:** 2026-06-05
**Sources:** caniemail.com API (verified, 307 items), MJML source code, TipTap docs (Context7), @dnd-kit docs (Context7), juice library docs (Context7)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken exports, or unfixable layout corruption.

---

### CRITICAL-1: Exporting TipTap HTML Directly as Email HTML

**What goes wrong:**  
`editor.getHTML()` returns CSS-class-based markup like `<p class="has-text-align-center">` or `<span class="has-color-#ff0000">`. CSS classes are stripped by Gmail (confirmed: `<style>` element in Gmail is only partially supported — `a #1 #6`) and Outlook removes class-based styling entirely. The export looks correct in the browser preview but breaks completely in every target email client.

**Why it happens:**  
Developers test by viewing the exported `.html` file in a browser, not an email client. Browser renders fine; email clients don't.

**Consequences:**  
- All text formatting lost in Gmail, Outlook
- Exported newsletter looks unstyled in the two most-used email clients
- This is a hard rewrite: TipTap extension configuration must be changed at the source, not patched at export time

**Prevention:**  
- Configure every TipTap extension's `renderHTML` to emit **inline styles only**, never CSS classes
- Example for text alignment:
  ```ts
  // WRONG (default TipTap behavior):
  // <p class="has-text-align-center">text</p>

  // CORRECT (custom renderHTML):
  renderHTML: (attributes) => ({
    style: `text-align: ${attributes.textAlign}`,
  })
  ```
- Configure this at extension creation time (Phase: Foundation/Rich Text)
- Use TipTap's `static-renderer` (`renderToHTMLString`) with custom `nodeMapping` and `markMapping` for the export pipeline — never `editor.getHTML()` for the final export
- Run exported HTML through `juice` (Automattic) to guarantee all styles are inlined and no `<link>` or `<style>` tags remain

**Detection (warning signs):**  
- `editor.getHTML()` output contains `class=` attributes on text elements
- CSS classes like `has-text-align-*`, `is-style-*`, `has-background`

**Phase:** Must be addressed in Phase 1 (Rich Text Editor setup). Cannot be retrofitted.

---

### CRITICAL-2: Using CSS Flexbox, Grid, or Float for Multi-Column Layout in Exported HTML

**What goes wrong:**  
Outlook for Windows (2007–2019) uses Microsoft Word's rendering engine (not a browser). It has **zero support** for:
- `display: flex` (caniemail: `n` for all Outlook Windows versions)
- `display: grid` (caniemail: `n`)
- `float` (caniemail: `n`)
- `position: relative/absolute` (caniemail: `n`)

The 2-column, 3-column, and asymmetric layouts are invisible or collapsed in Outlook Windows. Outlook 2019 is still widely used in enterprise environments.

**Why it happens:**  
Teams build the canvas using modern CSS layout, assume the same markup can be exported, and never test in a real Outlook instance until late in the project.

**Consequences:**  
- Multi-column sections render as single columns or zero-width in Outlook
- Complete visual corruption of the newsletter
- Requires full reimplementation of the export layer with table-based layout

**Prevention:**  
Treat the **editor canvas** and the **export HTML** as two completely separate artifacts:

| Layer | Technology | Notes |
|-------|-----------|-------|
| Editor Canvas (React) | Flexbox / CSS Grid | Full browser support, DX-friendly |
| Export HTML | Nested `<table>` with `width` attributes | Use `<!--[if mso]>` for Outlook-specific column tables |

Adopt the MJML pattern exactly:
```html
<!-- For 2-column layout in email export: -->
<!--[if mso | IE]>
<table role="presentation" border="0" cellpadding="0" cellspacing="0">
  <tr><td style="vertical-align:top;width:300px;">
<![endif]-->
<div style="display:inline-block;width:300px;vertical-align:top;">
  <!-- Column 1 content -->
</div>
<!--[if mso | IE]>
  </td><td style="vertical-align:top;width:300px;">
<![endif]-->
<div style="display:inline-block;width:300px;vertical-align:top;">
  <!-- Column 2 content -->
</div>
<!--[if mso | IE]>
  </td></tr></table>
<![endif]-->
```

Consider building the export layer on top of **MJML** (`mjml` npm package) by generating MJML JSON from the document model and calling `mjml2html()`. MJML handles all the Outlook MSO conditional comment generation automatically.

**Detection:** Export HTML contains `display: flex`, `display: grid`, or `float:` in any `style=` attribute.

**Phase:** Must be designed before the export layer is built (Phase: Export / HTML Generation).

---

### CRITICAL-3: Designing the Document Data Model as Rendered HTML (Not Structured JSON)

**What goes wrong:**  
Storing the newsletter as an HTML string in the database rather than a structured JSON document model. This makes the builder impossible to implement: you cannot re-parse HTML back into a canvas state reliably.

**Why it happens:**  
Shortest-path thinking — "we export HTML anyway, so store HTML."

**Consequences:**  
- Cannot load saved newsletters back into the canvas editor
- Cannot reorder sections (parsing HTML into sections is fragile)
- Cannot update element properties without full re-render
- Full rewrite of persistence layer required

**Prevention:**  
Store a canonical **JSON document model** in PostgreSQL. Example:
```json
{
  "id": "uuid",
  "headerId": "template-uuid",
  "footerId": "template-uuid",
  "sections": [
    {
      "id": "uuid",
      "layout": "two-column",
      "order": 1,
      "columns": [
        {
          "id": "uuid",
          "elements": [
            {
              "id": "uuid",
              "type": "rich-text",
              "order": 1,
              "content": { /* TipTap JSON */ }
            }
          ]
        }
      ]
    }
  ]
}
```
Store TipTap content as **TipTap JSON** (not HTML), using `editor.getJSON()` / `editor.commands.setContent(json)`. HTML export is always generated on-demand from the JSON model.

**Phase:** Must be designed in Phase 1 (Data Model). Cannot be changed later without full migration.

---

### CRITICAL-4: Storing Layout Order as Array Index Instead of an Explicit `order` Column

**What goes wrong:**  
Section ordering is tracked only by position in a JavaScript array. When persisting to PostgreSQL, either the array is serialized as JSON (losing relational query capability) or ordering is derived from insertion order (breaks on any reorder operation).

**Why it happens:**  
In-memory array reordering is trivial with `arrayMove()` from @dnd-kit. The database schema is an afterthought.

**Consequences:**  
- Reorder operation requires updating every row in the section table
- Race conditions in concurrent saves corrupt section ordering
- Cannot efficiently query "give me section 3" without loading all sections

**Prevention:**  
- Use an explicit `order` integer/float column on every orderable entity (sections, elements within columns)
- Use fractional indexing (e.g., `order-between` pattern) to avoid bulk updates on reorder: insert between two items by averaging their order values
- Library: `fractional-indexing` npm package
- On drag-end, update only the moved item's `order` value, not all siblings

**Phase:** Schema design (Phase 1 / Foundation).

---

## Serious Pitfalls

Mistakes that cause significant rework or quality degradation.

---

### SERIOUS-1: Single `DnDContext` for Both Palette→Canvas and Canvas Reordering

**What goes wrong:**  
Using one `DragDropProvider` / `DndContext` for both the palette (source of new elements) and the canvas (reordering existing elements). The palette items are "add new element" actions, not actual elements that exist in the canvas. Conflating the two causes:
- Palette items appearing as ghost elements in the wrong container
- Drag-end events that fire for both "add" and "reorder" operations, requiring complex if/else branching
- Unresolvable collision detection conflicts between palette and canvas zones

**Why it happens:**  
"Fewer contexts = simpler" — wrong intuition.

**Prevention:**  
Use separate, nested `DragDropProvider` contexts OR use a single context with distinct **draggable types** (`type: 'palette-layout'`, `type: 'palette-element'`, `type: 'canvas-section'`, `type: 'canvas-element'`). Use the `accept` prop on droppable zones to enforce type constraints:
```ts
// Canvas section list only accepts 'palette-layout' drops (to add new sections)
useDroppable({ id: 'canvas', accept: ['palette-layout', 'canvas-section'] })

// Column slot only accepts 'palette-element' and 'canvas-element'
useDroppable({ id: `col-${id}`, accept: ['palette-element', 'canvas-element'] })
```
Implement separate `onDragEnd` handlers by checking `source.type`.

**Phase:** Architecture decision (Phase 1 / DnD setup). Hard to refactor later.

---

### SERIOUS-2: Drop Zone Collision Detection Ambiguity in Nested Containers

**What goes wrong:**  
The canvas has two nesting levels: sections (the outer containers) and column slots (the inner containers). When dragging an element, the cursor is simultaneously "over" both the section and the column slot. Without `collisionPriority` configuration, @dnd-kit picks an arbitrary target, causing elements to be dropped into the wrong container.

**Why it happens:**  
The default collision detector (`closestCenter`) doesn't account for z-index or containment hierarchy.

**Prevention:**  
- Assign higher `collisionPriority` to inner containers (column slots) vs outer containers (sections)
  ```ts
  // Section drop zone: priority 1 (low)
  useDroppable({ id: 'section-X', collisionPriority: 1 })

  // Column slot: priority 2 (high — wins when cursor is inside column)
  useDroppable({ id: 'col-Y', collisionPriority: 2 })
  ```
- Use `closestCorners` collision detector for the element-within-column sortable, `rectIntersection` for section-level reordering
- Add visual feedback (highlighted border) on the active drop target to make the collision target visible during development

**Phase:** DnD implementation (Phase 2).

---

### SERIOUS-3: Rendering Multiple TipTap Editor Instances Simultaneously

**What goes wrong:**  
Each rich text element in the newsletter has its own TipTap editor instance. A newsletter with 10 sections × 2 rich text elements = 20 live `Editor` instances, each with its own ProseMirror document, event listeners, and mutation observers. This causes:
- Slow initial page load (500ms+ on modest hardware)
- Laggy cursor during drag operations (re-renders from all editors)
- Memory leaks if editor instances aren't destroyed on section removal

**Why it happens:**  
TipTap's React component (`<EditorContent>`) creates a new `Editor` instance per mount. With many sections, this stacks up invisibly.

**Prevention:**  
- Only mount an active editor for the **currently focused** rich text element
- All non-focused rich text blocks render as **static HTML** (using `renderToHTMLString` from `@tiptap/static-renderer`)
- On click/focus, swap the static view for an active editor
- Use `editor.destroy()` in `useEffect` cleanup to prevent leaks:
  ```ts
  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);
  ```
- Benchmark: test with 20+ rich text elements in dev tools before committing to the approach

**Phase:** Rich text implementation (Phase 2). Must profile early.

---

### SERIOUS-4: CSS Units That Break in Outlook

**What goes wrong:**  
Using `rem`, `em`, `vh`, `vw`, `vmin`, `vmax`, `ch` units in the exported HTML. Outlook Windows has **zero support** for all of these (confirmed caniemail: all `n`). Using `rem` for font sizes (common in modern React apps) means all text renders at browser default size (16px or 0) in Outlook.

**Why it happens:**  
The editor canvas (React) naturally uses `rem`/`em` for accessible typography. If the same values are passed into the export template, they break.

**Prevention:**  
- All measurements in exported HTML must use **`px` only** (for widths, font sizes, padding, margins)
- Define a mapping layer in the export pipeline: `1rem → 16px`, `1.25rem → 20px`, etc.
- Never use percentage widths for font sizes; `font-size` in px is safe
- `background-color`, `color` in hex or `rgb()` (not CSS variables, not `rgba()` without fallback)

**Caniemail verified:** `rem unit`: Outlook Windows — all `n`. `vh unit`: `n`. `vw unit`: `n`.

**Phase:** Export pipeline (Phase 3). Also affects rich text editor style definitions (Phase 2).

---

### SERIOUS-5: Gmail Strips `<style>` Tags and Breaks Responsive Media Queries

**What goes wrong:**  
Gmail on desktop webmail partially supports `<style>` (`a #1 #6` in caniemail — "supported but with restrictions"). Specifically: Gmail strips `<style>` tags for external emails, and does not support `@media` queries in most delivery contexts. Any responsive email behavior (mobile breakpoints) based on `@media` is invisible to Gmail users on mobile web.

**Why it happens:**  
Teams test responsive design in browser and in Apple Mail (which fully supports media queries) and don't test in Gmail mobile webmail.

**Consequences:**  
- "Mobile-responsive" newsletter is not responsive for Gmail mobile web users (a major segment)
- Hybrid layout approach required: fluid tables that naturally collapse, plus media queries as enhancement only

**Prevention:**  
- Design for **fluid tables first**: use `width: 100%; max-width: 600px;` with percentage-based column widths so columns collapse gracefully without media queries
- Treat media queries as progressive enhancement, not a core responsive mechanism
- Keep all critical layout and typography in inline styles

**Phase:** Export template design (Phase 3). Affects column width calculation logic.

---

### SERIOUS-6: No `border-radius` or `box-shadow` in Outlook — Button Styling Breaks

**What goes wrong:**  
Buttons designed in the canvas with rounded corners (`border-radius`) and shadows (`box-shadow`) render as sharp rectangles in Outlook Windows (caniemail: `border-radius` → Outlook Windows all `n #1`, `box-shadow` → all `n`). This is a significant visual degradation for a core element.

**Why it happens:**  
Buttons look great in the preview and Apple Mail; developers assume it works everywhere.

**Prevention:**  
- Accept that buttons will be square in Outlook; use `<!--[if mso]>` VML for rounded buttons if needed (VML shapes support border-radius in Outlook)
- Alternatively, use the MSO `v:roundrect` VML element for Outlook-specific rounded buttons
- Set user expectation explicitly in UI: "Buttons appear without rounded corners in Outlook"
- The MJML `mj-button` component implements the VML rounded-button pattern — reference it

**Phase:** Element design (Phase 2, button element).

---

### SERIOUS-7: Image Dimensions Not Set as HTML Attributes

**What goes wrong:**  
Email clients (especially Outlook) do not respect CSS `width` and `height` on images reliably when images are blocked. Without `width` and `height` HTML attributes, images with blocked loading collapse to 0×0 or show at their native resolution. The layout breaks even when images eventually load.

**Why it happens:**  
Modern React apps set image size via CSS only (e.g., `style="width:100%"`).

**Prevention:**  
- Always set **both** `width` and `height` HTML attributes on `<img>` tags in the export:
  ```html
  <img src="..." width="600" height="300" style="width:100%; max-width:600px; height:auto;" alt="">
  ```
- The `width` attribute (not CSS) controls the reserved space while images are loading/blocked
- Use `juice`'s `applyWidthAttributes: true` and `applyHeightAttributes: true` options
- Set `alt=""` on all decorative images; meaningful images should have descriptive alt text

**Phase:** Image element implementation (Phase 2) and export pipeline (Phase 3).

---

## Moderate Pitfalls

---

### MODERATE-1: TipTap List Elements Have Partial Gmail Support

**What goes wrong:**  
`<ul>` and `<ol>` lists generated by TipTap receive partial support in Gmail desktop webmail (`a #1` in caniemail for `<ul>, <ol> and <dl>`). Bullets may not render, spacing may collapse, and nested lists may break. Gmail also partially strips list-related CSS (`list-style-position` → `n` in Outlook, `list-style-image` → `n`).

**Prevention:**  
- Test bullet lists specifically in Gmail before shipping
- Use `list-style-type: disc; padding-left: 20px;` inline on `<ul>` elements (safest cross-client approach)
- Consider documenting that complex nested lists are not recommended for email newsletters
- Configure TipTap's `BulletList` and `OrderedList` extensions to emit email-safe inline styles

**Phase:** Rich text implementation (Phase 2).

---

### MODERATE-2: Not Debouncing Auto-Save Causes Database Thrashing

**What goes wrong:**  
Wiring TipTap's `onUpdate` callback directly to a backend PATCH request. A user typing "Hello World" triggers 11 separate API calls in under a second. Under normal usage, this saturates the database connection pool.

**Prevention:**  
- Debounce all save operations (minimum 1000ms debounce, 3000ms recommended)
- Use optimistic local state; only sync to backend on debounced save or explicit user action
- Show a "Saving..." / "Saved" indicator in the UI
- Consider a separate in-memory state layer (Zustand/Immer) that is the source of truth, with database as the persistence target

**Phase:** State management (Phase 2 / Backend integration).

---

### MODERATE-3: Drag-and-Drop Breaking When Canvas Sections Are Virtualized

**What goes wrong:**  
If virtual scrolling (windowing) is added to handle large newsletters, virtualized sections that are not rendered in the DOM are invisible to @dnd-kit's collision detection. Drop targets that are scrolled out of view cannot receive drops.

**Prevention:**  
- Do not virtualize the canvas in v1. Newsletters rarely exceed 30–50 sections; vertical scroll performance is fine
- If performance becomes an issue, profile first — premature virtualization is likely not needed
- If virtualization is required later: use `@dnd-kit`'s `MeasuringStrategy.Always` to force re-measurement, and keep drop targets mounted even when scrolled off-screen

**Phase:** Canvas implementation (Phase 2).

---

### MODERATE-4: Canvas Preview ≠ Email Client Render

**What goes wrong:**  
The in-browser canvas shows a beautiful WYSIWYG representation using modern CSS. The exported HTML looks completely different in Outlook, causing user complaints ("your tool is broken"). Users don't understand the gap between web and email rendering.

**Prevention:**  
- Add explicit in-app copy: "Exported HTML is optimized for email clients. Outlook may render differently."
- Optionally, add a read-only "email preview" mode that renders the exported HTML inside an `<iframe>` (sandboxed) to give users a more realistic preview
- Document known Outlook limitations (no rounded corners, no shadows) in the UI tooltip/help

**Phase:** UX design (Phase 2–3).

---

### MODERATE-5: Saving TipTap HTML Instead of TipTap JSON

**What goes wrong:**  
Saving `editor.getHTML()` to the database instead of `editor.getJSON()`. HTML is ambiguous and lossy — TipTap cannot reliably reconstruct its internal document state from arbitrary HTML. Round-tripping through HTML can lose marks, custom node attributes, or inline styles.

**Prevention:**  
- Always persist `editor.getJSON()` (returns a JSON ProseMirror document)
- Load content with `editor.commands.setContent(json, false)` (second arg = don't emit update event)
- HTML is generated on-demand at export time via `renderToHTMLString`

**Phase:** Data model / persistence (Phase 1–2).

---

### MODERATE-6: Not Resetting MSO Table Spacing in Email Document Head

**What goes wrong:**  
Outlook adds default cell padding and spacing to tables rendered by its Word engine. A carefully spaced column layout with `cellpadding="0" cellspacing="0"` HTML attributes looks correct, but Outlook's default styles override them, creating mysterious gaps between columns.

**Prevention:**  
Include Outlook reset styles in the exported HTML `<head>` (required every time):
```html
<style type="text/css">
  #outlook a { padding: 0; }
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  p { display: block; margin: 13px 0; }
</style>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings>
  <o:AllowPNG/>
  <o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
```
Also: always set `cellpadding="0"` and `cellspacing="0"` as HTML attributes on all `<table>` elements in the export.

**Phase:** Export template (Phase 3).

---

### MODERATE-7: Missing `xmlns:v` and `xmlns:o` Namespace Declarations

**What goes wrong:**  
If using VML shapes for Outlook (required for background images in sections, or rounded buttons), the HTML `<html>` tag must declare the Microsoft VML namespaces. Without them, Outlook ignores all VML content silently.

**Prevention:**  
Always use this doctype and html tag in exported email HTML:
```html
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
```
Source: This is the exact pattern used by MJML's skeleton generator (verified from MJML source).

**Phase:** Export template (Phase 3).

---

## Minor Pitfalls

---

### MINOR-1: Using `rgba()` Without Fallback for Outlook

`rgba()` has zero support in Outlook Windows. Use `background-color` with a solid hex color as the primary value and `rgba()` as an enhancement only. Gmail also has only partial support.

**Prevention:** Always provide a solid hex fallback: `background-color: #ff0000; background-color: rgba(255,0,0,0.8);` — Outlook uses the first value, modern clients use the second.

---

### MINOR-2: `<a>` Tag Color Reset in Outlook

Outlook and some email clients override `<a>` tag colors to their default blue/purple, even with inline `color:` styles. The `#outlook a { padding: 0; }` reset is mandatory. Add `style="color: inherit; text-decoration: none;"` on links inside buttons, then use explicit color values.

---

### MINOR-3: TipTap Links Open in Same Tab by Default

TipTap's `Link` extension generates `<a href="...">` without `target="_blank"`. Email recipients expect links to open in a new tab. Configure the Link extension: `Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } })`.

---

### MINOR-4: SVG Images Not Supported in Email

SVG format is not supported as an image source in email clients (caniemail: Outlook — `n`, Gmail — `n`). If users upload or reference SVGs, they will be invisible in exported emails. Either block SVG uploads or auto-convert to PNG at export time.

**Prevention:** Validate image URLs in the element editor; warn users if SVG is detected.

---

### MINOR-5: Image Alt Text Omission Breaks Accessibility and Text-Only Rendering

Many corporate Outlook configurations block images by default. Without alt text, the newsletter is completely unreadable when images are blocked. Alt text also impacts spam scoring.

**Prevention:** Make the `alt` field required in the image element editor (not optional).

---

### MINOR-6: Undefined Section Key During Drag Causes React Key Warning and State Corruption

When a section is dragged and a new item is inserted while the drag is in-flight, React re-renders the list with potentially duplicated or undefined keys. @dnd-kit maintains its own identity tracking; mismatched React keys cause visual glitches.

**Prevention:** Use stable UUIDs as React keys for all sections and elements — never use array index as key.

---

### MINOR-7: Large Newsletter File Size Causing Email Delivery Issues

Gmail clips emails larger than 102KB by showing a "view entire message" link and hiding content below the fold. A newsletter with many large inline images (base64-encoded) or verbose HTML easily exceeds this.

**Prevention:**
- Reference images by URL — never embed as base64 in the email body
- Minify the exported HTML (remove unnecessary whitespace)
- Test exported file sizes — target < 70KB for safe delivery
- Document: "Images must be hosted at a public URL; no base64 embedding"

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Data model design | Storing HTML not JSON; array-index ordering | Define JSON schema and fractional ordering in schema design |
| Phase 1: TipTap setup | Using default HTML output mode | Configure all extensions with inline-style `renderHTML` from day one |
| Phase 2: Rich text editing | Multiple live editor instances | Virtualize editors: one active instance, rest render as static HTML |
| Phase 2: DnD implementation | Single context for palette + canvas | Use `type`/`accept` constraints or separate contexts |
| Phase 2: DnD nested containers | Collision detection picking wrong target | Set `collisionPriority: 2` on column slots vs sections |
| Phase 2: Button element | `border-radius` invisible in Outlook | Document Outlook limitation; use VML fallback if required |
| Phase 2: Image element | Missing `width`/`height` HTML attributes | Always set both attributes; wire to juice's `applyWidthAttributes` |
| Phase 3: Export pipeline | CSS classes in TipTap output | Run through static renderer with custom inline-style mappings |
| Phase 3: Multi-column layout | Flexbox/grid in export | Generate `<!--[if mso]>` conditional table wrappers per layout type |
| Phase 3: Export HTML head | Missing MSO resets | Include MJML-style reset block in every exported document |
| Phase 3: Auto-save | Database thrashing on keystrokes | 1000ms debounce on all save operations |

---

## Sources

| Source | Type | Confidence |
|--------|------|------------|
| caniemail.com API (`/api/data.json`, 307 items) | Verified live data | HIGH |
| MJML source code (`mjml-core/src/helpers/skeleton.js`, `mjml-section/src/index.js`) | Verified library code | HIGH |
| TipTap docs via Context7 (`/ueberdosis/tiptap-docs`) | Verified docs | HIGH |
| @dnd-kit docs via Context7 (`/clauderic/dnd-kit`) | Verified docs | HIGH |
| juice library docs via Context7 (`/automattic/juice`) | Verified docs | HIGH |
| MJML core rendering pattern (`juice` usage, MSO conditional generation) | Verified library code | HIGH |
