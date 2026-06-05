# Architecture Patterns: NL Layouter

**Domain:** Web-based visual email/newsletter builder
**Researched:** 2026-06-05
**Confidence:** HIGH (verified against Context7 docs for @dnd-kit, TipTap, react-email, Zustand/Immer, Juice, Prisma, Fastify)

---

## Recommended Architecture

A three-layer system: a React SPA (builder UI) that maintains a JSON document as its canonical state, a Fastify REST API that stores documents in PostgreSQL and hosts the HTML rendering pipeline, and an HTML export engine (`react-email` + `juice`) that converts the JSON document into email-client–compatible HTML.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ┌───────────────────────────┐  ┌──────────────────────────┐   │
│  │  BuilderCanvas (left)     │  │  BuilderPalette (right)  │   │
│  │  • SortableRowList        │  │  • LayoutCards           │   │
│  │    └── RowBlock           │  │  • ElementCards          │   │
│  │         └── ColumnGrid    │  └──────────────────────────┘   │
│  │              └── Slot     │           ↕ @dnd-kit            │
│  └───────────────────────────┘                                  │
│            ↕  Zustand + Immer  (NewsletterDoc JSON)             │
└───────────────────────────────────┬─────────────────────────────┘
                                    │ fetch (JWT)
┌───────────────────────────────────▼─────────────────────────────┐
│  Fastify API                                                     │
│  • /auth  (register, login, me)                                  │
│  • /newsletters  (CRUD, GET/PUT document as JSONB)               │
│  • /newsletters/:id/export  (render → HTML download)            │
│  • /presets  (header/footer seed data)                           │
│                                                                  │
│  Export pipeline:                                                │
│  NewsletterDoc JSON → react-email render() → juice inline CSS   │
│  → <!DOCTYPE> wrapper → .html file response                      │
└───────────────────────────────────┬─────────────────────────────┘
                                    │ Prisma ORM
┌───────────────────────────────────▼─────────────────────────────┐
│  PostgreSQL                                                      │
│  • users  (id, email, password_hash)                             │
│  • newsletters  (id, owner_id, title, document JSONB)            │
│  • presets  (id, type, name, html_template, variables JSONB)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

### Frontend Component Tree

```
App
├── AuthProvider           (JWT context, useAuth hook)
├── Router
│   ├── /login             → LoginPage
│   ├── /register          → RegisterPage
│   ├── /newsletters       → NewsletterListPage
│   │   ├── NewsletterCard (title, last-saved, export button)
│   │   └── CreateNewsletterButton
│   └── /newsletters/:id   → BuilderPage
│       ├── BuilderHeader  (title input, save status, export button)
│       ├── BuilderCanvas  (left panel, ~65% width)
│       │   ├── DragDropProvider  (@dnd-kit/react wraps everything)
│       │   ├── HeaderPresetSlot  (non-sortable, always at top)
│       │   ├── SortableRowList   (the core canvas)
│       │   │   └── RowBlock[]    (useSortable, drag handle + delete)
│       │   │       └── ColumnGrid (renders 1–3 column cells per layoutType)
│       │   │           └── ColumnSlot[] (useDroppable, accepts elements)
│       │   │               └── ElementRenderer
│       │   │                   (image | image-link | button | rich-text | EmptySlot)
│       │   └── FooterPresetSlot  (non-sortable, always at bottom)
│       └── BuilderPalette (right panel, ~35% width)
│           ├── LayoutSection   (5 draggable layout type cards)
│           └── ElementSection  (4 draggable element type cards)
│               [Switches to InspectorPanel when an element is selected]
│               └── InspectorPanel
│                   ├── ImageEditor   (src, alt, width fields)
│                   ├── ButtonEditor  (label, href, colors, style)
│                   └── RichTextEditor (TipTap instance)
```

### Backend Services

| Module | Responsibility |
|--------|---------------|
| `auth` plugin | JWT issue/verify, bcrypt password hash, register/login routes |
| `newsletters` plugin | CRUD for newsletter documents, ownership guard |
| `export` service | `NewsletterDoc → react-email → juice → HTML string` |
| `presets` plugin | Seed-loaded header/footer template registry |
| `db` plugin | Prisma client singleton, connection lifecycle |

---

## Data Model

### Core TypeScript Types

