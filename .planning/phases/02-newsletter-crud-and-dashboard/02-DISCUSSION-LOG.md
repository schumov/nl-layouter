# Phase 2: Newsletter CRUD & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-07
**Phase:** 2 — Newsletter CRUD & Dashboard
**Areas discussed:** Dashboard card layout, Create newsletter flow, Auto-save failure UX, BuilderHeader composition

---

## Dashboard Card Layout

### Card information

| Option | Description | Selected |
|--------|-------------|----------|
| Title + last-saved timestamp | Minimal, fast to scan (ROADMAP default) | |
| Title + last-saved + section count | Gives a quick sense of doc size | ✓ |
| Title only | Cleanest, but less context | |

**User's choice:** Title + last-saved + section count

### Card actions

| Option | Description | Selected |
|--------|-------------|----------|
| Hover reveals ⋮ menu | Clean default state, actions discoverable on hover | ✓ |
| Always-visible icons | Rename + Delete icons always on card — obvious but busier | |
| Click opens only | Rename/delete only accessible from inside the builder | |

**User's choice:** Hover reveals ⋮ menu with Rename + Delete

### Grid columns

| Option | Description | Selected |
|--------|-------------|----------|
| Responsive | 1 col mobile → 2 col tablet → 3 col desktop (Tailwind) | ✓ |
| Fixed 3 columns | Always 3 columns | |
| Fixed 2 columns | Always 2 columns | |

**User's choice:** Responsive grid

### Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Centered illustration + CTA | Friendly onboarding, placeholder illustration | ✓ |
| Simple text + button | Minimal, no illustration | |
| You decide | Agent picks simplest approach | |

**User's choice:** Centered illustration placeholder + "Create your first newsletter" CTA button

---

## Create Newsletter Flow

### Naming at creation

| Option | Description | Selected |
|--------|-------------|----------|
| Dialog required (user types name) | User must type a name before creating — no unnamed newsletters | ✓ |
| Dialog with "Untitled" default | Name pre-filled, user can accept or change | |
| Nameless then rename | Create immediately, rename from inside the builder | |

**User's choice:** Dialog required — user must enter a name

### Navigation after create

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate to /newsletters/:id | Builder opens immediately, user starts editing | ✓ |
| Stay on dashboard | New card appears, user clicks to open | |
| You decide | Agent picks | |

**User's choice:** Navigate directly to /newsletters/:id

### Initial document shape

| Option | Description | Selected |
|--------|-------------|----------|
| Empty rows + GlobalStyles defaults | Blank canvas, styles pre-set | |
| Fully minimal | Empty, Phase 3 fills defaults | |
| Header + footer + empty rows | (Free-text response) | ✓ |

**User's choice (free text):** "Header + Footer by default, empty rows where user can add layouts"
**Follow-up clarification on header/footer presets:**
- User specified: header = logo, title, subtitle, header pic; footer = copyright Infineon Technologies AG, current year, social media links
- Header/footer are **fixed single Infineon brand design** (not selectable presets) — global constants, hardcoded in renderer
- Header/footer values are brand constants, same for every newsletter (not per-newsletter configurable)
- Phase 2 stores `presetId: "infineon-default"`, `variables: {}` as a placeholder; Phase 8 implements the renderer

**Notes:** This decision changes Phase 8 scope significantly — from "preset selection UI" to "fixed Infineon header/footer renderer". No user-facing preset selection needed.

---

## Auto-save Failure UX

### Save error behavior

| Option | Description | Selected |
|--------|-------------|----------|
| "Save failed" indicator + auto-retry after 5s | Silent recovery, no toast spam | ✓ |
| Error toast with "Retry" button | User manually retries | |
| Silent retry 3× then show error | Exponential backoff | |

**User's choice:** "Save failed" indicator in header + auto-retry after 5 seconds

### Load state indicator

| Option | Description | Selected |
|--------|-------------|----------|
| No indicator during load | Indicator only appears after first edit | ✓ |
| Show "Loading…" during initial GET | Then blank until first edit | |

**User's choice:** No indicator during initial load

### "Saved ✓" duration

| Option | Description | Selected |
|--------|-------------|----------|
| Fades out after 3 seconds | Clean, non-distracting | ✓ |
| Permanent until next edit | Always confirms last save | |
| You decide | Agent picks | |

**User's choice:** Fades out after 3 seconds

---

## BuilderHeader Composition

### Header bar contents

| Option | Description | Selected |
|--------|-------------|----------|
| ← Back \| Title \| Save indicator | Minimal | |
| ← Back \| Title \| Save indicator \| Export button | Full header with export | ✓ |
| You decide | Agent picks minimal useful layout | |

**User's choice:** Back arrow ← | click-to-edit title | Saving…/Saved ✓/Save failed | Export button (right side)

### Rename UX

| Option | Description | Selected |
|--------|-------------|----------|
| Click title → becomes input, blur/Enter saves | As ROADMAP specifies | ✓ |
| Pencil icon → inline edit field | More explicit but extra click | |
| You decide | Agent picks | |

**User's choice:** Click title → `<input>`, blur/Enter sends PATCH

### Export placeholder (Phase 9 not built yet)

| Option | Description | Selected |
|--------|-------------|----------|
| Button disabled + tooltip "Export coming soon" | Honest, no dead ends | |
| Button enabled → toast "Export is not yet available" | Enabled but communicates state | ✓ |
| Hidden until Phase 9 | Not visible at all | |

**User's choice:** Button enabled, clicking shows toast "Export is not yet available"

---

## Agent's Discretion

None — all areas had explicit user preferences selected.

## Deferred Ideas

- **Phase 8 scope revision:** Header/footer are fixed Infineon brand constants (not selectable presets). Phase 8 "Header/Footer Presets" should be renamed to "Header/Footer Renderer" — implements the fixed Infineon design and pre-header text field only.
- **Lean list API:** Whether `GET /newsletters` returns full JSONB or a lean response with `sectionCount` — deferred to Phase 2 planning.
