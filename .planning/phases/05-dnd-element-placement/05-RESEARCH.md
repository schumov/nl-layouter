# Phase 5: DnD — Element Placement — Research

**Researched:** 2026-06-08
**Domain:** `@dnd-kit/core@6.3.1` nested droppables, Zustand/Immer element mutations, React 19 selection state, Vitest component testing with dnd-kit
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Slot Highlight During Drag**
- **D-01:** Only the specific empty slot directly under the cursor highlights — no broadcast-to-all.
- **D-02:** Only empty slots highlight (`border-green-400 bg-green-50`). Occupied slots: no visual change.
- **D-03:** Hover style: `border-green-400 bg-green-50` (green = element, blue = layout — type-coded).

**Right Panel — Element Selection**
- **D-04:** Clicking an element slot swaps right panel to placeholder `InspectorPanel`; back arrow (←) restores palette.
- **D-05:** Placeholder inspector: element type name header + muted "Editing available in the next step." No editors.
- **D-06:** Click anywhere on canvas outside an occupied slot → clears `selectedElementId` → palette restores.

**Element Card Icons (Elements Tab)**
- **D-07:** Each card shows lucide icon + label side-by-side, `p-3 border rounded-md` style (matches layout cards).
- **D-08:** Icons: `image→Image`, `image-link→ImagePlus`, `button→MousePointerClick`, `rich-text→AlignLeft`, `divider→Minus`.

**Remove (×) Element Control**
- **D-09:** × is absolute-positioned in top-right corner of the slot (interior, not exterior).
- **D-10:** × visible on hover OR when element is selected; hidden otherwise.
- **D-11:** 2-step inline confirm (like Phase 4 section delete D-07): first click → "Remove?" + "Cancel"; second click dispatches `removeElement(slotId)`. State is per-slot `useState`.

**Zustand Store Extensions**
- **D-12:** `addElement(slotId, elementType)` — creates element with default config + `crypto.randomUUID()` id.
- **D-13:** `removeElement(slotId)` — sets `slot.element = null`.
- **D-14:** `setSelectedElement(id | null)` — updates `selectedElementId` (already scaffolded in Phase 1).
- **D-15:** No separate `replaceElement` — `addElement` on an occupied slot overwrites via Immer direct assignment.

### the agent's Discretion
- Default configs per element type (strings, colors, thickness) — planner decides sensible defaults.
- Exact CSS transition timing for hover highlight and × visibility.
- Whether field is named `selectedSlotId` or `selectedElementId` (both refer to same concept — use existing `selectedElementId` scaffold).

### Deferred Ideas (OUT OF SCOPE)
- `CANVAS_ELEMENT` drag (between slots) — deferred to future phase.
- Undo/redo for element operations — UNDO-01 is v2 deferred.
- Occupied slot replace indicator (amber highlight) — silent overwrite only.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ELEM-10 | User can drag an element type from the palette into a layout column slot | `DraggableElementCard` (useDraggable) + `ColumnSlot` (useDroppable) + `addElement` store action |
| ELEM-11 | User can replace an existing element in a slot with a different element type | `addElement` on occupied slot overwrites via Immer (D-15) — no separate replaceElement needed |
| ELEM-12 | User can remove an element from a slot (leaving slot empty) | `removeElement(slotId)` store action + × button with inline confirm (D-09–D-11) |

</phase_requirements>

---

## Summary

Phase 5 wires element-level DnD into the existing `DragDropProvider`. The critical technical challenge is **nested droppable collision**: `ColumnSlot` droppables (via `useDroppable`) are nested inside `SortableRowBlock` sortable nodes (via `useSortable`). With `closestCenter`, a 1-column layout's row and its single slot share nearly identical centers — the row may steal collision detection. The fix is a **custom `collisionDetection` prop** that filters `droppableContainers` to only slot droppables when an `ELEMENT_CARD` is being dragged.

**Verified from dnd-kit@6.3.1 source:** `CollisionDetection` receives `droppableContainers: DroppableContainer[]` (a plain iterable array), so standard `.filter()` works directly. The `closestCenter` function uses `for...of droppableContainers`, making the filtered-array approach clean and safe.

The Zustand store already has `selectedElementId` and `setSelectedElement` scaffolded from Phase 1. Phase 5 adds `addElement(slotId, elementType)` and `removeElement(slotId)`, both using slot-ID-only lookup across all sections' slots via Immer mutation.

**Primary recommendation:** Implement custom collision detection in `DragDropProvider` as the first step before wiring `ColumnSlot` droppables — it is the foundational enabler for correct `isOver` behavior and clean `onDragEnd` dispatch.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Drag collision strategy | Frontend — `DragDropProvider` | — | Single `DndContext` owns collision detection; context-aware filtering needed |
| Element palette cards | Frontend — `BuilderPalette` | — | `useDraggable` per card; triggers store action on drop |
| Slot droppable + highlight | Frontend — `ColumnSlot` | — | `useDroppable` + `isOver` state; scoped to slot component |
| Element add/remove state | Frontend — Zustand store | — | Pure client state; auto-save hook (Phase 2) persists to backend |
| Selection state | Frontend — Zustand store | — | `selectedElementId` already scaffolded; Phase 5 uses it |
| Right panel swap | Frontend — `BuilderPage` | — | Reads `selectedElementId`; renders `InspectorPanel` or `BuilderPalette` |
| Placeholder inspector | Frontend — `InspectorPanel` | — | Static component; no data needed beyond element type name from store |

---

## Findings — Critical Research Questions

### Finding 1: Nested Droppable Collision (HIGH CONFIDENCE)

**Risk**: `closestCenter` considers ALL registered droppables. `SortableRowBlock` registers as a sortable droppable (via `useSortable`). `ColumnSlot` registers as a plain droppable (via `useDroppable`). In a 1-column layout, the row rect and slot rect are nearly identical — `closestCenter` may return the row's `id` instead of the slot's `id`.

**Root cause verified from source:** `closestCenter` iterates `droppableContainers` and returns the droppable with the smallest distance from its center to the active item's center. With a 1-column section, both the row and slot centers are at ~the same x,y → either can win.

