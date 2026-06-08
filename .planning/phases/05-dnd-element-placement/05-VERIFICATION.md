---
phase: 05-dnd-element-placement
verified: 2026-06-08T16:21:57Z
status: human_needed
score: 5/5
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Drag element card from Elements tab into an empty column slot"
    expected: "The slot transitions from 'Drop element here' placeholder to showing the element type badge (e.g. '[image]'); slot becomes interactive with × button on hover"
    why_human: "Full pointer-drag interaction cannot be simulated in vitest/JSDOM; dnd-kit PointerSensor requires real browser events. DragDropProvider test is a smoke test only."
  - test: "Drag a different element type onto an already-occupied slot"
    expected: "The slot immediately shows the new element type; old element is gone; isConfirming resets (no stale confirm dialog)"
    why_human: "Overwrite path (addElement on occupied slot) requires live drag simulation. WR-05 reset via useEffect is in place but cannot be exercised in unit tests."
  - test: "Verify green border on empty slot during active drag hover (D-01/D-02/D-03)"
    expected: "Only the slot under the pointer shows border-green-400 bg-green-50; other empty slots stay dashed. Occupied slots show no green highlight."
    why_human: "isOver state from useDroppable requires a real PointerSensor drag event; not simulatable in JSDOM."
  - test: "Verify collision detection: slot wins over sortable row (customCollision / Finding 1)"
    expected: "When dragging an element card over a 1-column section, onDragEnd fires with the slot UUID (not the section UUID) in over.id. The element appears in the slot, not triggering row insertion."
    why_human: "The customCollision function filters droppableContainers at runtime; verifying correct container selection requires live dnd-kit rendering with actual collision geometry."
  - test: "Click an occupied slot → InspectorPanel replaces BuilderPalette (D-04); click back arrow → BuilderPalette restores (D-04)"
    expected: "Clicking slot sets selectedElementId; right panel shows InspectorPanel with element type name and 'Editing available in the next step.' note. Back arrow calls setSelectedElement(null), restoring BuilderPalette."
    why_human: "BuilderPage conditional render logic is unit-tested at store level; full user interaction (click → state → panel swap) requires a rendered page in a real browser."
---

# Phase 5: DnD — Element Placement — Verification Report

**Phase Goal:** Users can drag element types from the palette into any column slot, remove elements from slots, and replace an element by dropping a new type.
**Verified:** 2026-06-08T16:21:57Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All element type cards appear in the "Elements" tab of the palette | ✓ VERIFIED | `BuilderPalette.tsx`: `ELEMENT_NAMES` record (5 types), `Object.entries(ELEMENT_NAMES).map(…)` renders `DraggableElementCard` for each; `TabsContent value="elements" forceMount`; `BuilderPalette.test.tsx` asserts all 5 labels |
| 2 | Dragging an element card into an empty slot creates that element type in the slot | ✓ VERIFIED (code) / ? HUMAN (browser) | `DragDropProvider.handleDragEnd` ELEMENT_CARD branch calls `addElement(String(over.id), elementType)`; `useNewsletterStore.addElement` creates default element in slot; `ColumnSlot.useDroppable` registers slot as ELEMENT_CARD droppable; store test confirms slot gets element. Runtime drag interaction needs human verification. |
| 3 | The remove button (×) on an occupied slot reverts it to empty/placeholder | ✓ VERIFIED | `ColumnSlot.tsx`: 2-step confirm flow: × button → `setIsConfirming(true)` → "Remove?/Cancel" → `removeElement(slot.id)` + `setSelectedElement(null)`; `ColumnSlot.test.tsx` test "ELEM-12: clicking Remove? dispatches removeElement and clears selectedElementId" exercises full flow with `fireEvent` |
| 4 | Dropping a different element type onto an occupied slot replaces it with the new type | ✓ VERIFIED (code) / ? HUMAN (browser) | `useNewsletterStore.addElement` unconditionally overwrites `slot.element` (D-15 comment in code); occupied slot has `ref={setNodeRef}` from `useDroppable`; store test "ELEM-11: addElement on occupied slot overwrites" confirms overwrite. Runtime drag needs human verification. |
| 5 | The selected element's slot is visually distinguished (highlight ring or shadow) | ✓ VERIFIED | `ColumnSlot.tsx` occupied branch applies `ring-2 ring-ring ring-inset` when `isSelected === true`; `ColumnSlot.test.tsx` "ELEM-10: occupied slot shows ring-2 class when selectedElementId matches slot.id" asserts `className.toContain('ring-2')` |

