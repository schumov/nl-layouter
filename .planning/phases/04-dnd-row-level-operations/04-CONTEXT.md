# Phase 4: DnD — Row-Level Operations — Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can drag layout cards from the palette onto the canvas (creating new sections), reorder existing sections by dragging their grip handles, and delete or duplicate sections. This phase wires dnd-kit into `BuilderPage`, upgrades `RowBlock` with `useSortable`, upgrades `BuilderPalette` layout cards with `useDraggable`, adds a `SortableRowList`, extends the Zustand store with `reorderSections` + `duplicateSection`, and implements section control UI.

**Out of scope:** Element-level DnD (Phase 5), element content editing (Phases 6–7), visual animations beyond CSS transforms provided by dnd-kit.

</domain>

<decisions>
## Implementation Decisions

### Drag Ghost Overlay
- **D-01:** During a palette → canvas drag (`LAYOUT_CARD`), the `DragOverlay` renders a **semi-transparent clone** of the palette card at **80% opacity** — exact visual copy of the `p-3 border rounded-md text-sm` layout card, floating under the cursor.
- **D-02:** The same `DragOverlay` pattern applies to canvas row reorders (`CANVAS_ROW`) — a semi-transparent clone of the full `RowBlock` floats during the drag. `SortableContext` handles the native CSS transforms; the overlay provides the consistent "lifted" visual.

### Empty Canvas Drop Zone
- **D-03:** When the canvas has no sections, render a **tall dashed-border rectangle** (`h-48`, dashed border, centered text "Drop a layout here") as the visible droppable target. This replaces the current text-only empty state from Phase 3.
- **D-04:** When a drag is in progress and the user hovers over the drop zone (or the canvas area containing it), the zone transitions to: **`bg-blue-50 border-blue-400` solid border** — border-color shift + light fill. This matches the ROADMAP "blue highlight border on active drag-over" spec.

### Section Controls — Floating Right
- **D-05:** Section controls (grip handle + delete + duplicate) are positioned as a **floating cluster outside the right edge** of each `RowBlock`. Implementation: `RowBlock` wrapper uses `relative` positioning; controls are `absolute right-0 top-1/2 -translate-y-1/2 translate-x-full` (outside the block to the right). This avoids layout shift inside the content area and does not interfere with element column slots in Phases 5+.
- **D-06:** Controls are **always visible** (no hover-gating). This keeps the UI predictable and avoids discoverability issues.
- **D-07:** The Delete button shows an **inline confirmation prompt** before removing the section. Implementation: first click on Delete reveals an inline "Delete?" + "Cancel" pair within the controls cluster (no modal); second click on "Delete?" dispatches `removeSection`. State is per-RowBlock (local `useState`, not Zustand).

### Drag & Drop Library
- **Already decided (ROADMAP):** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. `DndContext` wraps `BuilderPage` via a new `DragDropProvider` component.
- **Sensor config:** `PointerSensor` (activationConstraint: distance 8px) + `KeyboardSensor` (coordinateGetter: `sortableKeyboardCoordinates` from `@dnd-kit/sortable`).
- **Collision detection:** `closestCenter`.

### Zustand Store Extensions (Phase 4)
- **D-08:** Add `reorderSections(activeId: string, overId: string)` — uses `arrayMove` from `@dnd-kit/sortable` (or equivalent) to reorder `doc.rows` in place via Immer.
- **D-09:** Add `duplicateSection(sectionId: string)` — deep clone via `structuredClone`, assign fresh UUIDs to section, all slots, and all non-null elements. Insert the clone **directly after** the original in `doc.rows`.

### New Section Creation
- **Already decided (ROADMAP):** `addSection(layoutType)` appends at the **bottom** of `doc.rows`. New section has empty slots (all `element: null`), no background color override, no padding overrides. UUID via `crypto.randomUUID()`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 4 plan descriptions (7 tasks) and Done When criteria
- `.planning/REQUIREMENTS.md` — CANVAS-02 through CANVAS-06 (the 5 requirements this phase covers)