**Confirmed from `@dnd-kit/core@6.3.1` dist `core.cjs.development.js` line 332–360:**
```javascript
const closestCenter = _ref => {
  let { collisionRect, droppableRects, droppableContainers } = _ref;
  const centerRect = centerOfRectangle(collisionRect, ...);
  const collisions = [];
  for (const droppableContainer of droppableContainers) { // <-- iterates the array
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);
    if (rect) {
      const distBetween = distanceBetween(centerOfRectangle(rect), centerRect);
      collisions.push({ id, data: { droppableContainer, value: distBetween } });
    }
  }
  return collisions.sort(sortCollisionsAsc); // returns ALL sorted — first item is "over"
};
```

**Confirmed from `types.d.ts`:** `CollisionDetection` signature:
```typescript
export declare type CollisionDetection = (args: {
  active: Active;
  collisionRect: ClientRect;
  droppableRects: RectMap;
  droppableContainers: DroppableContainer[];  // ← plain array, .filter() works directly
  pointerCoordinates: Coordinates | null;
}) => Collision[];
```

**Solution: Custom `collisionDetection` on `DndContext`** that, when `active.data.current?.type === DRAG_TYPES.ELEMENT_CARD`, filters `droppableContainers` to only those with `data.current?.type === DRAG_TYPES.ELEMENT_CARD` before passing to `closestCenter`:

```typescript
// Source: verified from @dnd-kit/core@6.3.1 dist types.d.ts + core.cjs.development.js
import type { CollisionDetection } from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';
import { DRAG_TYPES } from '@/dnd/types';

const collisionDetection: CollisionDetection = (args) => {
  const dragType = args.active.data.current?.type;

  if (dragType === DRAG_TYPES.ELEMENT_CARD) {
    // Filter to only COLUMN_SLOT droppables — prevents row from stealing ELEMENT_CARD collisions
    const slotContainers = args.droppableContainers.filter(
      (c) => c.data.current?.type === DRAG_TYPES.ELEMENT_CARD  // set in ColumnSlot's useDroppable
    );
    if (slotContainers.length === 0) return [];
    return closestCenter({ ...args, droppableContainers: slotContainers });
  }

  return closestCenter(args); // LAYOUT_CARD + CANVAS_ROW: standard closestCenter
};
```

**Register it:** `<DndContext collisionDetection={collisionDetection} ...>` (replaces `collisionDetection={closestCenter}`).

**Why this also fixes `isOver`:** `useDroppable`'s `isOver = (context.over?.id === droppable.id)`. When the row steals collision, `over.id` is the row → all slot `isOver` values are `false` → no green highlight ever shows. With filtering, `over.id` is always a slot when dragging ELEMENT_CARD → `isOver` works correctly on slots.

[VERIFIED: @dnd-kit/core@6.3.1 dist/core.cjs.development.js lines 332–360 + dist/utilities/algorithms/types.d.ts]

---

### Finding 2: `onDragEnd` ELEMENT_CARD Discrimination (HIGH CONFIDENCE)

With custom collision detection in place, `over.id` always refers to a slot when `ELEMENT_CARD` is active. Discrimination in `handleDragEnd`:

```typescript
// active.data.current.type tells us WHAT is being dragged
// over.id tells us WHICH slot was targeted (safe with custom collision)
if (dragType === DRAG_TYPES.ELEMENT_CARD && over !== null) {
  const elementType = active.data.current?.elementType as ElementUnion['type'];
  addElement(String(over.id), elementType);
  return;
}
```

**`active.data.current` shape** (set in `DraggableElementCard.useDraggable`):
```typescript
data: { type: DRAG_TYPES.ELEMENT_CARD, elementType: 'image' | 'image-link' | 'button' | 'rich-text' | 'divider' }
```

**`over.data.current` shape** (set in `ColumnSlot.useDroppable`):
```typescript
data: { type: DRAG_TYPES.ELEMENT_CARD }  // "this droppable accepts ELEMENT_CARD"
```

The `DRAG_TYPES.ELEMENT_CARD` value appears in BOTH the draggable data and the droppable data. This is intentional: in the draggable it means "this drag is an ELEMENT_CARD"; in the droppable it means "this droppable is a COLUMN_SLOT that accepts ELEMENT_CARD". This dual usage is the filter key in the custom collision.

[VERIFIED: CONTEXT.md code_context section + existing DragDropProvider.tsx pattern for LAYOUT_CARD/CANVAS_ROW]

---

### Finding 3: `useDroppable` in `ColumnSlot` — No Interference with `SortableRowBlock` (HIGH CONFIDENCE)

`useDroppable` and `useSortable` are independent hooks that register their nodes separately in the dnd-kit `DndContext`. The `SortableRowBlock`'s `useSortable` call registers `section.id` as a sortable+droppable node. `ColumnSlot`'s `useDroppable` call registers `slot.id` as a plain droppable node. They do not interfere.

**The only risk** is that without custom collision detection, the row's sortable node competes with the slot's droppable node (Finding 1). With the custom collision fix, this is eliminated.

**`useDroppable` registration for `ColumnSlot`:**
```typescript
// Source: @dnd-kit/core@6.3.1 — useDroppable pattern (same as CANVAS_ZONE_ID in SortableRowList)
import { useDroppable } from '@dnd-kit/core';
import { DRAG_TYPES } from '@/dnd/types';

const { setNodeRef, isOver } = useDroppable({
  id: slot.id,                                          // ← slot UUID — unique, no collision with section UUID
  data: { type: DRAG_TYPES.ELEMENT_CARD },              // ← filter key for custom collision detection
});
```

**Note on `ColumnSlot.test.tsx`:** After adding `useDroppable`, the component requires `DndContext` ancestor. The existing test renders without DndContext → will throw `draggableNodes.set is not a function` or context error. **Wave 0 must wrap `ColumnSlot.test.tsx` tests in `DndContext`** using the `renderWithDnd` pattern already established in `BuilderPalette.test.tsx`.

[VERIFIED: useDroppable source in @dnd-kit/core@6.3.1 + SortableRowList.tsx pattern + BuilderPalette.test.tsx renderWithDnd pattern]