**Score: 5/5** truths supported by code (2 require browser-level human confirmation)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/client/src/components/builder/BuilderPalette.tsx` | DraggableElementCard, ELEMENT_NAMES (5 cards in Elements tab) | ✓ VERIFIED | `ELEMENT_NAMES` exported (5 types); `DraggableElementCard` renders icon + label; `useDraggable` with `DRAG_TYPES.ELEMENT_CARD` data; `ELEMENT_CARD_ICONS` exported for ghost |
| `apps/client/src/components/builder/ColumnSlot.tsx` | useDroppable, green hover, × remove with 2-step confirm, ring-2 selection, stopPropagation | ✓ VERIFIED | All present: `useDroppable`, `isOver → border-green-400 bg-green-50`, × button (aria-label "Remove element"), `isConfirming` state, `ring-2 ring-ring ring-inset`, `e.stopPropagation()` on occupied click; `useEffect` resets confirm on element change (WR-05) |
| `apps/client/src/components/builder/DragDropProvider.tsx` | customCollision for ELEMENT_CARD, onDragEnd adds element, onDragCancel clears ghost | ✓ VERIFIED | `customCollision` filters `droppableContainers` to ELEMENT_CARD-type slots when dragging ELEMENT_CARD; `handleDragEnd` ELEMENT_CARD branch calls `addElement`; `handleDragCancel` → `setActiveDrag(null)` wired to `<DndContext onDragCancel>` (WR-02 fixed) |
| `apps/client/src/store/useNewsletterStore.ts` | addElement, removeElement, selectedElementId, removeSection clears selectedElementId | ✓ VERIFIED | `addElement(slotId, type)` creates default element via `createDefaultElement`; `removeElement(slotId)` sets `slot.element = null`; `removeSection` clears `selectedElementId` when removed section contains selected slot (WR-04 fixed) |
| `apps/client/src/components/builder/InspectorPanel.tsx` | ELEMENT_NAMES from BuilderPalette, ArrowLeft back button, "Editing available in the next step." note | ✓ VERIFIED | Imports `ELEMENT_NAMES` from `./BuilderPalette` (WR-03 fixed, no ELEMENT_LABELS duplicate); `<ArrowLeft>` in `<Button variant="ghost" size="icon-sm" aria-label="Back to palette">`; `font-semibold` (not `font-medium`); placeholder note present |
| `apps/client/src/pages/BuilderPage.tsx` | selectedElementType derived, conditional InspectorPanel vs BuilderPalette | ✓ VERIFIED | `selectedElementType` derived via nested loop over `doc.rows[].slots[]`; conditional: `selectedElementId && selectedElementType ? <InspectorPanel> : <BuilderPalette>`; `onCanvasClick={() => setSelectedElement(null)}` passed to `BuilderCanvas` |
| `apps/client/src/components/builder/BuilderCanvas.tsx` | onCanvasClick prop forwarded to outer div | ✓ VERIFIED | `BuilderCanvasProps` declares `onCanvasClick?: () => void`; outer `<div onClick={onCanvasClick}>` forwards the prop |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `DraggableElementCard` | DragDropProvider | `useDraggable` with `data: { type: DRAG_TYPES.ELEMENT_CARD, elementType }` | ✓ WIRED | `BuilderPalette.tsx:94` — `DRAG_TYPES.ELEMENT_CARD` constant used (CC-5 compliant) |
| `DragDropProvider.handleDragEnd` | `useNewsletterStore.addElement` | ELEMENT_CARD branch: `addElement(String(over.id), elementType)` | ✓ WIRED | `DragDropProvider.tsx:147` — destructured from `useNewsletterStore()` at top of component |
| `ColumnSlot.useDroppable` | customCollision filter | `data: { type: DRAG_TYPES.ELEMENT_CARD }` | ✓ WIRED | `ColumnSlot.tsx:38` — `useDroppable({ id: slot.id, data: { type: DRAG_TYPES.ELEMENT_CARD } })`; `customCollision` filters by `c.data.current?.type === DRAG_TYPES.ELEMENT_CARD` |
| `BuilderPage` | `InspectorPanel` | Conditional render when `selectedElementId && selectedElementType` | ✓ WIRED | `BuilderPage.tsx:69-77` |
| `BuilderPage` | `BuilderCanvas` | `onCanvasClick` prop | ✓ WIRED | `BuilderPage.tsx:67` — `<BuilderCanvas onCanvasClick={() => setSelectedElement(null)} />` |
| `ColumnSlot.removeElement` | `useNewsletterStore` | Individual selector `(s) => s.removeElement` | ✓ WIRED | `ColumnSlot.tsx:32-34` — individual selectors (IN-01 fixed) |
| `removeSection` | `selectedElementId` clear | Check removed section's slot IDs against `selectedElementId` | ✓ WIRED | `useNewsletterStore.ts:112-115` — WR-04 fix applied |
| `ColumnSlot.isConfirming` reset | `slot.element?.id` | `useEffect` dependency | ✓ WIRED | `ColumnSlot.tsx:27-29` — WR-05 fix applied |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ColumnSlot.tsx` | `slot.element` | Prop from `ColumnGrid` → `BuilderPage.doc` from `useNewsletterStore` | Yes — Zustand Immer mutation via `addElement`/`removeElement` propagates new `doc` reference; `BuilderPage` re-renders and passes updated `slot` props down | ✓ FLOWING |
| `ColumnSlot.tsx` | `isSelected` | `useNewsletterStore((s) => s.selectedElementId === slot.id)` | Yes — store selector evaluates on each `selectedElementId` change | ✓ FLOWING |
| `InspectorPanel.tsx` | `elementType` prop | `BuilderPage.selectedElementType` derived by looping `doc.rows[].slots[]` | Yes — derived from live store state; returns `null` if slot has no element (guards InspectorPanel from rendering) | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `addElement` creates correct element type in store | `useNewsletterStore.test.ts`: "ELEM-10: addElement creates element with given type" | ✓ PASS — `slot.element.type === 'image'` | ✓ PASS |
| `addElement` overwrites existing element (ELEM-11) | `useNewsletterStore.test.ts`: "addElement on occupied slot overwrites" | ✓ PASS — second call changes type to `'button'` | ✓ PASS |
| `removeElement` sets slot to null (ELEM-12) | `useNewsletterStore.test.ts`: "removeElement sets slot.element to null" | ✓ PASS | ✓ PASS |
| ColumnSlot × button + confirm flow | `ColumnSlot.test.tsx`: "ELEM-12: clicking Remove?" | ✓ PASS — `slot.element` is null, `selectedElementId` is null | ✓ PASS |
| Full test suite | `npx vitest run` in `apps/client` | 46 passed, 0 failing (18 todo) | ✓ PASS |
| TypeScript compilation | `tsc --noEmit` in `apps/client` | Exit code 0, no errors | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ELEM-10 | 05-01, 05-02, 05-03, 05-04 | User can drag an element type from the palette into a layout column slot | ✓ SATISFIED | `DraggableElementCard` with `useDraggable(ELEMENT_CARD)` + `ColumnSlot.useDroppable` + `DragDropProvider.addElement` call; store test confirms element appears in slot |
| ELEM-11 | 05-01, 05-04 | User can replace an existing element in a slot with a different element type | ✓ SATISFIED | `addElement` overwrites `slot.element` unconditionally (D-15); occupied slot has `ref={setNodeRef}` so it is a valid drop target; store test confirms overwrite |
| ELEM-12 | 05-01, 05-03 | User can remove an element from a slot (leaving slot empty) | ✓ SATISFIED | × button → 2-step confirm → `removeElement(slot.id)` sets `slot.element = null`; store test + ColumnSlot test both confirm |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/client/src/components/builder/RowBlock.tsx` | 83 | `font-medium` in className | ℹ️ Info | **Pre-existing** — last modified in Phase 4 (`feat(04-02)` commit `c5a9a42`). Not a Phase 5 change. Architecture decision locking `font-semibold` was introduced in Phase 5; RowBlock is scheduled for Phase 6 review. No Phase 5 files contain `font-medium`. |

**Phase 5 files clean:** No `TODO`/`FIXME`/`HACK`, no placeholder returns (`return null`, `return {}`), no template literals in Tailwind class names, `font-medium` absent from all 7 Phase 5 source files.

---

### Human Verification Required

#### 1. Drag Element Card → Empty Slot

**Test:** Start the dev server (`pnpm dev`). Open the builder on any newsletter. Ensure at least one section with an empty slot exists. In the Elements tab, drag "Image" onto an empty slot.
**Expected:** The slot's dashed placeholder disappears and is replaced by `[image]` badge inside the slot (ElementRenderer output). The × button appears on hover.
**Why human:** dnd-kit `PointerSensor` requires a real browser pointer API; JSDOM cannot simulate the full drag sequence.

#### 2. Drop Different Element onto Occupied Slot (Replace)

**Test:** First add an "Image" element to a slot (via drag or store). Then drag "Button" from the Elements tab and drop it onto that same occupied slot.
**Expected:** The slot now shows `[button]` instead of `[image]`. No stale confirmation UI appears (isConfirming was reset by the WR-05 useEffect on element ID change).
**Why human:** Overwrite path requires two sequential drags and observation of element ID change; not simulatable in unit tests.

#### 3. Green Hover Highlight on Empty Slot During Drag (D-01/D-02/D-03)

**Test:** Begin dragging an element card (any type). Hover over an empty slot.
**Expected:** Only the hovered empty slot shows `border-green-400 bg-green-50` solid border (dashed border removed while hovering). Other empty slots remain dashed. Occupied slots show no green highlight.
**Why human:** `isOver` from `useDroppable` depends on live collision detection geometry that requires actual browser rendering.

#### 4. Collision Detection: Slot Wins Over Sortable Row (customCollision / Finding 1)

**Test:** Add a 1-column section to the canvas (only one slot per row). Drag an element card and hover it over that slot.
**Expected:** `onDragEnd` fires with `over.id` equal to the slot's UUID (not the section UUID). Element appears in the slot. No row creation or reorder occurs.
**Why human:** The `customCollision` function's filtering of `droppableContainers` depends on the actual registered droppable geometry at runtime. This is the most critical correctness check for the architecture.

#### 5. InspectorPanel Right-Panel Swap (D-04/D-06)

**Test:** Click on an occupied slot (one with an element in it). Then click the back arrow in the panel header. Then click the canvas background (not on any slot).
**Expected (click slot):** Right panel changes from BuilderPalette (with Layouts/Elements tabs) to InspectorPanel showing the element type name (e.g. "Image") and "Editing available in the next step." note.
**Expected (back arrow):** Right panel reverts to BuilderPalette. Selected ring on slot disappears.
**Expected (canvas background):** Same as back arrow — BuilderPalette shown, ring disappears.
**Why human:** Full React state interaction (click → Zustand → conditional render) is best verified in a browser session; `BuilderPage` rendering depends on full React tree with router context.

---

### Gaps Summary

No gaps found. All five "Done When" criteria have complete code implementations with supporting tests and wiring. The two drag-related criteria (#2 and #4) are verified at the code/logic level; their runtime browser behavior is flagged for human confirmation above.

---

### Post-Review Fix Status

All 5 warnings and 4 info items from `05-REVIEW.md` were addressed in commit `a4246c4`:

| Item | Fix | Verified In Code |
|------|-----|-----------------|
| WR-01: Conflicting `transition-colors`/`transition-opacity` on × button | Replaced with `transition-[color,background-color,opacity] duration-100` | `ColumnSlot.tsx:113` ✓ |
| WR-02: Missing `onDragCancel` handler | Added `handleDragCancel` + `onDragCancel={handleDragCancel}` on DndContext | `DragDropProvider.tsx:163-165, 173` ✓ |
| WR-03: `ELEMENT_LABELS` duplicate of `ELEMENT_NAMES` | Removed private copy; imports `ELEMENT_NAMES` from `BuilderPalette` | `InspectorPanel.tsx:14, 37` ✓ |
| WR-04: `removeSection` leaves stale `selectedElementId` | Added slot-check and clear in `removeSection` | `useNewsletterStore.ts:112-115` ✓ |
| WR-05: `isConfirming` not reset on element overwrite | Added `useEffect(() => setIsConfirming(false), [slot.element?.id])` | `ColumnSlot.tsx:27-29` ✓ |
| IN-01: Full-store subscription without selector | Individual selectors for `removeElement`, `setSelectedElement`, `isSelected` | `ColumnSlot.tsx:32-34` ✓ |
| IN-02: `sectionId` unused without signal | Destructured as `_sectionId` | `ColumnSlot.tsx:23` ✓ |
| IN-03: IIFE in JSX for element ghost | Extracted `ElementCardGhost` sub-component | `DragDropProvider.tsx:83-91` ✓ |
| IN-04: `setElement` not deprecated | `@deprecated` JSDoc added | `useNewsletterStore.ts:177-180` ✓ |

---

_Verified: 2026-06-08T16:21:57Z_
_Verifier: the agent (gsd-verifier)_
