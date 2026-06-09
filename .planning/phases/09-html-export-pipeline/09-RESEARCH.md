# Phase 9 Research — HTML Export Pipeline

**Gathered:** 2026-06-14  
**Method:** Direct codebase analysis

---

## 1. Phase Goal

Produce a self-contained `.html` file download from the current newsletter that satisfies:
- **EXPORT-01** Trigger download from the builder UI
- **EXPORT-02** Table-based layout (no flex/grid) — Outlook compatibility
- **EXPORT-03** All CSS inlined in `style=""` attributes — Gmail compatibility
- **EXPORT-04** `<!--[if mso]>` conditional comments for Outlook multi-column
- **EXPORT-05** Header + footer preset HTML embedded
- **EXPORT-06** Pre-header hidden span near `<body>` open
- **EXPORT-07** Browser downloads a `.html` file

---

## 2. Codebase Findings

### 2.1 NewsletterDoc Structure (newsletter.ts)
```typescript
interface NewsletterDoc {
  header: { presetId: string; variables: Record<string,string> }
  footer: { presetId: string; variables: Record<string,string> }
  rows: Section[]                   // ordered list of canvas rows
  globalStyles: { fontFamily, backgroundColor, contentWidth, primaryColor }
  preHeader?: string                // max 90 chars
}
interface Section {
  id: string
  layoutType: '1col' | '2col' | '3col' | 'small-left-big-right' | 'big-left-small-right'
  slots: ColumnSlot[]
  backgroundColor?: string
  paddingTop?: number; paddingBottom?: number
}
interface ColumnSlot {
  id: string
  element: ElementUnion | null
}
```

### 2.2 ElementUnion (5 types)
- `ImageElement` — src, alt, width? (→ `<img>` with width/height attrs + max-width style)
- `ImageLinkElement` — src, alt, href, width? (→ `<a><img></a>`)
- `ButtonElement` — label, href, backgroundColor, textColor, borderRadius?, style ('solid'|'outline'|'ghost')
- `RichTextElement` — content: TiptapJSONDoc, textStyle: 'header'|'subheader'|'body'|'code'
- `DividerElement` — color, spacing, thickness

### 2.3 TipTap JSON Schema
The TipTap JSON format produced by Phase 7 extensions (StarterKit + TextStyleKit + TextAlign):
- `{ type: 'doc', content: TiptapNode[] }`
- Nodes: `paragraph`, `heading` (attrs.level), `bulletList`, `orderedList`, `listItem`, `hardBreak`
- Text node marks: `bold`, `italic`, `underline`, `link` (attrs.href), `textStyle` (attrs.color, attrs.fontSize, attrs.fontFamily)
- Block-level attrs: `textAlign` from TextAlign extension ('left'|'center'|'right'|'justify')
- All marks emit **inline styles** (not CSS classes) — CC-2 is already satisfied in Phase 7

### 2.4 Layout Column Widths
The ROADMAP/ARCHITECTURE maps layoutType → column percentages:
- `1col` → 100%
- `2col` → 50% / 50%
- `3col` → 33.33% / 33.33% / 33.33%
- `small-left-big-right` → 33% / 67%
- `big-left-small-right` → 67% / 33%

### 2.5 Existing Server Stack
Server deps (apps/server/package.json): fastify 5.8.5, zod 4.4.3, drizzle-orm 0.45.2, postgres 3.4.9
No react, no react-email, no juice installed yet.

### 2.6 Preset System (Phase 8)
- `apps/server/src/routes/presets.ts` → `GET /presets/:id` returns `{ id, type, name, htmlContent }`
- Preset HTML is raw HTML, developer-authored seed data
- For export, the route handler can query the DB directly for preset HTML (same DB, same Drizzle connection)

### 2.7 DB Connectivity Warning
- `ECONNRESET` errors occur when trying to connect to Neon DB in this environment (likely cold-start issue)
- The export route requires DB access — unit tests should mock the DB layer
- Integration test can be skipped (pattern established by useAutoSave tests in client)

### 2.8 "Export" Button Already Exists
`BuilderHeader.tsx` (line 158-164) has an Export button that currently shows a toast:
```tsx
<Button variant="outline" size="sm" onClick={() => toast('Export is not yet available')}>
  Export
</Button>
```
Phase 9 replaces the toast with an actual fetch + download.

---

## 3. Architecture Decision: Server-Side Pipeline

**Decision: Server-side export pipeline (as ROADMAP specifies)**

Rationale:
- ROADMAP Plan 7 explicitly specifies `POST /newsletters/:id/export`
- Server has direct DB access for preset HTML retrieval
- Keeps client thin — just a fetch() + Blob download
- All pipeline logic (react-email, juice, MSO) in one place on server
- Unit-testable pipeline functions with static fixtures (no DB needed for unit tests)

**Server packages to install:**
```
react@^19.0.0
react-dom@^19.0.0
@react-email/components@^0.0.21
@react-email/render@^1.0.3
juice@^12.1.0
```
(juice is listed as planned dependency in STATE.md)

**Rich-text HTML generation on server:**
Install `@tiptap/static-renderer@^3.26.0` + required extensions:
- `@tiptap/starter-kit@^3.26.0`
- `@tiptap/extension-text-style@^3.26.0`
- `@tiptap/extension-text-align@^3.26.0`