---

### Finding 4: `DragOverlay` for `ELEMENT_CARD` (HIGH CONFIDENCE)

Extend the existing `ActiveDrag` interface in `DragDropProvider.tsx` to include element card fields:

```typescript
interface ActiveDrag {
  type: string;
  layoutType?: LayoutType;          // LAYOUT_CARD ghost
  section?: Section;                // CANVAS_ROW ghost
  elementType?: ElementUnion['type']; // ELEMENT_CARD ghost — NEW Phase 5
  elementLabel?: string;            // display label for ghost (e.g. "Image")
}
```

**Ghost render pattern** (D-07 / D-08 — icon + label, same card style as layout cards):
```typescript
{activeDrag?.type === DRAG_TYPES.ELEMENT_CARD && activeDrag.elementType && (
  <div className="p-3 border rounded-md text-sm bg-white shadow-md opacity-80 cursor-grabbing select-none flex items-center gap-2">
    {/* Icon component injected from ELEMENT_CARD_ICONS map */}
    <span>{activeDrag.elementLabel}</span>
  </div>
)}
```

**`handleDragStart` extension:**
```typescript
} else if (data?.type === DRAG_TYPES.ELEMENT_CARD) {
  setActiveDrag({
    type: DRAG_TYPES.ELEMENT_CARD,
    elementType: data.elementType as ElementUnion['type'],
    elementLabel: ELEMENT_NAMES[data.elementType as ElementUnion['type']],
  });
}
```

[VERIFIED: Existing DragDropProvider.tsx pattern for LAYOUT_CARD ghost + D-07/D-08 icon decisions]

---

### Finding 5: `selectedElementId` — Store Field Already Scaffolded (HIGH CONFIDENCE)

The `useNewsletterStore.ts` Phase 1 scaffold **already includes:**
```typescript
// State:
selectedElementId: string | null;   // ← exists in NewsletterState interface

// Action:
setSelectedElement: (id: string | null) => void;   // ← exists in NewsletterActions

// Implementation:
setSelectedElement: (id) => set((state) => { state.selectedElementId = id; }),
```

Phase 5 **does not need to add this field** — it already exists. Just use it.

**Click-to-select pattern** (event bubbling, no `useEffect`/`mousedown` listener needed):
- Occupied `ColumnSlot`: `onClick={(e) => { e.stopPropagation(); setSelectedElement(element.id); }}`
- `BuilderCanvas` wrapper div: `onClick={() => setSelectedElement(null)}`
- D-06 satisfied: any canvas click outside a slot bubbles to the wrapper and clears selection.

**Warning**: The `×` remove button is inside the slot. Clicking `×` should NOT deselect — the `stopPropagation` on the slot's `onClick` handles this correctly (the slot click selects, and the `×` button's own `onClick` prevents the slot click from re-selecting). The wrapper's clear handler doesn't fire because `stopPropagation` prevents bubbling.

[VERIFIED: useNewsletterStore.ts inspection — selectedElementId + setSelectedElement exist in Phase 1 scaffold]

---

### Finding 6: Right Panel Swap Pattern (HIGH CONFIDENCE)

`BuilderPage.tsx` currently renders `<BuilderPalette />` unconditionally. Phase 5 adds a conditional:

```typescript
// In BuilderPage.tsx — add to existing useNewsletterStore reads
const selectedElementId = useNewsletterStore((state) => state.selectedElementId);

// In JSX — replace <BuilderPalette />:
{selectedElementId ? <InspectorPanel /> : <BuilderPalette />}
```

**`InspectorPanel` component** (new, placeholder):
- Props: `selectedElementId` is read from store internally (or passed as prop — agent discretion)
- Renders: element type name as header + back arrow `←` button + muted note
- Back arrow click: `setSelectedElement(null)`

To display the element type name, `InspectorPanel` needs to find the element by `selectedElementId`. Lookup:
```typescript
// In InspectorPanel — find element from store
const element = useNewsletterStore((state) => {
  for (const row of state.doc?.rows ?? []) {
    for (const slot of row.slots) {
      if (slot.element?.id === state.selectedElementId) return slot.element;
    }
  }
  return null;
});
```

[VERIFIED: BuilderPage.tsx structure + useNewsletterStore.ts shape]

---

### Finding 7: Immer-Safe `addElement` / `removeElement` (HIGH CONFIDENCE)

The existing `setElement(sectionId, slotId, element)` requires `sectionId`. The new D-12/D-13 actions take only `slotId` (slot IDs are UUIDs unique across all sections — no `sectionId` needed for lookup).

**`addElement` implementation pattern** (slot-ID-only lookup, Immer-safe):
```typescript
addElement: (slotId, elementType) =>
  set((state) => {
    if (!state.doc) return;
    for (const row of state.doc.rows) {
      const slot = row.slots.find((s) => s.id === slotId);
      if (slot) {
        slot.element = createDefaultElement(elementType);  // Immer direct mutation ✅
        return;
      }
    }
  }),
```

**`removeElement` implementation pattern:**
```typescript
removeElement: (slotId) =>
  set((state) => {
    if (!state.doc) return;
    for (const row of state.doc.rows) {
      const slot = row.slots.find((s) => s.id === slotId);
      if (slot) {
        slot.element = null;  // Immer direct mutation ✅
        return;
      }
    }
  }),
```

**Why NOT use `current()` from Immer:** `current()` is only needed when passing an Immer draft to `structuredClone` (as in `duplicateSection`). Here we're doing direct property mutation — `current()` is unnecessary overhead.

**`createDefaultElement` helper** (define in `DragDropProvider.tsx` or a new `src/utils/elementDefaults.ts`):
```typescript
// Agent-discretion defaults — sensible starting values that Phase 6-7 editors will populate
function createDefaultElement(type: ElementUnion['type']): ElementUnion {
  const id = crypto.randomUUID();
  switch (type) {
    case 'image':
      return { type: 'image', id, src: '', alt: '', width: '100%' };
    case 'image-link':
      return { type: 'image-link', id, src: '', alt: '', href: '', width: '100%' };
    case 'button':
      return { type: 'button', id, label: 'Click me', href: '', backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid' };
    case 'rich-text':
      return { type: 'rich-text', id, content: { type: 'doc', content: [] }, textStyle: 'body' };
    case 'divider':
      return { type: 'divider', id, color: '#cccccc', spacing: 16, thickness: 1 };
    default:
      return assertNeverElement(type);  // exhaustiveness check — TS error if new type not handled
  }
}
```