The entire newsletter is a single JSON document (`NewsletterDoc`) stored in a PostgreSQL `JSONB` column. It is always loaded and saved atomically — no per-row or per-element queries.

```typescript
// ─── Top-level document ─────────────────────────────────────────
interface NewsletterDoc {
  header:       HeaderConfig;
  rows:         Row[];
  footer:       FooterConfig;
  globalStyles: GlobalStyles;
}

interface GlobalStyles {
  fontFamily:       string;   // e.g. "Arial, sans-serif"
  backgroundColor:  string;   // e.g. "#f4f4f4"
  contentWidth:     number;   // e.g. 600  (px)
  primaryColor:     string;   // e.g. "#0066cc"
}

// ─── Row (layout section) ────────────────────────────────────────
type LayoutType =
  | '1col'
  | '2col'
  | '3col'
  | 'small-left-big-right'   // 33% / 67% split
  | 'big-left-small-right';  // 67% / 33% split

interface Row {
  id:              string;       // UUID — stable identity for DnD keys
  layoutType:      LayoutType;
  slots:           Slot[];       // length always matches layoutType column count
  backgroundColor?: string;
  paddingTop?:      number;      // px
  paddingBottom?:   number;      // px
}

// ─── Column slot ─────────────────────────────────────────────────
interface Slot {
  id:      string;              // UUID
  element: Element | null;      // null = empty/droppable slot
}

// ─── Element (discriminated union) ───────────────────────────────
type Element =
  | ImageElement
  | ImageLinkElement
  | ButtonElement
  | RichTextElement;

interface ImageElement {
  type:   'image';
  id:     string;
  src:    string;
  alt:    string;
  width?: string;   // e.g. "100%" or "300px"
}

interface ImageLinkElement {
  type:   'image-link';
  id:     string;
  src:    string;
  alt:    string;
  href:   string;
  width?: string;
}

interface ButtonElement {
  type:            'button';
  id:              string;
  label:           string;
  href:            string;
  backgroundColor: string;
  textColor:       string;
  borderRadius?:   string;
  style:           'solid' | 'outline' | 'ghost';
}

interface RichTextElement {
  type:      'rich-text';
  id:        string;
  content:   TiptapJSONDoc;   // TipTap's JSONContent — { type: 'doc', content: [...] }
  textStyle: 'header' | 'subheader' | 'body' | 'code';
}

// ─── Header / Footer ─────────────────────────────────────────────
interface HeaderConfig {
  presetId:  string;                    // e.g. "header-minimal"
  variables: Record<string, string>;    // { logoUrl, companyName, tagline }
}

interface FooterConfig {
  presetId:  string;                    // e.g. "footer-legal"
  variables: Record<string, string>;    // { companyAddress, unsubscribeUrl }
}
```

### Concrete Example JSON Document

```json
{
  "header": {
    "presetId": "header-logo-center",
    "variables": {
      "logoUrl": "https://example.com/logo.png",
      "companyName": "Acme Corp"
    }
  },
  "globalStyles": {
    "fontFamily": "Arial, sans-serif",
    "backgroundColor": "#f4f4f4",
    "contentWidth": 600,
    "primaryColor": "#0066cc"
  },
  "rows": [
    {
      "id": "row-uuid-1",
      "layoutType": "1col",
      "backgroundColor": "#ffffff",
      "paddingTop": 24,
      "paddingBottom": 24,
      "slots": [
        {
          "id": "slot-uuid-1",
          "element": {
            "type": "rich-text",
            "id": "el-uuid-1",
            "textStyle": "header",
            "content": {
              "type": "doc",
              "content": [
                {
                  "type": "paragraph",
                  "content": [{ "type": "text", "text": "Welcome to our newsletter!" }]
                }
              ]
            }
          }
        }
      ]
    },
    {
      "id": "row-uuid-2",
      "layoutType": "small-left-big-right",
      "backgroundColor": "#ffffff",
      "paddingTop": 16,
      "paddingBottom": 16,
      "slots": [
        {
          "id": "slot-uuid-2",
          "element": {
            "type": "image-link",
            "id": "el-uuid-2",
            "src": "https://example.com/product.jpg",
            "alt": "Product photo",
            "href": "https://example.com/product",
            "width": "100%"
          }
        },
        {
          "id": "slot-uuid-3",
          "element": {
            "type": "rich-text",
            "id": "el-uuid-3",
            "textStyle": "body",
            "content": {
              "type": "doc",
              "content": [
                {
                  "type": "paragraph",
                  "content": [{ "type": "text", "text": "Check out our newest product." }]
                }
              ]
            }
          }
        }
      ]
    },
    {
      "id": "row-uuid-3",
      "layoutType": "1col",
      "backgroundColor": "#ffffff",
      "paddingTop": 16,
      "paddingBottom": 32,
      "slots": [
        {
          "id": "slot-uuid-4",
          "element": {
            "type": "button",
            "id": "el-uuid-4",
            "label": "Shop Now",
            "href": "https://example.com/shop",
            "backgroundColor": "#0066cc",
            "textColor": "#ffffff",
            "borderRadius": "4px",
            "style": "solid"
          }
        }
      ]
    }
  ],
  "footer": {
    "presetId": "footer-legal",
    "variables": {
      "companyAddress": "123 Main St, Springfield",
      "unsubscribeUrl": "https://example.com/unsubscribe"
    }
  }
}
```