MUST use same extension list as `RICH_TEXT_EXTENSIONS` in `apps/client/src/lib/tiptap-extensions.ts`.
**NOTE**: `@tiptap/static-renderer` requires minimal DOM shims. Alternatively, write a bespoke `tiptapToHtml()` recursive converter — avoids all TipTap server-side deps. Bespoke converter is ~50 lines for the node types we use and eliminates TipTap version lock between client and server.

**Decision: Bespoke tiptapToHtml() converter** (no TipTap on server)
- Handles: doc, paragraph (+ textAlign), heading (level + textAlign), text (+ marks), bulletList, orderedList, listItem, hardBreak
- Marks: bold→`<strong>`, italic→`<em>`, underline→`<u>`, link→`<a href>`, textStyle→`<span style="color:...;font-size:...">`
- Block attrs: textAlign → `style="text-align:..."` on p/h tags
- Preset wrapper div with font-size/line-height from PRESET_STYLES constant

---

## 4. react-email API

### 4.1 Installation (v0.0.21 or latest stable)
```json
// apps/server/package.json
"@react-email/components": "^0.0.21",
"@react-email/render": "^1.0.3",
"react": "^19.0.0",
"react-dom": "^19.0.0"
```

### 4.2 Components Used
```tsx
import { Html, Head, Body, Section, Row, Column, render } from '@react-email/components'
// OR: import from individual packages
```

### 4.3 render() API
```tsx
import { render } from '@react-email/render'
const html: string = await render(<EmailDocument doc={...} />, { pretty: false })
```

### 4.4 Table Output
- `<Section>` → `<table><tr><td>` (single column, full width)
- `<Row>` → `<table><tr>` (multiple columns)  
- `<Column>` → `<td>` within a Row

---

## 5. Juice CSS Inliner

```ts
import juice from 'juice'
const inlined: string = juice(html, {
  removeStyleTags: true,
  preserveMediaQueries: false,
  applyAttributesTableElements: false,
})
```

Juice reads `<style>` blocks, inlines rules into `style=""`, then removes the `<style>` block.
react-email may inject `<style>` blocks in `<head>` — juice removes them after inlining.

---

## 6. DOCTYPE + MSO Wrapper

### 6.1 XHTML 1.0 Transitional with VML namespaces
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
```

### 6.2 MSO Reset Block (in `<head>`)
```html
<!--[if mso]>
<noscript>
  <xml><o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
```

### 6.3 Multi-Column MSO Wrapper (PITFALL-2)
For rows with 2+ columns, wrap with MSO VML table:
```html
<!--[if mso]>
<table role="presentation" width="600">
  <tr>
    <td width="300" valign="top">
<!--<![endif]-->
  {left column content}
<!--[if mso]>
    </td>
    <td width="300" valign="top">
<!--<![endif]-->
  {right column content}
<!--[if mso]>
  </tr>
</table>
<![endif]-->
```

---

## 7. Pre-Header Hidden Span

Inject immediately after `<body>` open:
```html
<span style="display:none;font-size:1px;color:#ffffff;max-height:0;overflow:hidden;opacity:0;">
  {preHeader text}
</span>
```
Only inject if `preHeader` is non-empty. The `&zwnj;` filler trick (zero-width non-joiners) can pad to 90 chars if needed to prevent preview bleed, but 90-char limit from Phase 8 makes it optional.

---

## 8. Export Button Client-Side Wiring

Replace toast in `BuilderHeader.tsx`:
```tsx
const [isExporting, setIsExporting] = useState(false)

const handleExport = async () => {
  setIsExporting(true)
  try {
    const res = await fetch(`/newsletters/${id}/export`, { method: 'POST' })
    if (!res.ok) throw new Error('Export failed')
    const html = await res.text()
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error('Export failed. Please try again.')
  } finally {
    setIsExporting(false)
  }
}
```

---

## 9. Wave Structure

| Wave | Plans | What |
|------|-------|------|
| 0 | 09-00 | TDD RED stubs |
| 1 | 09-01 | Package setup + EmailDocument primitives |
| 2 | 09-02, 09-03 | Element renderers + documentToEmailTree() |
| 3 | 09-04, 09-05 | render() + juice + DOCTYPE + MSO |
| 4 | 09-06 | Export API route |
| 5 | 09-07 | Export button UI + BuilderHeader wiring |

---

## 10. TDD Plan (Phase 9 tests)

All tests go in `apps/server/src/__tests__/` (new) or `apps/client/src/` (existing):

**Server tests** (new vitest config or jest):
- `tiptapToHtml.test.ts` — paragraph, heading, text marks, lists, textAlign
- `elementRenderers.test.ts` — each element type produces valid HTML
- `documentToEmailTree.test.ts` — full doc with header/footer/preheader
- `exportPipeline.test.ts` — render + juice → no flex/grid, no `<style>` blocks

**Client tests** (existing vitest):
- `BuilderHeader.test.tsx` — export button calls fetch, shows loading state, downloads file

**TipTap JSON fixture** (reuse FIXTURE_DOC from client):
The server tests need a NewsletterDoc fixture — create `apps/server/src/__tests__/fixtures/export.fixture.ts`.

---

## 11. Package Version Research

```
react-email: check npm for latest @react-email/components stable
juice: 12.1.0 (listed in STATE.md planned deps)
react (server): 19.0.0 (match client)
```

**Check before installing:**
```bash
pnpm info @react-email/components version  # find latest stable
pnpm info @react-email/render version
```