[VERIFIED: useNewsletterStore.ts Immer patterns + newsletter.ts ElementUnion + assertNeverElement export]

---

### Finding 8: `sectionId` Prop — Already Wired (HIGH CONFIDENCE)

The CONTEXT.md integration notes say "`ColumnGrid.tsx` — must pass `sectionId` down to `ColumnSlot`". This is **already done in the existing code:**
```typescript
// ColumnGrid.tsx (current) — line 30:
<ColumnSlot slot={slot} sectionId={section.id} />
```

Phase 5 does NOT need to change `ColumnGrid.tsx` for the `sectionId` prop. The new `addElement`/`removeElement` actions use `slotId` only and don't require `sectionId` at all.

However, `sectionId` may be useful in Phase 5 for future actions (e.g., `setElement`). Keeping the prop is correct — no change needed.

[VERIFIED: ColumnGrid.tsx source inspection]

---

## Implementation Approach — 6 Plans

### Plan 1: Palette ElementCards (`DraggableElementCard`)

**Files:** `BuilderPalette.tsx` (edit), `BuilderPalette.test.tsx` (edit)

**What to build:**
- `ELEMENT_NAMES` record mapping `ElementUnion['type']` → display label (analogous to `LAYOUT_NAMES`)
- `ELEMENT_CARD_ICONS` record mapping type → lucide icon component (D-08)
- `DraggableElementCard` sub-component (local, not exported) using `useDraggable`:
  ```typescript
  useDraggable({
    id: elementType,    // 'image', 'image-link', etc. — unique; no collision with layout card IDs
    data: { type: DRAG_TYPES.ELEMENT_CARD, elementType },
  })
  ```
- Replace "Elements will be available in a future phase." stub with 5 `DraggableElementCard` instances
- `isDragging && 'opacity-40 cursor-grabbing'` — source card fade pattern (same as `DraggableLayoutCard`)

**Test update needed:** `BuilderPalette.test.tsx` already uses `renderWithDnd` — extend to test 5 element card labels are present in Elements tab.

---

### Plan 2: `ColumnSlot` Droppable Conversion

**Files:** `ColumnSlot.tsx` (edit), `ColumnSlot.test.tsx` (edit)

**What to build:**
```typescript
const { setNodeRef, isOver } = useDroppable({
  id: slot.id,
  data: { type: DRAG_TYPES.ELEMENT_CARD },  // filter key for custom collision detection
});
```

**Empty slot render:** attach `ref={setNodeRef}` + apply `border-green-400 bg-green-50` when `isOver` (D-02: only empty slots):
```typescript
className={cn(
  'min-h-[80px] flex items-center justify-center border-2 border-dashed border-border rounded text-sm text-muted-foreground select-none',
  isOver && 'border-green-400 bg-green-50 transition-colors duration-150',
)}
```

**Occupied slot render:** `ref={setNodeRef}` (droppable even when occupied, for replace), selection ring, click handler, `×` remove button overlay:
```typescript
<div
  ref={setNodeRef}
  className={cn(
    'relative group',
    isSelected && 'ring-2 ring-blue-400 rounded',
  )}
  onClick={(e) => { e.stopPropagation(); setSelectedElement(element.id); }}
>
  <ElementRenderer element={element} />
  <RemoveButton slotId={slot.id} isSelected={isSelected} />   {/* D-09/D-10/D-11 */}
</div>
```

**`RemoveButton` sub-component** (local, inline in ColumnSlot.tsx):
- Absolute top-right overlay: `absolute top-1 right-1`
- Visibility: `opacity-0 group-hover:opacity-100` + `isSelected ? 'opacity-100' : ''` (D-10)
- State: `useState<boolean>(false)` for `isConfirming` (D-11)
- First click: show "Remove?" + "Cancel" inside slot
- Second click "Remove?": dispatch `removeElement(slot.id)`, also call `setSelectedElement(null)`
- "Cancel": reset `isConfirming`

**Test update needed:** Wrap `ColumnSlot.test.tsx` tests in `renderWithDnd` (function already exists in `BuilderPalette.test.tsx` — copy the pattern).

---

### Plan 3: Zustand Store Extensions

**Files:** `useNewsletterStore.ts` (edit), `useNewsletterStore.test.ts` (edit)

**What to add:**
1. `addElement(slotId: string, elementType: ElementUnion['type'])` to `NewsletterActions` + implementation
2. `removeElement(slotId: string)` to `NewsletterActions` + implementation
3. `createDefaultElement` helper (local to store file or separate utils file)

**Do NOT modify:** `selectedElementId`, `setSelectedElement` — already exist from Phase 1 scaffold.
**Do NOT modify:** `setElement(sectionId, slotId, element)` — still valid for Phase 6-7 targeted edits.

**Test additions** to `useNewsletterStore.test.ts`:
- `ELEM-10: addElement places element in correct slot`
- `ELEM-10: addElement on occupied slot replaces element (ELEM-11)`
- `ELEM-10: addElement no-op for unknown slotId`
- `ELEM-12: removeElement clears slot.element to null`
- `ELEM-12: removeElement no-op for unknown slotId`

---

### Plan 4: `DragDropProvider` Extension

**Files:** `DragDropProvider.tsx` (edit), `DragDropProvider.test.tsx` (edit)

**Changes:**
1. Replace `collisionDetection={closestCenter}` with `collisionDetection={collisionDetection}` (custom function defined at module scope)
2. Extend `ActiveDrag` interface with `elementType?` and `elementLabel?`
3. Extend `handleDragStart` with ELEMENT_CARD case
4. Extend `handleDragEnd` with ELEMENT_CARD branch (before existing branches)
5. Extend `DragOverlay` with ELEMENT_CARD ghost render
6. Add `addElement` to store destructuring
7. Import `ELEMENT_NAMES` from `BuilderPalette` (or define locally)