---

## HTML Rendering Pipeline

```
NewsletterDoc (JSON)
      │
      ▼ Step 1: JSON → React tree (server-side, Node.js)
      │
      │  deserializeDoc(doc) produces JSX like:
      │  <EmailRoot width={600} bgColor={globalStyles.backgroundColor}>
      │    <HeaderPreset preset={header} />
      │    {rows.map(row => <RowRenderer row={row} />)}
      │    <FooterPreset preset={footer} />
      │  </EmailRoot>
      │
      │  RowRenderer maps layoutType → column widths:
      │    '1col'                → [100%]
      │    '2col'                → [50%, 50%]
      │    '3col'                → [33%, 33%, 33%]
      │    'small-left-big-right'→ [33%, 67%]
      │    'big-left-small-right'→ [67%, 33%]
      │
      │  Each column maps to a react-email <Column> inside a <Row>/<Section>
      │  (Section renders as <table align="center" width="100%">)
      │
      ▼ Step 2: react-email render()
      │
      │  import { render } from 'react-email'
      │  const rawHtml = await render(<EmailDocument doc={doc} />)
      │  → table-based HTML with inline styles, Outlook-compatible
      │
      ▼ Step 3: juice(rawHtml) — belt-and-suspenders CSS inlining
      │
      │  Catches any remaining class-based styles from TipTap output.
      │  juice options: { preserveMediaQueries: true, applyWidthAttributes: true }
      │
      ▼ Step 4: Wrap with email DOCTYPE boilerplate
      │
      │  Adds <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"...>
      │  Adds <meta charset>, <meta name="viewport">, X-UA-Compatible metas
      │  Adds MSO conditional comments for Outlook table width fixes
      │
      ▼ Step 5: Serve as file download
      │
      │  Content-Type: text/html
      │  Content-Disposition: attachment; filename="newsletter-title.html"
      │
      ▼ Result: standalone .html file, email-client compatible
```

### RichText Element Rendering Detail

TipTap content (stored as TipTap JSON) is converted server-side:

```typescript
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

// Called during render, per RichTextElement
function richTextToHTML(element: RichTextElement): string {
  const baseHTML = generateHTML(element.content, [StarterKit])
  // Apply textStyle-based wrapper class (becomes inline style via juice)
  return `<div class="text-style-${element.textStyle}">${baseHTML}</div>`
}
```

---

## Database Schema

### Prisma Schema

```prisma
// schema.prisma

model User {
  id           String       @id @default(uuid())
  email        String       @unique
  passwordHash String       @map("password_hash")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")
  newsletters  Newsletter[]

  @@map("users")
}

model Newsletter {
  id        String   @id @default(uuid())
  ownerId   String   @map("owner_id")
  title     String
  document  Json     // NewsletterDoc stored as JSONB
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@index([ownerId])
  @@map("newsletters")
}

model Preset {
  id           String @id      // e.g. "header-logo-center"
  type         String          // "header" | "footer"
  name         String          // Display name
  htmlTemplate String          // Handlebars template string
  variables    Json            // variable schema: { logoUrl: { label, default } }

  @@map("presets")
}
```

