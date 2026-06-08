# Phase 5: DnD — Element Placement - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can drag element type cards from the palette's Elements tab into any column slot on the canvas, creating an element of that type with default config. Users can remove an element from a slot (returns slot to empty), and replace an element by dropping a different type onto an occupied slot (old content discarded). Clicking a slot with an element selects it and shows a placeholder inspector panel. This phase wires element-level DnD into the existing `DragDropProvider`, converts `ColumnSlot` to a droppable, extends the Zustand store with element-management actions, and builds the Elements tab and placeholder inspector UI.

**Out of scope:** Element content editing (Phases 6–7), real InspectorPanel editors, drag-between-slots (`CANVAS_ELEMENT`), undo/redo.

</domain>

<decisions>
## Implementation Decisions

### Slot Highlight During Drag (Element Cards)
- **D-01:** When an `ELEMENT_CARD` is being dragged, only the **specific empty slot that the cursor is directly over** highlights — all other slots remain visually unchanged. Hover-triggered, not broadcast-to-all.
- **D-02:** Only **empty slots** highlight during an element card drag. Occupied slots stay unchanged (no amber "replace" indicator — drop-to-replace is silent, the user learns it through interaction).
- **D-03:** Hover highlight style: `border-green-400 bg-green-50` (green = element drops; blue = layout drops from Phase 4 — colour-coded by drag type). The existing placeholder text "Drop element here" remains unchanged during hover.

### Right Panel — Element Selection
- **D-04:** Clicking an element slot sets `selectedElementId` in Zustand **and** swaps the right panel from the palette to a minimal placeholder `InspectorPanel`. The back arrow (←) in the panel header clears selection and restores the palette.
- **D-05:** Placeholder inspector content: element type name (e.g. "Image") as the panel header, plus a muted note: "Editing available in the next step." No actual editor fields — this phase wires the panel switch only. Phase 6 replaces the placeholder with real editors.
- **D-06:** Click outside any element (anywhere on the canvas that is not an occupied slot) clears `selectedElementId` → palette restores.

### Element Card Icons (Elements Tab)
- **D-07:** Each element card in the Elements palette tab shows a **lucide-react icon + label** side by side (icon left, label right). Same `p-3 border rounded-md` card style as layout cards.
- **D-08:** Icon assignments:
  - `image` → `Image` (lucide)
  - `image-link` → `ImagePlus` (lucide)
  - `button` → `MousePointerClick` (lucide)
  - `rich-text` → `AlignLeft` (lucide)
  - `divider` → `Minus` (lucide)

### Remove (×) Element Control
- **D-09:** The × remove button is an **absolute-positioned overlay in the top-right corner** of the slot (not floating outside like section controls — slots are too narrow for exterior floating in multi-column layouts).
- **D-10:** The × is visible on **hover OR when the element is selected** — hidden otherwise (matches ROADMAP "visible on hover/select" spec). Use CSS `group-hover` pattern or conditional class based on selection state.
- **D-11:** Remove uses a **2-step inline confirm**, consistent with Phase 4 section delete (D-07). First click: shows inline "Remove?" + "Cancel" inside the slot. Second click on "Remove?": dispatches `removeElement(slotId)`. "Cancel" restores the × button. State is per-slot (`useState`, not Zustand).

### Zustand Store Extensions (Phase 5)
- **D-12:** Add `addElement(slotId: string, elementType: ElementUnion['type'])` — creates an element with default config, assigns `crypto.randomUUID()` as `id`, writes it into the matching slot across all sections.
- **D-13:** Add `removeElement(slotId: string)` — sets `slot.element = null` for the matching slot.
- **D-14:** Add `setSelectedElement(slotId: string | null)` (or `setSelectedSlot`) — updates a new `selectedSlotId: string | null` field in the store. `null` = nothing selected.
- **D-15:** `replaceElement` is NOT a separate action — dropping on an occupied slot calls `addElement` which overwrites the existing element (same slot ID → same slot position). The overwrite is automatic via Immer mutation.

### the agent's Discretion
- Default configs for each element type (empty strings, `#000000` for colours, `1` for divider thickness, etc.) — planner decides sensible defaults.
- Exact CSS transition timing for slot hover highlight and × visibility toggle.
- Whether `selectedSlotId` or `selectedElementId` is the better Zustand field name (both refer to the same selection concept — the slot that contains the selected element).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 5 plan descriptions (6 plans) and Done When criteria (ELEM-10, ELEM-11, ELEM-12)
- `.planning/REQUIREMENTS.md` — ELEM-10, ELEM-11, ELEM-12 (3 requirements this phase covers)

### Type System & DnD (Phase 1 — locked)
- `apps/client/src/dnd/types.ts` — `DRAG_TYPES.ELEMENT_CARD` + `ACCEPT_CONSTRAINTS.COLUMN_SLOT` — Phase 5 droppable slots use these constants (CC-5 rule)
- `apps/client/src/types/newsletter.ts` — `ColumnSlot`, `ElementUnion`, all 5 element interfaces — canonical element data model

### Store (to extend)
- `apps/client/src/store/useNewsletterStore.ts` — Phase 5 adds `addElement`, `removeElement`, `setSelectedSlot`