**`handleDragEnd` full discriminator order:**
```typescript
function handleDragEnd({ active, over }: DragEndEvent) {
  setActiveDrag(null);
  const dragType = active.data.current?.type as string | undefined;

  // ── ELEMENT_CARD → slot: add/replace element ──────────────────────────────
  if (dragType === DRAG_TYPES.ELEMENT_CARD && over !== null) {
    const elementType = active.data.current?.elementType as ElementUnion['type'];
    addElement(String(over.id), elementType);
    return;
  }

  // ── LAYOUT_CARD → canvas: create new section ─────────────────────────────
  if (dragType === DRAG_TYPES.LAYOUT_CARD && over !== null) {
    const layoutType = active.data.current?.layoutType as LayoutType;
    addSection(createSection(layoutType));
    return;
  }

  // ── CANVAS_ROW reorder ────────────────────────────────────────────────────
  if (dragType === DRAG_TYPES.CANVAS_ROW && over !== null && active.id !== over.id) {
    reorderSections(String(active.id), String(over.id));
  }
}
```

---

### Plan 5: Remove Element (× Control)

**Covered in Plan 2** (ColumnSlot droppable conversion includes the `RemoveButton` sub-component). The `removeElement` store action is in Plan 3. Both plans must be complete before this is testable end-to-end.