### Key design notes

- `document JSONB` stores the entire `NewsletterDoc` — no per-row/element tables. Documents are always read/written whole; there is no need to query sub-document structure from SQL.
- `Preset.htmlTemplate` uses Handlebars syntax (`{{companyName}}`) so the export pipeline can interpolate user-supplied variables. Preset rows are seeded at startup, not managed by users in v1.
- Newsletter list queries (`SELECT id, title, updated_at FROM newsletters WHERE owner_id = $1`) intentionally exclude the `document` column — load it only when opening the builder.

---

## Backend API Surface

```
POST   /api/auth/register
         body: { email, password }
         → 201 { user: { id, email }, token }

POST   /api/auth/login
         body: { email, password }
         → 200 { user: { id, email }, token }

GET    /api/auth/me
         header: Authorization: Bearer <jwt>
         → 200 { id, email }

GET    /api/newsletters
         → 200 { newsletters: [{ id, title, updatedAt }] }  (document excluded)

POST   /api/newsletters
         body: { title }
         → 201 { id, title, document: <empty NewsletterDoc> }

GET    /api/newsletters/:id
         → 200 { id, title, document: NewsletterDoc }

PUT    /api/newsletters/:id
         body: { title?, document? }
         → 200 { id, title, updatedAt }

DELETE /api/newsletters/:id
         → 204

POST   /api/newsletters/:id/export
         → 200  Content-Type: text/html
                Content-Disposition: attachment; filename="<title>.html"
                (rendered, juice-inlined, email-compatible HTML)

GET    /api/presets/headers
         → 200 { presets: [{ id, name, variables }] }

GET    /api/presets/footers
         → 200 { presets: [{ id, name, variables }] }
```

All routes except `/api/auth/register` and `/api/auth/login` require `Authorization: Bearer <jwt>`. Fastify's plugin scoping means the JWT `preHandler` hook is registered once on the authenticated plugin scope.

---

## Frontend State Architecture

### Zustand Store Shape

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface BuilderStore {
  // Document state
  newsletterId:   string | null
  title:          string
  doc:            NewsletterDoc
  isDirty:        boolean
  isSaving:       boolean

  // Selection state
  selectedElementId: string | null

  // Actions — produce new doc via Immer
  setTitle:            (title: string) => void
  addRow:              (layoutType: LayoutType, atIndex?: number) => void
  removeRow:           (rowId: string) => void
  reorderRows:         (fromIndex: number, toIndex: number) => void
  setElementInSlot:    (rowId: string, slotId: string, element: Element | null) => void
  updateElement:       (elementId: string, patch: Partial<Element>) => void
  moveElement:         (fromSlotId: string, toSlotId: string) => void
  setHeaderPreset:     (presetId: string, variables: Record<string, string>) => void
  setFooterPreset:     (presetId: string, variables: Record<string, string>) => void
  updateGlobalStyles:  (patch: Partial<GlobalStyles>) => void
  selectElement:       (id: string | null) => void

  // Persistence
  loadNewsletter:  (id: string) => Promise<void>
  saveNewsletter:  () => Promise<void>
}
```

Immer middleware allows direct mutation syntax (`state.doc.rows.splice(index, 1)`) while producing immutable state updates — essential for the deeply nested `Row → Slot → Element` hierarchy.

### DnD Interaction Model

Two distinct drag interaction types must coexist without collision. Use @dnd-kit's `type` / `accept` system:

| Interaction | Source | Target | `type` value |
|-------------|--------|--------|--------------|
| Add layout row | Palette LayoutCard | Canvas row list | `'layout-card'` |
| Reorder rows | RowBlock drag handle | SortableRowList | `'row'` |
| Place element | Palette ElementCard | ColumnSlot | `'element-card'` |
| Move element | Filled ColumnSlot | Empty ColumnSlot | `'element'` |

```typescript
// Palette layout card (draggable only, creates a new row on drop)
const {ref} = useDraggable({ id: `palette-${layoutType}`, type: 'layout-card' })

// Canvas row (sortable — both draggable and droppable)
const {ref} = useSortable({ id: row.id, index, type: 'row', accept: ['row'] })

// Column slot (droppable — accepts elements)
const {ref} = useDroppable({ id: slot.id, type: 'slot', accept: ['element-card', 'element'] })