### Canvas Components (to modify)
- `apps/client/src/components/builder/ColumnSlot.tsx` — base slot component; `sectionId` prop already stubbed for Phase 5 wiring
- `apps/client/src/components/builder/ElementRenderer.tsx` — stub renderer (renders `[element.type]`); Phase 5 leaves this unchanged — Phases 6–7 replace it
- `apps/client/src/components/builder/BuilderPalette.tsx` — Elements tab stub to replace with real `DraggableElementCard` components
- `apps/client/src/components/builder/DragDropProvider.tsx` — extend `onDragEnd` to handle `DRAG_TYPES.ELEMENT_CARD`
- `apps/client/src/components/builder/BuilderCanvas.tsx` — `sectionId` must flow down to `ColumnSlot` via `ColumnGrid`

### Phase 4 Context (pattern carry-forward)
- `.planning/phases/04-dnd-row-level-operations/04-CONTEXT.md` — D-05 (section controls float pattern), D-07 (inline delete confirm) — Phase 5 references these for consistency

### Architecture
- `.planning/STATE.md` — locked decisions (dnd-kit, DRAG_TYPES enum, CC-5 rule)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DRAG_TYPES.ELEMENT_CARD` — already defined; use in `useDraggable` for element palette cards
- `ACCEPT_CONSTRAINTS.COLUMN_SLOT` — `[DRAG_TYPES.ELEMENT_CARD, DRAG_TYPES.CANVAS_ELEMENT]` — use as accept filter in `onDragEnd`
- `DragDropProvider.tsx` — existing `onDragEnd` handler; Phase 5 adds an `ELEMENT_CARD` branch alongside the existing `LAYOUT_CARD` branch
- `ColumnSlot.tsx` — already has `sectionId` prop (stub); Phase 5 converts it to a droppable with `useDroppable`
- `ElementRenderer.tsx` — stub at `[element.type]`; Phase 5 does NOT change it (Phases 6–7 own that)
- `crypto.randomUUID()` — already used for section/slot IDs; continue for element IDs
- Lucide icons (`Image`, `ImagePlus`, `MousePointerClick`, `AlignLeft`, `Minus`) — all from `lucide-react` which is already installed

### Established Patterns
- **Tailwind v4 JIT rule:** All class names MUST be complete string literals — no template literals (e.g. `'bg-green-50'` not `` `bg-${color}-50` ``)
- **Import alias pattern:** `import type { ColumnSlot as ColumnSlotData }` avoids name collision — already used in `ColumnGrid.tsx`
- **Immer mutation in Zustand:** `state.doc?.rows[idx].slots[slotIdx].element = newElement` — same Immer mutation pattern as existing store actions
- **Inline confirm pattern (D-11):** `useState(false)` for `isConfirming` local to the slot component — mirrors Phase 4's section delete confirm (D-07)
- **dnd-kit test isolation:** Wrap renders in a fresh `<DndContext>` per test to prevent `draggableNodes` Map bleed across tests (established in Phase 4 Plan 00)
- **`DRAG_TYPES` enum always, never string literals (CC-5):** Any `onDragEnd` discrimination MUST use `DRAG_TYPES.ELEMENT_CARD`, not `'ELEMENT_CARD'`

### Integration Points
- `DragDropProvider.tsx` — add `ELEMENT_CARD` branch in `onDragEnd`: extract `slotId` from `over.id`, `elementType` from `active.data.current.elementType`, call `addElement(slotId, elementType)`
- `ColumnSlot.tsx` — call `useDroppable({ id: slot.id, data: { type: DRAG_TYPES.ELEMENT_CARD } })`; apply `border-green-400 bg-green-50` only when `isOver && !slot.element`
- `BuilderPalette.tsx` — replace Elements tab stub with 5 `DraggableElementCard` instances
- `ColumnGrid.tsx` — must pass `sectionId` down to `ColumnSlot` (currently not passed)
- `BuilderCanvas.tsx` / `SortableRowList.tsx` — `sectionId` must flow from `Section.id` down through `ColumnGrid` to `ColumnSlot`

</code_context>

<specifics>
## Specific Ideas

- Green (`border-green-400 bg-green-50`) for element slot hover — distinct from blue (layout canvas drop zone from Phase 4), making the two drag types visually distinguishable.
- "Editing available in the next step" — exact placeholder copy for the inspector panel note in Phase 5.
- Back arrow (←) in placeholder inspector header — clears selection and restores palette view (same UI pattern used in email clients and design tools).

</specifics>

<deferred>
## Deferred Ideas

- **`CANVAS_ELEMENT` drag (between slots):** `DRAG_TYPES.CANVAS_ELEMENT` is already defined but dragging elements between slots is explicitly out of scope for Phase 5. Deferred to a future enhancement phase.
- **Undo/redo for element operations:** REQUIREMENTS.md marks UNDO-01 as v2 deferred. Do not implement in Phase 5.
- **Occupied slot replace indicator:** An amber/orange highlight on occupied slots during drag (to signal "you can replace this") was considered but deferred — drop-to-replace is available via the silent overwrite; no visual hint required for v1.

</deferred>

---

*Phase: 5 — DnD: Element Placement*
*Context gathered: 2026-06-08*
