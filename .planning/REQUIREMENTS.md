# Requirements: NL Layouter

**Defined:** 2026-06-05
**Core Value:** Users can build a fully structured, export-ready HTML newsletter without writing any code.

## v1 Requirements

### Newsletter Management

- [ ] **NL-01**: User can create a new newsletter with a name
- [ ] **NL-02**: User can view a list of all saved newsletters
- [ ] **NL-03**: User can open (load) an existing newsletter into the builder
- [ ] **NL-04**: User can rename a newsletter
- [ ] **NL-05**: User can delete a newsletter
- [ ] **NL-06**: Newsletter state auto-saves to the backend (debounced)

### Header & Footer

- [ ] **HF-01**: User can select a header template preset for the newsletter
- [ ] **HF-02**: User can select a footer template preset for the newsletter
- [ ] **HF-03**: At least 2 header presets and 2 footer presets are available
- [ ] **HF-04**: Pre-header text field: user can enter hidden inbox-preview text per newsletter

### Builder Canvas

- [ ] **CANVAS-01**: Builder UI has a left-side canvas and a right-side palette panel
- [ ] **CANVAS-02**: User can drag a layout section from the palette onto the canvas
- [ ] **CANVAS-03**: Sections stack top-down on the canvas in the order they are dropped
- [ ] **CANVAS-04**: User can reorder sections on the canvas via drag-and-drop
- [ ] **CANVAS-05**: User can delete a section from the canvas
- [ ] **CANVAS-06**: User can duplicate a section (copies layout + all element content)

### Layouts

- [ ] **LAYOUT-01**: 1-column layout (single full-width slot)
- [ ] **LAYOUT-02**: 2-column layout (two equal-width slots)
- [ ] **LAYOUT-03**: 3-column layout (three equal-width slots)
- [ ] **LAYOUT-04**: Small-left / big-right layout (1/3 + 2/3 slots)
- [ ] **LAYOUT-05**: Big-left / small-right layout (2/3 + 1/3 slots)

### Content Elements

- [ ] **ELEM-01**: Image element — displays an image from a URL, with configurable width
- [ ] **ELEM-02**: Image element supports alt text input
- [ ] **ELEM-03**: Image-with-link element — image wrapped in a hyperlink (URL configurable)
- [ ] **ELEM-04**: Button element — configurable label, link URL, background colour, text colour
- [ ] **ELEM-05**: At least 2 button style presets (e.g. filled, outline)
- [ ] **ELEM-06**: Rich text element — full WYSIWYG editor (bold, italic, underline, links, lists)
- [ ] **ELEM-07**: Rich text element supports named styles: Header, Subheader, Body Text, Code
- [ ] **ELEM-08**: Rich text editor outputs inline styles (not CSS classes) for email compatibility
- [ ] **ELEM-09**: Divider element — horizontal rule, configurable colour and spacing
- [ ] **ELEM-10**: User can drag an element type from the palette into a layout column slot
- [ ] **ELEM-11**: User can replace an existing element in a slot with a different element type
- [ ] **ELEM-12**: User can remove an element from a slot (leaving slot empty)

### HTML Export

- [ ] **EXPORT-01**: User can trigger an HTML export of the current newsletter
- [ ] **EXPORT-02**: Exported HTML uses table-based layout (not flexbox/grid) for email-client compatibility
- [ ] **EXPORT-03**: Exported HTML has all CSS inlined (no `<style>` block) — Gmail-compatible
- [ ] **EXPORT-04**: Exported HTML includes MSO conditional comments for Outlook multi-column support
- [ ] **EXPORT-05**: Exported HTML includes the selected header and footer templates
- [ ] **EXPORT-06**: Exported HTML includes the pre-header hidden text span
- [ ] **EXPORT-07**: Export triggers a browser download of the `.html` file

## v2 Requirements

### Authentication & Multi-User

- **AUTH-01**: User can register with email and password
- **AUTH-02**: User can log in and out
- **AUTH-03**: User session persists across browser refresh
- **AUTH-04**: Each user can only access their own newsletters

### Collaboration

- **COLLAB-01**: Multiple users can be invited to a shared workspace
- **COLLAB-02**: Real-time co-editing of a newsletter

### Enhanced Elements

- **ELEM-V2-01**: Video thumbnail element (image linking to video URL)
- **ELEM-V2-02**: Social icons row element
- **ELEM-V2-03**: Countdown timer element

### Dark Mode

- **DARK-01**: Exported HTML includes `prefers-color-scheme` dark mode override styles

### Undo / Redo

- **UNDO-01**: In-session undo/redo for canvas operations

### Image Management

- **IMG-01**: Built-in image upload and asset library (CDN-backed storage)

### Template Library

- **TMPL-01**: User can save a completed newsletter as a reusable template
- **TMPL-02**: User can start a new newsletter from a saved template

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email sending / SMTP | Delivery is out of scope — builder only; integrate with any ESP separately |
| Authentication / multi-user | Deferred to v2 — v1 is a single-user tool, no login required |
| Real-time collaboration | High complexity; v2 |
| Image hosting / CDN | Storage/bandwidth costs; v1 accepts image URLs only |
| Undo/redo history | State design accommodates it; feature deferred to v2 |
| AMP for Email | Separate AMP HTML spec, additional testing surface — not worth v1 |
| Mobile-responsive export | Progressive enhancement; Outlook compatibility takes priority |
| OAuth / social login | Email+password sufficient for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NL-01 – NL-06 | Phase 1 | Pending |
| CANVAS-01 – CANVAS-06 | Phase 2–3 | Pending |
| LAYOUT-01 – LAYOUT-05 | Phase 2–3 | Pending |
| ELEM-01 – ELEM-12 | Phase 4 | Pending |
| HF-01 – HF-04 | Phase 5 | Pending |
| EXPORT-01 – EXPORT-07 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-05*
*Last updated: 2026-06-05 after initial definition*