// onDragEnd dispatcher in DragDropProvider:
function onDragEnd(event) {
  const { source, target } = event.operation
  if (source.type === 'layout-card') {
    store.addRow(source.data.layoutType, target?.index ?? store.doc.rows.length)
  }
  if (source.type === 'row' && isSortable(source)) {
    store.reorderRows(source.initialIndex, source.index)
  }
  if (source.type === 'element-card') {
    store.setElementInSlot(target.data.rowId, target.id, createElement(source.data.elementType))
  }
  if (source.type === 'element') {
    store.moveElement(source.data.slotId, target.id)
  }
}
```

---

## Suggested Build Order

Dependencies flow strictly top-to-bottom. Each phase is unblocked only after the one above it.

```
Phase 1: Foundation — Auth + User management
│   User model, bcrypt, JWT, register/login routes, AuthProvider in React
│   ↳ Unblocks: everything that requires "whose newsletter is this?"
│
Phase 2: Newsletter CRUD + persistence
│   DB schema (users, newsletters), Prisma client, API routes (list/create/load/save)
│   React: NewsletterListPage, fetch hooks
│   ↳ Unblocks: builder can load and save documents
│
Phase 3: Core data model + canvas rendering (read-only)
│   Define TypeScript types, empty-document factory, Zustand store scaffold
│   BuilderCanvas renders a static NewsletterDoc (no DnD yet)
│   RowBlock, ColumnGrid, ElementRenderer (all types), EmptySlot
│   ↳ Unblocks: visual preview; confirms type model is correct before DnD
│
Phase 4: DnD — row-level operations
│   DragDropProvider, palette LayoutCards (useDraggable), SortableRowList (useSortable)
│   Add row from palette, reorder rows, delete row
│   ↳ Unblocks: structural canvas editing
│
Phase 5: DnD — element placement
│   Palette ElementCards (useDraggable), ColumnSlot (useDroppable)
│   Place element from palette into slot, move element between slots
│   ↳ Unblocks: content editing
│
Phase 6: Element property editors (InspectorPanel)
│   ImageEditor, ButtonEditor, TipTap RichTextEditor (styled per textStyle preset)
│   InspectorPanel replaces palette when element is selected
│   ↳ Unblocks: meaningful content
│
Phase 7: Header/Footer presets
│   Preset seed data, API endpoints, PresetSelector UI
│   ↳ Relatively self-contained; could slot before Phase 6 if desired
│
Phase 8: HTML export pipeline
│   react-email render(), juice CSS inliner, DOCTYPE wrapper, /export endpoint
│   Download response from frontend
│   ↳ Requires Phases 1–7 for meaningful test content
│
Phase 9: Polish
│   Auto-save (debounce PUT on doc changes), save indicator, error boundaries
│   Global styles editor (font, background color, content width)
│   Empty-state UX (new newsletter wizard)
```

---

## Patterns to Follow

### Pattern 1: Flat ID Map + Ordered Array for Canvas State

Rather than storing row objects inline in a plain array, maintain a normalized map alongside the ordered list. This makes O(1) element lookup safe when DnD callbacks fire.

```typescript
// Preferred over naive nested array
interface CanvasState {
  rowOrder:  string[];                  // [ 'row-1', 'row-2', 'row-3' ]
  rows:      Record<string, Row>;       // { 'row-1': Row, ... }
  slots:     Record<string, Slot>;      // { 'slot-1': Slot, ... }
}
```

With Immer, mutations stay readable: `state.rows[rowId].slots[0].element = newElement`.

### Pattern 2: Column Width Resolution Table

Never compute column widths at render time from layout names. Use a lookup table:

```typescript
const COLUMN_WIDTHS: Record<LayoutType, string[]> = {
  '1col':                  ['100%'],
  '2col':                  ['50%', '50%'],
  '3col':                  ['33.33%', '33.33%', '33.33%'],
  'small-left-big-right':  ['33%', '67%'],
  'big-left-small-right':  ['67%', '33%'],
}
```

### Pattern 3: React Email Components as Single Source of Truth for Rendering

Define `<RowRenderer>`, `<SlotRenderer>`, `<ElementRenderer>` as react-email–compatible components. The same components used for the export pipeline can also drive the **canvas preview** when wrapped in a preview iframe. This eliminates a parallel rendering path.

```typescript
// Used in both export pipeline (server-side render) and live preview (iframe)
export function RowRenderer({ row }: { row: Row }) {
  const widths = COLUMN_WIDTHS[row.layoutType]
  return (
    <Section style={{ backgroundColor: row.backgroundColor }}>
      <Row>
        {row.slots.map((slot, i) => (
          <Column key={slot.id} style={{ width: widths[i], verticalAlign: 'top' }}>
            <SlotRenderer slot={slot} />
          </Column>
        ))}
      </Row>
    </Section>
  )
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing HTML in the database

**What:** Saving rendered HTML alongside or instead of the JSON document.  
**Why bad:** Any template or style change requires re-rendering all stored newsletters. HTML is a derivative — it belongs in the export endpoint, not the DB.  
**Instead:** Store only `NewsletterDoc` JSON. Render to HTML on demand at export time.

### Anti-Pattern 2: Using CSS flexbox/grid in email templates

**What:** Using `display: flex` or CSS Grid in the HTML export.  
**Why bad:** Gmail, Outlook, and Apple Mail have poor/no support for flexbox/grid. The output will break in major clients.  
**Instead:** Use `react-email`'s `<Row>` / `<Column>` primitives (which compile to `<table>` + `<td>`). Enforce `Row/Column` for all multi-column layouts — never `div + flex`.

### Anti-Pattern 3: Monolithic DnD context covering mismatched interaction types

**What:** Putting palette items and canvas rows in the same `SortableContext` without type guards.  
**Why bad:** Dropping a layout card onto a row slot (or vice versa) causes nonsensical state mutations that are hard to debug.  
**Instead:** Use @dnd-kit's `type` / `accept` API to express which draggables accept which droppables. Each drop handler checks `source.type` before mutating state.

### Anti-Pattern 4: Per-element database rows

**What:** Separate DB tables for `rows`, `slots`, `elements`, joined at load time.  
**Why bad:** Newsletter documents are always read and written as a unit. JOIN queries add complexity with no query-side benefit; the document structure is opaque to SQL anyway.  
**Instead:** Store `document JSONB` and load atomically. Use partial updates only for `title` (outside the document blob).

### Anti-Pattern 5: Running TipTap editor inside every ColumnSlot always

**What:** Mounting a full TipTap editor instance for every rich-text element on the canvas.  
**Why bad:** TipTap/ProseMirror instances are heavy; 10 rows × 2 columns = 20 editor instances causes visible lag.  
**Instead:** Render rich text as static HTML (`generateHTML(content, extensions)`) on the canvas. Mount a single TipTap editor instance in the InspectorPanel only when that element is selected.

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| DB load | Single PostgreSQL fine | Add connection pooling (PgBouncer) | Read replica for list queries |
| Export latency | Server-side render acceptable | Cache rendered HTML by `updatedAt` hash | Offload to worker queue |
| Document size | Avg doc ~20–50KB JSONB | Same — JSONB is efficient | No issue |
| Auth | JWT stateless — scales trivially | Same | Same |
| Preset templates | Seed on startup | Same | Add DB-managed presets for enterprise |

---

## Sources

| Source | Confidence | Topic |
|--------|------------|-------|
| Context7: `/clauderic/dnd-kit` | HIGH | Multi-container sortable, type/accept API |
| Context7: `/websites/dndkit` | HIGH | Multiple sortable list patterns, group-based DnD |
| Context7: `/resend/react-email` | HIGH | Section/Column/Row primitives, Outlook compatibility, server-side render |
| Context7: `/ueberdosis/tiptap-docs` | HIGH | `generateHTML`, `renderToHTMLString`, JSONContent format |
| Context7: `/automattic/juice` | HIGH | CSS inlining API, email-client options |
| Context7: `/pmndrs/zustand` | HIGH | Immer middleware for nested state mutations |
| Context7: `/mjmlio/mjml` | HIGH | Row/section/column data model concepts (informed design) |
| Context7: `/prisma/web` | HIGH | One-to-many relations, JSONB, schema design |
| Context7: `/fastify/fastify` | HIGH | Plugin scoping, JWT auth pattern, route structure |