Key detail: When `removeElement(slotId)` is dispatched, also call `setSelectedElement(null)` to restore the palette — either in the `RemoveButton` onClick or in the store action (simpler in the component since store actions shouldn't manage UI state).

---

### Plan 6: Replace Element (Drop on Occupied Slot)

**Covered in Plans 3 + 4** (no separate plan needed). When `addElement(slotId, elementType)` is called for an occupied slot:
```typescript
// In Immer set() — slot.element is already non-null; direct assignment overwrites:
slot.element = createDefaultElement(elementType);  // ← replaces previous element
```
D-15 confirmed: Immer assignment on a non-null property just overwrites it. The previous element's content is discarded. No `replaceElement` action needed.

---

### Plan Organization (Wave Structure)

```
Wave 0 — Test scaffolding (must run first — establishes test infrastructure)
  ├── Extend ColumnSlot.test.tsx: add renderWithDnd wrapper + stubs for isOver, selection, × button
  ├── Extend useNewsletterStore.test.ts: add addElement/removeElement test stubs
  └── Create InspectorPanel.test.tsx: render stub

Wave 1 — Store + Palette (parallel)
  ├── Plan A: Store extensions (addElement + removeElement + createDefaultElement)
  └── Plan B: DraggableElementCard + BuilderPalette Elements tab + InspectorPanel placeholder

Wave 2 — DnD wiring (parallel)
  ├── Plan C: ColumnSlot → useDroppable + isOver highlight + selection click + × remove button
  └── Plan D: DragDropProvider → custom collision + ELEMENT_CARD onDragEnd + DragOverlay ghost

Wave 3 — Page wiring + full suite
  └── Plan E: BuilderPage panel swap + BuilderCanvas click-outside + full test suite green
```

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Import |
|---------|---------|---------|--------|
| `@dnd-kit/core` | 6.3.1 | `useDroppable`, `useDraggable`, `CollisionDetection`, `closestCenter` | `@dnd-kit/core` |
| `@dnd-kit/sortable` | 10.0.0 | `useSortable` (existing rows — unchanged) | `@dnd-kit/sortable` |
| Zustand + Immer | 5.0.14 + 11.1.8 | `addElement`, `removeElement` mutations | existing wiring |
| `lucide-react` | installed | `Image`, `ImagePlus`, `MousePointerClick`, `AlignLeft`, `Minus` icons | `lucide-react` |
| Tailwind v4 | 4.3.0 | All class names must be complete string literals | existing |

**No new packages needed for Phase 5.** All dependencies were installed in Phase 1.

[VERIFIED: package.json + STATE.md stack versions + apps/client/node_modules/@dnd-kit/core inspection]

---

## Architecture Patterns

### System Architecture Diagram

```
BuilderPage
  ├── DragDropProvider (edit — custom collisionDetection + ELEMENT_CARD handling)
  │     ├── DndContext
  │     │     ├── collisionDetection: customFn (filters slots-only for ELEMENT_CARD)
  │     │     ├── onDragStart → capture elementType for ghost
  │     │     └── onDragEnd → addElement(slotId, elementType) for ELEMENT_CARD
  │     │
  │     ├── BuilderCanvas (edit — onClick clear selection)
  │     │     └── SortableRowList (unchanged)
  │     │           └── SortableRowBlock × N (unchanged)
  │     │                 └── RowBlock (unchanged)
  │     │                       └── ColumnGrid (unchanged — sectionId already wired)
  │     │                             └── ColumnSlot × N (edit — useDroppable + hover + select + ×)
  │     │
  │     ├── [selectedElementId ? InspectorPanel : BuilderPalette] (edit — conditional)
  │     │     ├── BuilderPalette (edit — DraggableElementCard ×5)
  │     │     └── InspectorPanel (new — placeholder, back arrow → setSelectedElement(null))
  │     │
  │     └── DragOverlay (edit — add ELEMENT_CARD ghost)
  │           ├── LAYOUT_CARD ghost (unchanged)
  │           ├── CANVAS_ROW ghost (unchanged)
  │           └── ELEMENT_CARD ghost (new — icon + label, opacity-80)

Zustand store (edit):
  addElement(slotId, elementType) → iterates rows→slots → slot.element = createDefaultElement(type)
  removeElement(slotId)           → iterates rows→slots → slot.element = null
  [selectedElementId + setSelectedElement — already exist from Phase 1 scaffold]

onDragEnd discrimination:
  active.data.current.type === DRAG_TYPES.ELEMENT_CARD → addElement(String(over.id), elementType)
  active.data.current.type === DRAG_TYPES.LAYOUT_CARD  → addSection(createSection(layoutType))
  active.data.current.type === DRAG_TYPES.CANVAS_ROW   → reorderSections(active.id, over.id)
```

### Recommended Project Structure (Phase 5 changes)

```
apps/client/src/
├── components/builder/
│   ├── DragDropProvider.tsx     (edit) — custom collision + ELEMENT_CARD handler + ghost
│   ├── BuilderPalette.tsx       (edit) — DraggableElementCard ×5 + ELEMENT_NAMES export
│   ├── ColumnSlot.tsx           (edit) — useDroppable + isOver highlight + select + × button
│   ├── BuilderCanvas.tsx        (edit) — onClick clear selection wrapper
│   ├── InspectorPanel.tsx       (NEW)  — placeholder: type name + back arrow + note
│   └── __tests__/
│       ├── ColumnSlot.test.tsx  (edit) — DndContext wrapper + new behavior tests
│       ├── BuilderPalette.test.tsx (edit) — element card presence tests
│       ├── DragDropProvider.test.tsx (edit) — ELEMENT_CARD onDragEnd test
│       └── InspectorPanel.test.tsx  (NEW) — renders type name + back arrow
├── pages/
│   └── BuilderPage.tsx          (edit) — conditional InspectorPanel vs BuilderPalette
└── store/
    ├── useNewsletterStore.ts    (edit) — addElement + removeElement
    └── __tests__/
        └── useNewsletterStore.test.ts (edit) — ELEM-10/11/12 tests
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Nested droppable collision | Custom distance math | Custom `CollisionDetection` wrapping `closestCenter` | `closestCenter` handles all distance math; only the container filter is custom |
| Click-outside detection | `document.addEventListener('mousedown')` + `useRef` | React event bubbling (`stopPropagation` + canvas wrapper `onClick`) | No `useEffect`, no cleanup, no ref needed; simpler and correct for this tree structure |
| Element type exhaustiveness | Manual `if-else if` chain | `assertNeverElement` in `createDefaultElement` switch default | Already exported from `newsletter.ts`; TypeScript errors at compile time on missing element types |
| Element default configs | Hand-picking values ad-hoc | `createDefaultElement(type)` helper function | Single source of truth; Phases 6-7 can import for testing |

---

## Common Pitfalls

### Pitfall 1: No Custom Collision Detection → isOver Never Fires on Slots
**What goes wrong:** `ColumnSlot.useDroppable.isOver` is always `false` even when cursor is directly over the slot. The green highlight never appears. Drops land on the row (wrong `over.id`).
**Why it happens:** `closestCenter` picks the `SortableRowBlock`'s sortable droppable node because in 1-col layouts their centers coincide. Even in multi-col layouts, during scrolling the row center may be closer.
**How to avoid:** Implement custom `collisionDetection` (Finding 1) — filter to slot-only droppables when `ELEMENT_CARD` is active. This must be done in Wave 2 Plan D before any ELEMENT_CARD DnD testing.
**Warning signs:** Dragging element card over slot → no green border visible; dropping → `addElement` not called (because `over.id` is a row UUID, not a slot UUID).

### Pitfall 2: `ColumnSlot.test.tsx` Breaks After `useDroppable` Added
**What goes wrong:** Existing `ColumnSlot` tests throw context errors (`Cannot read properties of undefined (reading 'set')` or similar).
**Why it happens:** `useDroppable` reads from `InternalContext` which has a default stub that throws on calls to certain methods. Tests currently render `ColumnSlot` without `DndContext`.
**How to avoid:** Wave 0 must add `renderWithDnd` wrapper (copy from `BuilderPalette.test.tsx`) to `ColumnSlot.test.tsx` before any ColumnSlot implementation changes.
**Warning signs:** Test suite fails immediately after `useDroppable` import is added to ColumnSlot.tsx.

### Pitfall 3: `stopPropagation` Missing on Slot Click → Clear Fires Immediately
**What goes wrong:** Clicking an element to select it fires both the slot's `onClick` (sets `selectedElementId`) AND the canvas wrapper's `onClick` (clears `selectedElementId`) in the same event. Net result: selection never sticks.
**Why it happens:** Without `e.stopPropagation()`, the click event bubbles from slot → ColumnGrid → RowBlock → SortableRowBlock → BuilderCanvas wrapper.
**How to avoid:** ALWAYS include `e.stopPropagation()` on the occupied slot's `onClick` handler.
**Warning signs:** Clicking an element card in the canvas — right panel briefly shows InspectorPanel then immediately reverts to BuilderPalette.

### Pitfall 4: `×` Remove Click Triggers Selection → Immediate Deselect
**What goes wrong:** Clicking `×` removes the element and also triggers selection clear (since the element is gone, `setSelectedElement(null)` may be called twice or in the wrong order).
**Why it happens:** Multiple click handlers on nested elements, each with different effects.
**How to avoid:** In the `×` button's confirm handler, call `removeElement(slotId)` then `setSelectedElement(null)` explicitly. The slot's parent `onClick` (which sets selection) has `stopPropagation`, so the `×` button's own click doesn't propagate to trigger re-selection.
**Warning signs:** After clicking `×`, the palette doesn't restore (or InspectorPanel stays up with no element selected).

### Pitfall 5: Immer Proxy in `createDefaultElement` Switch
**What goes wrong:** TypeScript complains that `type` might be an Immer draft proxy, not a plain string.
**Why it happens:** `elementType` passed to `addElement` comes from `active.data.current?.elementType` — this is a plain string from the draggable data, NOT an Immer draft. No proxy issue.
**How to avoid:** `createDefaultElement` should be a plain function defined outside the Zustand `set()` callback. Call it before or inside `set()` — both work since it only takes a plain string.
**Warning signs:** None expected — this pitfall is preemptively addressed here.

### Pitfall 6: Wrong Package Import (Carry-forward from Phase 4 Pitfall 1)
**What goes wrong:** Importing from `@dnd-kit/react` instead of `@dnd-kit/core`.
**Why it happens:** Context7 docs show new v2 API.
**How to avoid:** All Phase 5 imports from `@dnd-kit/core` (for `useDroppable`, `useDraggable`) and `@dnd-kit/sortable` (unchanged).
**Warning signs:** `Module not found: @dnd-kit/react` or wrong hook signatures.

### Pitfall 7: `DRAG_TYPES.ELEMENT_CARD` as Both Draggable AND Droppable Data Key
**What goes wrong:** Confusion about what `data: { type: DRAG_TYPES.ELEMENT_CARD }` means on a droppable.
**Why it happens:** The same `DRAG_TYPES.ELEMENT_CARD` constant appears in two contexts:
1. In `useDraggable({ data: { type: DRAG_TYPES.ELEMENT_CARD } })` → "this draggable IS an element card"
2. In `useDroppable({ data: { type: DRAG_TYPES.ELEMENT_CARD } })` → "this droppable ACCEPTS element cards"
**How to avoid:** This dual usage is intentional and correct. The custom collision function filters droppables WHERE `data.current?.type === DRAG_TYPES.ELEMENT_CARD`, which precisely selects slots (not rows). No ambiguity at runtime.
**Warning signs:** None — understanding this is key to reading the collision filter correctly.

---

## Code Examples

### Custom Collision Detection (THE KEY PATTERN)
```typescript
// Source: verified from @dnd-kit/core@6.3.1 types.d.ts + core.cjs.development.js
import { closestCenter } from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import { DRAG_TYPES } from '@/dnd/types';

// Define at module scope in DragDropProvider.tsx (not inside the component — avoids re-creation)
const collisionDetection: CollisionDetection = (args) => {
  const dragType = args.active.data.current?.type;

  if (dragType === DRAG_TYPES.ELEMENT_CARD) {
    // Only slot droppables — registered with data: { type: DRAG_TYPES.ELEMENT_CARD }
    const slotContainers = args.droppableContainers.filter(
      (c) => c.data.current?.type === DRAG_TYPES.ELEMENT_CARD
    );
    if (slotContainers.length === 0) return [];
    return closestCenter({ ...args, droppableContainers: slotContainers });
  }

  // LAYOUT_CARD + CANVAS_ROW: standard closestCenter
  return closestCenter(args);
};
```

### `ColumnSlot` Full Phase 5 Shape
```typescript
// Source: verified against @dnd-kit/core useDroppable + existing ColumnSlot pattern
import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { ColumnSlot as ColumnSlotData } from '../../types/newsletter';
import { ElementRenderer } from './ElementRenderer';
import { useNewsletterStore } from '@/store/useNewsletterStore';
import { DRAG_TYPES } from '@/dnd/types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ColumnSlotProps {
  slot: ColumnSlotData;
  sectionId: string;
}