### Type System & DnD (Phase 1 — locked)
- `apps/client/src/dnd/types.ts` — `DRAG_TYPES` + `ACCEPT_CONSTRAINTS` — CC-5 rule: NEVER use string literals in dnd-kit hooks, always reference this file
- `apps/client/src/types/newsletter.ts` — `Section`, `ColumnSlot`, `LayoutType`, `NewsletterDoc` — the canonical data model

### Store (Phase 1 scaffold; Phase 2–3 wired)
- `apps/client/src/store/useNewsletterStore.ts` — existing `addSection` + `removeSection`; Phase 4 extends with `reorderSections` + `duplicateSection`

### Canvas Components (Phase 3 — base layer)
- `apps/client/src/components/builder/BuilderCanvas.tsx` — current canvas shell; Phase 4 replaces section list with `SortableRowList`
- `apps/client/src/components/builder/RowBlock.tsx` — current pure display component; Phase 4 wraps with `useSortable`
- `apps/client/src/components/builder/BuilderPalette.tsx` — current static layout cards; Phase 4 upgrades to `useDraggable`
- `apps/client/src/pages/BuilderPage.tsx` — top-level page; Phase 4 wraps it with `DragDropProvider`

### Architecture
- `.planning/STATE.md` — locked decisions table (dnd-kit chosen in Phase 1)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DRAG_TYPES.LAYOUT_CARD` / `DRAG_TYPES.CANVAS_ROW` — already defined; use directly in `useDraggable` / `useSortable` calls
- `ACCEPT_CONSTRAINTS.CANVAS_SECTION_LIST` — `[DRAG_TYPES.LAYOUT_CARD, DRAG_TYPES.CANVAS_ROW]` — use as the `accept` value for the canvas droppable zone
- `useNewsletterStore.addSection(section)` — already implemented; Phase 4 calls this from `onDragEnd`
- `useNewsletterStore.removeSection(sectionId)` — already implemented
- `crypto.randomUUID()` — available in all modern browsers; use for new section/slot/element IDs

### Established Patterns
- Tailwind v4 JIT rule: use **complete string literals** only — no template literals in class names (e.g. `'bg-blue-50'` not `` `bg-${color}-50` ``)
- `import type { ColumnSlot as ColumnSlotData }` pattern — avoids naming collision with ColumnSlot component; see `ColumnGrid.tsx`
- Immer mutation syntax in Zustand: `state.doc?.rows.push(section)` — already established; use the same pattern for `reorderSections`
- `useNewsletterStore((state) => state.doc)` selector pattern — see `BuilderPage.tsx`

### Integration Points
- `BuilderPage.tsx` — wrap content with `<DragDropProvider>` (new component); no other page changes needed
- `BuilderCanvas.tsx` — replace `{doc.rows.map(section => <RowBlock .../>)}` with `<SortableRowList rows={doc.rows} />`
- `BuilderPalette.tsx` — upgrade layout card `<div>` elements to use `useDraggable`
- `RowBlock.tsx` — extend props to accept `useSortable` binding (listeners, attributes, setNodeRef, transform, transition)

</code_context>

<deferred>
## Deferred Ideas

- **Insert-at-position:** Dropping a palette card between existing sections (insert at index, not always bottom). Deferred — ROADMAP specifies "appends at bottom" for Phase 4; revisit in a future enhancement if users request it.
- **Undo/redo for section operations:** REQUIREMENTS.md marks UNDO-01 as v2 deferred. Do not implement in Phase 4.
- **Drag-to-reorder animations:** Smooth spring animation via `@dnd-kit/sortable` CSS transitions are fine; no custom animation library needed. Spring config deferred to implementer judgment.

</deferred>

---

*Phase: 4 — DnD: Row-Level Operations*
*Context gathered: 2026-06-09*
