# NL Layouter

## What This Is

NL Layouter is a web-based editorial tool for building HTML newsletters visually. It provides a drag-and-drop canvas where users compose newsletters from stacked layout sections, each filled with content elements (images, buttons, rich text). Once complete, the newsletter is exported as a standalone HTML file.

## Core Value

Users can build a fully structured, export-ready HTML newsletter without writing any code.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can register and log in; each user manages their own newsletters
- [ ] User can create, name, save, and load newsletters from the backend
- [ ] Builder UI: left-side canvas, right-side palette of layouts and elements
- [ ] User can drag layout sections from the palette onto the canvas (stacked top-down)
- [ ] Available layouts: 1-column, 2-column, 3-column, small-left/big-right, small-right/big-left
- [ ] Each layout section accepts content elements dragged into its column slots
- [ ] Available elements: image, image with hyperlink, button (multiple styles), rich text block
- [ ] Rich text blocks support full WYSIWYG editing (bold, italic, links, lists) with named styles: Header, Subheader, Text, Code
- [ ] User can reorder and remove layout sections from the canvas
- [ ] Each newsletter has a header and footer selected from template presets
- [ ] User can export the finished newsletter as a downloadable .html file

### Out of Scope

- Email sending / SMTP integration — delivery is out of scope; this is a builder only
- Real-time collaboration — multi-user simultaneous editing deferred to v2
- Image hosting / CDN — images referenced by URL or uploaded separately; no built-in asset storage in v1
- Versioning / history — no undo history beyond in-session browser undo

## Context

- The tool targets editorial teams or individual creators producing HTML email newsletters
- The output HTML must be email-client compatible (inline styles, table-based layout awareness)
- Tech stack selected for best fit: React + TypeScript frontend, Node.js (Fastify or NestJS) backend, PostgreSQL database, TipTap for rich text editing, @dnd-kit for drag-and-drop

## Constraints

- **Compatibility**: Exported HTML must render correctly in major email clients (Gmail, Outlook, Apple Mail)
- **Tech stack**: React + TypeScript / Node.js / PostgreSQL / TipTap / @dnd-kit
- **Deployment**: Single deployable web app (frontend + backend)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + TypeScript | Rich ecosystem for drag-and-drop (dnd-kit) and component composition | — Pending |
| TipTap for rich text | Modern, extensible, headless WYSIWYG; React-native | — Pending |
| @dnd-kit for DnD | Accessible, performant, no jQuery dependency | — Pending |
| PostgreSQL | Relational structure suits multi-user newsletter/section/element hierarchy | — Pending |
| Backend persistence | Multi-user requirement demands server-side storage | — Pending |
| Template-based header/footer | Balances flexibility with editorial consistency | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-05 after initialization*