function RemoveButton({ slotId }: { slotId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const removeElement = useNewsletterStore((s) => s.removeElement);
  const setSelectedElement = useNewsletterStore((s) => s.setSelectedElement);

  if (!isConfirming) {
    return (
      <button
        className="absolute top-1 right-1 size-5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 bg-white/80 hover:bg-red-50 flex items-center justify-center transition-opacity duration-100"
        onClick={(e) => { e.stopPropagation(); setIsConfirming(true); }}
        aria-label="Remove element"
      >
        <X className="size-3 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center gap-2 bg-white/90 rounded"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="text-xs font-medium text-destructive hover:underline"
        onClick={() => { removeElement(slotId); setSelectedElement(null); }}
      >
        Remove?
      </button>
      <button
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsConfirming(false)}
      >
        Cancel
      </button>
    </div>
  );
}

export function ColumnSlot({ slot }: ColumnSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: { type: DRAG_TYPES.ELEMENT_CARD },
  });

  const selectedElementId = useNewsletterStore((s) => s.selectedElementId);
  const setSelectedElement = useNewsletterStore((s) => s.setSelectedElement);
  const isSelected = slot.element !== null && selectedElementId === slot.element.id;

  if (slot.element) {
    return (
      <div
        ref={setNodeRef}
        className={cn('relative group', isSelected && 'ring-2 ring-blue-400 rounded')}
        onClick={(e) => { e.stopPropagation(); setSelectedElement(slot.element!.id); }}
      >
        <ElementRenderer element={slot.element} />
        <RemoveButton slotId={slot.id} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] flex items-center justify-center border-2 border-dashed border-border rounded text-sm text-muted-foreground select-none transition-colors duration-150',
        isOver && 'border-green-400 bg-green-50',
      )}
    >
      Drop element here
    </div>
  );
}
```

### `addElement` Store Action
```typescript
// Source: Immer mutation pattern verified from existing removeSection + setElement actions
addElement: (slotId, elementType) =>
  set((state) => {
    if (!state.doc) return;
    for (const row of state.doc.rows) {
      const slot = row.slots.find((s) => s.id === slotId);
      if (slot) {
        slot.element = createDefaultElement(elementType);
        return;
      }
    }
  }),
```

### `DraggableElementCard` Component
```typescript
// Source: mirrors existing DraggableLayoutCard pattern in BuilderPalette.tsx
import { useDraggable } from '@dnd-kit/core';
import { DRAG_TYPES } from '@/dnd/types';
import type { ElementUnion } from '@/types/newsletter';

function DraggableElementCard({
  elementType,
  label,
  icon: Icon,
}: { elementType: ElementUnion['type']; label: string; icon: React.ComponentType<{ className?: string }> }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: elementType,   // 'image', 'image-link', etc. — unique; no collision with layout IDs
    data: { type: DRAG_TYPES.ELEMENT_CARD, elementType },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'p-3 border rounded-md text-sm select-none flex items-center gap-2',
        'cursor-grab hover:bg-accent hover:text-accent-foreground transition-colors duration-100',
        isDragging && 'opacity-40 cursor-grabbing',
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | Phase Changed | Impact |
|--------------|------------------|---------------|--------|
| Manual collision filter with `over.data.current` check in onDragEnd | Custom `collisionDetection` prop filtering at algorithm level | Phase 5 (new) | Correct `isOver` state + clean `onDragEnd` dispatch |
| Nested droppable heuristics (type checking post-collision) | Pre-filter droppable containers by drag type | Phase 5 (new) | Eliminates parent-steals-child collision in 1-col layouts |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `createDefaultElement` can be placed in `DragDropProvider.tsx` (same file as `createSection`) | Finding 7 | Low — if placement causes circular import, move to `src/utils/elementDefaults.ts` |
| A2 | `lucide-react` icons `Image`, `ImagePlus`, `MousePointerClick`, `AlignLeft`, `Minus` are all available in the installed version | Plan 1 | Low — lucide-react has 1000+ icons; these are all standard; verify with import at implementation time |

All other claims are [VERIFIED] from direct source inspection.

---

## Open Questions (RESOLVED)

1. **`createDefaultElement` file placement** — RESOLVED: Lives in `useNewsletterStore.ts` (factory co-located with the store actions that use it — simpler import graph than DragDropProvider). Plan 05-01 implements it there.
   - ~~What we know: Phase 4's `createSection` helper lives in `DragDropProvider.tsx`~~
   - ~~Recommendation: Start in `DragDropProvider.tsx`~~

2. **`RemoveButton` visibility with `isSelected` CSS** — RESOLVED: `isSelected` state read directly inside `ColumnSlot` component from Zustand (no separate RemoveButton sub-component, no prop drilling). Plan 05-03 applies `opacity-0 group-hover:opacity-100` + `isSelected && 'opacity-100'` inline.
   - What's unclear: Should `isSelected` be passed as a prop to `RemoveButton` or accessed via Zustand inside it?
   - Recommendation: Access `isSelected` inside `RemoveButton` via `useNewsletterStore` (consistent with how `removeElement` is accessed — no prop drilling).

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies — Phase 5 is pure frontend code changes using already-installed packages).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.6 + @testing-library/react |
| Config file | `apps/client/vitest.config.ts` (exists) |
| Quick run command | `pnpm --filter client test --run` |
| Full suite command | `pnpm --filter client test --run` (no separate suite — all tests are in one run) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ELEM-10 | `addElement(slotId, type)` places element in matching slot | unit (store) | `pnpm --filter client test useNewsletterStore` | ✅ (extend existing) |
| ELEM-11 | `addElement` on occupied slot overwrites previous element | unit (store) | same | ✅ (extend existing) |
| ELEM-12 | `removeElement(slotId)` sets `slot.element = null` | unit (store) | same | ✅ (extend existing) |
| ELEM-12 | × button renders in occupied slot | unit (component) | `pnpm --filter client test ColumnSlot` | ✅ (extend existing) |
| ELEM-10 | Empty slot shows green border class when `isOver` (via store+class check) | unit (component) | same | ✅ (extend existing) |
| ELEM-10 | `DragDropProvider` calls `addElement` on ELEMENT_CARD drop | unit (component) | `pnpm --filter client test DragDropProvider` | ✅ (extend existing) |
| D-04 | `InspectorPanel` renders when `selectedElementId` is set | unit (component) | `pnpm --filter client test InspectorPanel` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter client test --run` (30 tests already pass; add ≥5 per wave)
- **Per wave merge:** full suite must be green
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx` — covers D-04/D-05
- [ ] Extend `ColumnSlot.test.tsx` — add `renderWithDnd` wrapper + stubs for `isOver`, selection, `×`
- [ ] Extend `useNewsletterStore.test.ts` — add `addElement`/`removeElement` stubs

---

## Security Domain

> `security_enforcement` not explicitly set in config.json — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 5 is client-only, single-user (v1) |
| V3 Session Management | no | Client state only |
| V4 Access Control | no | No server mutations in Phase 5 |
| V5 Input Validation | limited | Element type comes from `DRAG_TYPES` enum (constrained) + `ElementUnion['type']` (TypeScript union) |
| V6 Cryptography | no | `crypto.randomUUID()` for IDs — Web Crypto API (not hand-rolled) |

**No new security surface introduced.** Phase 5 is client-side UI state manipulation only. Element IDs use `crypto.randomUUID()` (Web Crypto API, already the project standard). Element types are bounded by the `ElementUnion['type']` discriminated union — TypeScript prevents arbitrary strings.

---

## Sources

### Primary (HIGH confidence)
- `@dnd-kit/core@6.3.1` dist/core.cjs.development.js lines 332–360 — `closestCenter` implementation (for…of over array)
- `@dnd-kit/core@6.3.1` dist/utilities/algorithms/types.d.ts — `CollisionDetection` signature (`droppableContainers: DroppableContainer[]`)
- `@dnd-kit/core@6.3.1` dist/store/constructors.d.ts — `DroppableContainersMap extends Map` with `.toArray()` + `.getEnabled()`
- `@dnd-kit/core@6.3.1` dist/store/types.d.ts — `DroppableContainer`, `Active`, `Over`, `DataRef` interfaces
- `apps/client/src/components/builder/DragDropProvider.tsx` — existing `onDragEnd` + sensor config + DragOverlay
- `apps/client/src/components/builder/SortableRowList.tsx` — existing useDroppable + SortableContext pattern
- `apps/client/src/components/builder/BuilderPalette.tsx` — existing DraggableLayoutCard + renderWithDnd test pattern
- `apps/client/src/store/useNewsletterStore.ts` — `selectedElementId` + `setSelectedElement` already scaffolded
- `apps/client/src/dnd/types.ts` — `DRAG_TYPES.ELEMENT_CARD` + `ACCEPT_CONSTRAINTS.COLUMN_SLOT`
- `apps/client/src/types/newsletter.ts` — `ElementUnion`, all 5 element interfaces, `assertNeverElement`
- `.planning/phases/05-dnd-element-placement/05-CONTEXT.md` — all locked decisions D-01 through D-15

### Secondary (MEDIUM confidence)
- Phase 4 Research (04-RESEARCH.md) — pitfall carry-forward (wrong package import, test context isolation, listeners-on-handle-only)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — installed packages verified, no new packages needed
- Collision detection fix: HIGH — verified from dnd-kit source code (types.d.ts + cjs.development.js)
- Store patterns: HIGH — verified from existing store + newsletter.ts types
- Architecture: HIGH — verified from existing component file tree
- Pitfalls: HIGH — derived from verified source behavior

**Research date:** 2026-06-08
**Valid until:** 2026-07-08 (stable library versions; 30-day window)
