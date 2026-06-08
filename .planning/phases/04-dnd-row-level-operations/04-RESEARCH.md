# Phase 4: DnD — Row-Level Operations — Research

**Researched:** 2026-06-08
**Domain:** `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0`, Zustand/Immer store mutations, React 19 DnD compatibility, Vitest component testing with dnd-kit
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Drag Ghost Overlay — LAYOUT_CARD (D-01):** Semi-transparent clone of palette card at 80% opacity (`opacity-80`).
- **Drag Ghost Overlay — CANVAS_ROW (D-02):** Semi-transparent clone of full RowBlock at 80% opacity.
- **Empty Canvas Drop Zone (D-03):** `h-48` dashed-border rectangle with centered "Drop a layout here" text.
- **Drop Zone Hover State (D-04):** `bg-blue-50 border-blue-400` solid border on `isOver`.
- **Section Controls Position (D-05):** Floating cluster `absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2` outside the RowBlock right edge.
- **Controls Always Visible (D-06):** No hover-gating.
- **Delete Confirm Inline (D-07):** Local `useState(false)` per RowBlock; first click → inline "Delete?" + "Cancel"; second click dispatches `removeSection`. No modal.
- **DnD Library:** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (already installed). `DndContext` wraps `BuilderPage` via new `DragDropProvider` component.
- **Sensor Config:** `PointerSensor` (activationConstraint: distance 8px) + `KeyboardSensor` (coordinateGetter: `sortableKeyboardCoordinates`).
- **Collision Detection:** `closestCenter`.
- **reorderSections (D-08):** `arrayMove` from `@dnd-kit/sortable` via Immer. Insert Zustand action.
- **duplicateSection (D-09):** `structuredClone`, fresh UUIDs for section + slots + elements. Insert clone directly after original.
- **addSection:** Appends at bottom. UUID via `crypto.randomUUID()`. All slots empty (`element: null`), no overrides.

### the agent's Discretion

- Droppable ID constant for the empty canvas zone (local or shared constant).
- Slot-count helper function for `createSection(layoutType)` in `DragDropProvider`.
- Test wrapper approach for components that need `DndContext`.

### Deferred Ideas (OUT OF SCOPE)

- Insert-at-position (palette → canvas inserts between rows).
- Undo/redo (UNDO-01 is v2 deferred).
- Custom spring animation library.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CANVAS-02 | User can drag a layout section from the palette onto the canvas | `useDraggable` on palette cards + `onDragEnd` LAYOUT_CARD handler |
| CANVAS-03 | Sections stack top-down in the order they are dropped | `addSection` appends at bottom of `doc.rows` |
| CANVAS-04 | User can reorder sections via drag-and-drop | `useSortable` + `SortableContext` + `reorderSections(arrayMove)` |
| CANVAS-05 | User can delete a section | `removeSection` already exists; SectionControls Trash2 button wires it |
| CANVAS-06 | User can duplicate a section (copies layout + all element content) | New `duplicateSection` store action using `structuredClone` + fresh UUIDs |
</phase_requirements>

---

## Summary

Phase 4 wires `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0` into the builder. The installed packages use the **classic dnd-kit API** (not the newer `@dnd-kit/react` / `@dnd-kit/dom` packages). All hooks (`useDraggable`, `useSortable`, `SortableContext`) are imported from `@dnd-kit/core` and `@dnd-kit/sortable` respectively, not from the newer `@dnd-kit/react` package that appears in some documentation.

**`@dnd-kit/sortable@10.0.0` has zero breaking changes from v9** — it is exclusively a dependency bump to `@dnd-kit/core@6.3.0`. The classic `useSortable` return shape (`attributes`, `listeners`, `setNodeRef`, `transform`, `transition`, `isDragging`) is identical to v7/v8/v9. The `SortableContext` props and `arrayMove` signature are unchanged.

**React 19.2.7 is fully compatible** with `@dnd-kit/core@6.3.1`. The `unstable_batchedUpdates` call in dnd-kit's internals is still exported from `react-dom@19.2.7` (confirmed in the production bundle). No concurrent-mode issues observed.

**Primary recommendation:** Follow the `SortableRowBlock` wrapper pattern inside `SortableRowList` — keep `RowBlock` as a "dumb" component receiving sortable props, and put the `useSortable` call in a local `SortableRowBlock` inner component. This keeps `RowBlock.test.tsx` working without DndContext wrapping.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Drag provider + event handlers | Frontend — `DragDropProvider` | — | Single `DndContext` root per feature; owns `onDragStart`/`onDragEnd` state |
| Sortable canvas rows | Frontend — `SortableRowList` | — | `SortableContext` + `useSortable` per row; pure UI concern |
| Palette draggable cards | Frontend — `BuilderPalette` | — | `useDraggable` per card; triggers store action on drop |
| Section state mutation | Frontend — Zustand store | — | `reorderSections` + `duplicateSection` are pure client state; no API call needed |
| Section persistence (future) | API / Backend | Zustand | Auto-save hook (Phase 2 pattern) sends `doc` on debounce |

---

## Standard Stack

### Core (already installed — versions verified from installed packages)

| Library | Version | Purpose | Import |
|---------|---------|---------|--------|
| `@dnd-kit/core` | 6.3.1 | `DndContext`, `DragOverlay`, `useDraggable`, `useDroppable`, sensors | `@dnd-kit/core` |
| `@dnd-kit/sortable` | 10.0.0 | `SortableContext`, `useSortable`, `arrayMove`, `sortableKeyboardCoordinates`, `verticalListSortingStrategy` | `@dnd-kit/sortable` |
| `@dnd-kit/utilities` | 3.2.2 | `CSS.Transform.toString(transform)` | `@dnd-kit/utilities` |
| Zustand + Immer | 5.0.14 + 11.1.8 | Store mutations (`reorderSections`, `duplicateSection`) | already wired |

[VERIFIED: installed package.json + dist/index.js inspected]

**No new packages needed for Phase 4.** All dependencies were installed in Phase 1.

---

## Architecture Patterns

### System Architecture Diagram

```
BuilderPage
  └── DragDropProvider (new)
        ├── DndContext (from @dnd-kit/core)
        │     ├── onDragStart → setActiveDrag state
        │     ├── onDragEnd  → dispatch addSection / reorderSections
        │     └── sensors    → PointerSensor + KeyboardSensor
        │
        ├── BuilderCanvas
        │     └── SortableRowList (new)
        │           ├── useDroppable (canvas-drop-zone — empty state only)
        │           ├── SortableContext (items = section IDs)
        │           └── SortableRowBlock × N   (local wrapper in SortableRowList.tsx)
        │                 ├── useSortable({ id: section.id })
        │                 └── RowBlock (updated — receives sortable props + SectionControls)
        │
        ├── BuilderPalette (updated)
        │     └── useDraggable × 5 (one per layout card)
        │
        └── DragOverlay (from @dnd-kit/core)
              ├── LAYOUT_CARD ghost: semi-transparent palette card clone
              └── CANVAS_ROW ghost: semi-transparent RowBlock clone

onDragEnd discrimination:
  active.data.current.type === DRAG_TYPES.LAYOUT_CARD → addSection(createSection(layoutType))
  active.data.current.type === DRAG_TYPES.CANVAS_ROW  → reorderSections(active.id, over.id)
```

### Recommended Project Structure

```
apps/client/src/
├── components/builder/
│   ├── DragDropProvider.tsx        (new) — DndContext + event handlers + DragOverlay
│   ├── SortableRowList.tsx         (new) — SortableContext + empty drop zone
│   ├── BuilderCanvas.tsx           (edit) — replace row map with <SortableRowList>
│   ├── BuilderPalette.tsx          (edit) — add useDraggable to layout cards
│   ├── RowBlock.tsx                (edit) — add sortable props + SectionControls
│   └── __tests__/
│       ├── BuilderCanvas.test.tsx  (edit) — add DndContext wrapper
│       ├── BuilderPalette.test.tsx (edit) — add DndContext wrapper
│       └── RowBlock.test.tsx       (edit) — add SectionControls + isDragging tests
├── store/
│   ├── useNewsletterStore.ts       (edit) — add reorderSections + duplicateSection
│   └── __tests__/
│       └── useNewsletterStore.test.ts  (new) — pure store mutation tests
└── dnd/
    └── types.ts                    (no change) — DRAG_TYPES already defined
```

---

## Pattern 1: Sensor Configuration (Classic API)

**What:** Configure `PointerSensor` with 8 px activation distance and `KeyboardSensor` with sortable coordinate getter.

**Verified from:** `@dnd-kit/core@6.3.1` dist source — `activationConstraint` read from `props.options.activationConstraint`; `isDistanceConstraint` checks for `'distance' in constraint`.

```typescript
// Source: @dnd-kit/core@6.3.1 dist, verified from AbstractPointerSensor source
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,          // DistanceConstraint: 'distance' in constraint
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

[VERIFIED: AbstractPointerSensor source in @dnd-kit/core@6.3.1 dist/core.cjs.development.js line ~1380]

---

## Pattern 2: `useSortable` Return Shape and Usage

**What:** The classic `useSortable` return shape — unchanged in v10.

**Verified from:** `@dnd-kit/sortable@10.0.0` dist/sortable.cjs.development.js lines 445–620.

```typescript
// Source: @dnd-kit/sortable@10.0.0 dist — verified return object
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';

// In SortableRowBlock (local component inside SortableRowList.tsx):
function SortableRowBlock({ section }: { section: Section }) {
  const {
    attributes,        // DraggableAttributes — aria-* for accessibility
    listeners,         // SyntheticListenerMap | undefined — put on drag handle
    setNodeRef,        // (el: HTMLElement | null) => void — on the sortable root div
    transform,         // Transform | null — from @dnd-kit/utilities Transform type
    transition,        // string | undefined
    isDragging,        // boolean
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),   // CSS.Transform.toString: (Transform | null) => string | undefined
    transition: transition ?? undefined,
  };

  return (
    <RowBlock
      section={section}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      onDuplicate={() => duplicateSection(section.id)}
      onDelete={() => removeSection(section.id)}
    />
  );
}
```

**Critical note:** Do NOT call `useSortable` inside `RowBlock.tsx` directly. Keep `RowBlock` as a dumb component accepting optional sortable props. Only `SortableRowBlock` (inside `SortableRowList.tsx`) calls the hook.

[VERIFIED: dist source inspection + TypeScript type files for DraggableAttributes, DraggableSyntheticListeners]

---

## Pattern 3: `SortableContext` Configuration

**What:** Wraps the list of sortable items. Items can be IDs (strings) or objects with `id` property.

**Verified from:** `SortableContext` source in @dnd-kit/sortable v10.

```typescript
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Items: array of string IDs (or numbers/objects-with-id)
// Use section.id strings — UUIDs are fine
<SortableContext
  items={rows.map(s => s.id)}     // string[] — UniqueIdentifier compatible
  strategy={verticalListSortingStrategy}
>
  {rows.map(section => (
    <SortableRowBlock key={section.id} section={section} />
  ))}
</SortableContext>
```

[VERIFIED: SortableContext source — `items.map(item => 'id' in item ? item.id : item)`]

---

## Pattern 4: `onDragEnd` Event Discrimination

**What:** Distinguish LAYOUT_CARD drop (palette → canvas) from CANVAS_ROW reorder using `active.data.current.type`.

**Verified from:** `@dnd-kit/core@6.3.1` TypeScript definitions — `Active.data: MutableRefObject<Data | undefined>`.

```typescript
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DRAG_TYPES } from '@/dnd/types';
import type { LayoutType } from '@/types/newsletter';

// onDragEnd handler (inside DragDropProvider)
function handleDragEnd({ active, over }: DragEndEvent) {
  setActiveDrag(null);   // clear overlay state

  const dragType = active.data.current?.type as string | undefined;

  // --- Palette card → canvas: create new section ---
  if (dragType === DRAG_TYPES.LAYOUT_CARD && over !== null) {
    const layoutType = active.data.current?.layoutType as LayoutType;
    addSection(createSection(layoutType));        // append at bottom
    return;
  }

  // --- Canvas row reorder ---
  if (
    dragType === DRAG_TYPES.CANVAS_ROW &&
    over !== null &&
    active.id !== over.id              // guard: dropped on different row
  ) {
    reorderSections(String(active.id), String(over.id));
  }
}
```

**`active.id`** is `UniqueIdentifier` (`string | number`). Cast to `string` for the store action since `Section.id` is `string` (UUID).

**`over` is null** when the drag ends outside any droppable. With `closestCenter` collision detection and the canvas as a large droppable area, `over` is typically non-null when the user releases over the canvas — but the null guard is required for type safety.

[VERIFIED: TypeScript type files for DragEndEvent, Active, Over]

---

## Pattern 5: `DragOverlay` — Conditional Ghost Rendering

**What:** Single `DragOverlay` inside `DndContext` (inside `DragDropProvider`). Conditionally renders ghost content based on drag type.

**Architecture note (verified from source):** `DragOverlay` is NOT a React portal — it renders inside the `DndContext` tree using CSS `position: fixed` + transforms. The accessibility announcer uses `createPortal`, but the overlay content itself does not. This means jsdom renders the overlay content normally.

```typescript
// Source: @dnd-kit/core@6.3.1 dist — DragOverlay component verified
interface ActiveDrag {
  type: typeof DRAG_TYPES.LAYOUT_CARD | typeof DRAG_TYPES.CANVAS_ROW;
  layoutType?: LayoutType;   // for LAYOUT_CARD ghost label
  section?: Section;         // for CANVAS_ROW ghost clone
}

// In DragDropProvider render:
<DragOverlay>
  {activeDrag?.type === DRAG_TYPES.LAYOUT_CARD && activeDrag.layoutType && (
    <div className="p-3 border rounded-md text-sm bg-white shadow-md opacity-80 cursor-grabbing select-none">
      {LAYOUT_NAMES[activeDrag.layoutType]}
    </div>
  )}
  {activeDrag?.type === DRAG_TYPES.CANVAS_ROW && activeDrag.section && (
    <div className="opacity-80 cursor-grabbing">
      <RowBlock section={activeDrag.section} />
    </div>
  )}
</DragOverlay>
```

**Only render `DragOverlay` ONCE per `DndContext`.**

[VERIFIED: Context7 docs + @dnd-kit/core dist DragOverlay source]

---

## Pattern 6: `useDraggable` on Palette Cards

**What:** Make palette layout cards draggable. The card `id` uses the `layoutType` string (unique among palette items; no collision with UUID-based row IDs).

```typescript
// Source: @dnd-kit/core@6.3.1 dist — useDraggable verified
import { useDraggable } from '@dnd-kit/core';
import { DRAG_TYPES } from '@/dnd/types';

// Inside the layout card render in BuilderPalette:
function DraggableLayoutCard({ layoutType, label }: { layoutType: LayoutType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: layoutType,       // e.g. '1col', '2col', etc. — unique across all draggables
    data: {
      type: DRAG_TYPES.LAYOUT_CARD,
      layoutType,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'p-3 border rounded-md text-sm select-none',
        'cursor-grab hover:bg-accent hover:text-accent-foreground transition-colors duration-100',
        isDragging && 'opacity-40 cursor-grabbing',
      )}
    >
      {label}
    </div>
  );
}
```

[VERIFIED: @dnd-kit/core@6.3.1 useDraggable source + TypeScript types]

---

## Pattern 7: `reorderSections` Store Action

**What:** Immer + `arrayMove` reorder. Use array **assignment** (not `.splice`) because `arrayMove` returns a new array.

**Verified from:** `@dnd-kit/sortable@10.0.0` dist — `arrayMove(array, from, to)` signature. Existing `removeSection` store action uses assignment pattern, confirming Immer allows it.

```typescript
// Source: @dnd-kit/sortable@10.0.0 dist line 15 — verified signature
import { arrayMove } from '@dnd-kit/sortable';

// In useNewsletterStore.ts
reorderSections: (activeId: string, overId: string) =>
  set((state) => {
    if (!state.doc) return;
    const rows = state.doc.rows;
    const activeIndex = rows.findIndex((r) => r.id === activeId);
    const overIndex  = rows.findIndex((r) => r.id === overId);
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;
    state.doc.rows = arrayMove(rows as Section[], activeIndex, overIndex);
    //  ^^^^^^^ Assignment (not .push) — arrayMove returns a new array
  }),
```

**Immer pattern note:** The existing `removeSection` uses `state.doc.rows = state.doc.rows.filter(...)` — same assignment pattern. Both are valid in Immer-wrapped Zustand.

[VERIFIED: arrayMove source + existing removeSection pattern in useNewsletterStore.ts]

---

## Pattern 8: `duplicateSection` Store Action

**What:** Deep clone via `structuredClone<T>`, assign fresh UUIDs to section + all slots + all non-null elements. Insert immediately after original.

**Verified:** TypeScript 6.0.3 `lib.dom.d.ts` exports `structuredClone<T = any>(value: T): T`. Node 22.15 has native `structuredClone`. jsdom 29.1.1 does NOT stub `structuredClone` but the jsdom test environment inherits it from Node.js 22 global scope — available in tests.

```typescript
// TypeScript generic form confirmed from lib.dom.d.ts:
// declare function structuredClone<T = any>(value: T, options?: StructuredSerializeOptions): T;

duplicateSection: (sectionId: string) =>
  set((state) => {
    if (!state.doc) return;
    const index = state.doc.rows.findIndex((r) => r.id === sectionId);
    if (index === -1) return;

    const original = state.doc.rows[index];
    const clone = structuredClone<Section>(original);

    // Assign fresh UUIDs — required so DnD keys and internal references are unique
    clone.id = crypto.randomUUID();
    clone.slots = clone.slots.map((slot) => ({
      ...slot,
      id: crypto.randomUUID(),
      element: slot.element
        ? { ...slot.element, id: crypto.randomUUID() }
        : null,
    }));

    state.doc.rows.splice(index + 1, 0, clone);
    // .splice is a mutation — Immer-compatible ✅
  }),
```

[VERIFIED: TypeScript lib.dom.d.ts line 44124-44125 + Node 22 global + structuredClone compatibility confirmed]

---

## Pattern 9: `createSection` Helper (for `DragDropProvider`)

**What:** Constructs a blank `Section` from a `LayoutType`. Needed by `onDragEnd` when a `LAYOUT_CARD` is dropped. Define as a local function in `DragDropProvider.tsx`.

```typescript
import type { LayoutType, Section } from '@/types/newsletter';

const LAYOUT_SLOT_COUNTS: Record<LayoutType, number> = {
  '1col':                 1,
  '2col':                 2,
  '3col':                 3,
  'small-left-big-right': 2,
  'big-left-small-right': 2,
} as const;

function createSection(layoutType: LayoutType): Section {
  const slotCount = LAYOUT_SLOT_COUNTS[layoutType];
  return {
    id: crypto.randomUUID(),
    layoutType,
    slots: Array.from({ length: slotCount }, () => ({
      id: crypto.randomUUID(),
      element: null,
    })),
  };
}
```

[VERIFIED: LayoutType enum + ColumnGrid.tsx COLUMN_CLASSES (same slot counts)]

---

## Pattern 10: `RowBlock` Updated Props Interface

**What:** RowBlock receives sortable bindings as optional props. The component itself does NOT call any dnd-kit hooks (keeps it testable without DndContext).

```typescript
// Type imports from @dnd-kit/core:
// DraggableAttributes: { role, tabIndex, aria-disabled, aria-pressed, aria-roledescription, aria-describedby }
// DraggableSyntheticListeners: SyntheticListenerMap | undefined  (= Record<string, Function> | undefined)
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';

interface RowBlockProps {
  section:      Section;
  // Sortable bindings — all optional, default to no-ops outside SortableContext
  listeners?:   DraggableSyntheticListeners;
  attributes?:  DraggableAttributes;
  setNodeRef?:  (node: HTMLElement | null) => void;
  style?:       React.CSSProperties;   // transform + transition from useSortable
  isDragging?:  boolean;
  onDuplicate?: () => void;
  onDelete?:    () => void;
}

// RowBlock render (simplified):
export function RowBlock({
  section, listeners, attributes, setNodeRef, style, isDragging = false,
  onDuplicate, onDelete,
}: RowBlockProps) {
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        ...style,                                  // transform + transition first
        backgroundColor: section.backgroundColor ?? '#ffffff',
        paddingTop:    section.paddingTop    ? `${section.paddingTop}px`    : undefined,
        paddingBottom: section.paddingBottom ? `${section.paddingBottom}px` : undefined,
      }}
      className={cn(
        'relative bg-white rounded border shadow-sm overflow-hidden',
        isDragging && 'opacity-40 transition-opacity duration-150',
      )}
    >
      <ColumnGrid section={section} />
      <SectionControls
        listeners={listeners}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </div>
  );
}
```

**`{...style}` spread order:** Place `...style` BEFORE section styles so `transform`/`transition` CSS properties don't accidentally override `backgroundColor` or padding.

[VERIFIED: useSortable return type + TypeScript type files + UI-SPEC 04-UI-SPEC.md]

---

## Pattern 11: `SectionControls` Inline Delete Confirm

**What:** Local `useState` per-RowBlock controls the delete confirm state. No modal, no Zustand, no `AlertDialog`.

```typescript
// Inlined in RowBlock.tsx as a sub-component
function SectionControls({
  listeners, onDuplicate, onDelete,
}: {
  listeners?: DraggableSyntheticListeners;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 flex items-center gap-1">
      {/* Grip handle — drag activator */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Drag to reorder"
        className="cursor-grab text-muted-foreground"
        {...listeners}     // listeners on grip ONLY (not on outer RowBlock div)
      >
        <GripVertical className="size-4" />
      </Button>

      {/* Duplicate */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Duplicate section"
        className="text-muted-foreground hover:text-foreground"
        onClick={onDuplicate}
      >
        <Copy className="size-4" />
      </Button>

      {/* Delete — normal state */}
      {!isConfirming && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete section"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setIsConfirming(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      )}

      {/* Delete — confirm state */}
      {isConfirming && (
        <div aria-live="polite" className="flex items-center gap-1">
          <button
            className="text-xs font-medium text-destructive hover:underline cursor-pointer whitespace-nowrap"
            onClick={onDelete}
          >
            Delete?
          </button>
          <button
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer whitespace-nowrap"
            onClick={() => setIsConfirming(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
```

**Listeners on grip button only:** `{...listeners}` is spread on the `GripVertical` button, NOT on the outer `RowBlock` div. This means dragging only starts when the user presses the grip handle — the rest of the row is not a drag activator.

[VERIFIED: UI-SPEC D-05 to D-07, Button component `icon-sm` size confirmed from `button.tsx` (size-8)]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Array reorder | Custom swap logic | `arrayMove` from `@dnd-kit/sortable` | Handles edge cases (index wrapping, boundary clamp); one line |
| Deep clone with UUID refresh | Recursive clone function | `structuredClone<Section>(obj)` + UUID loop | `structuredClone` handles nested objects, circular refs, typed arrays |
| Keyboard drag navigation | Custom key handler | `sortableKeyboardCoordinates` from `@dnd-kit/sortable` | Handles arrow key navigation with visual feedback; WCAG-compliant |
| CSS transform string | `translate(${x}px, ${y}px)` | `CSS.Transform.toString(transform)` from `@dnd-kit/utilities` | Handles null transform (returns `undefined`), scale, and translate |
| Portal for drag ghost | `ReactDOM.createPortal` | `DragOverlay` from `@dnd-kit/core` | Built-in positioning, animation, and z-index management |
| Drag type discrimination | `typeof id === 'string'` heuristics | `active.data.current?.type` against `DRAG_TYPES` enum | Explicit type from `useDraggable`/`useSortable` data property |

---

## Common Pitfalls

### Pitfall 1: Context7 Docs Show Wrong API Version
**What goes wrong:** Context7 docs for dnd-kit show `@dnd-kit/react` package API (`DragDropProvider`, `PointerActivationConstraints`, `useSortable({ id, index })`) which is the NEW unreleased/alpha API — different from the installed `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0` (classic API).
**Why it happens:** Context7 indexed the new v2 API documentation from the `apps/docs` folder.
**How to avoid:** Always use imports from `@dnd-kit/core` and `@dnd-kit/sortable` (not `@dnd-kit/react` or `@dnd-kit/dom`). The classic API uses `useSensor/useSensors` (not `PointerSensor.configure`), `DndContext` (not `DragDropProvider` from dnd-kit), and `useSortable` without an `index` param.
**Warning signs:** Import from `@dnd-kit/react` or `@dnd-kit/dom` = wrong package.

### Pitfall 2: `useSortable` called inside `RowBlock` directly
**What goes wrong:** If `useSortable` is called inside `RowBlock`, the component requires `DndContext` + `SortableContext` parent to render — breaking all existing `RowBlock.test.tsx` tests.
**Why it happens:** Tempting to put all sortable logic in one component.
**How to avoid:** Create a `SortableRowBlock` wrapper (local to `SortableRowList.tsx`) that calls `useSortable` and passes results as props to `RowBlock`. `RowBlock` stays a dumb component.
**Warning signs:** `RowBlock.test.tsx` crashes with context errors.

### Pitfall 3: Existing tests break after adding `useDraggable` to `BuilderPalette`
**What goes wrong:** `BuilderPalette.test.tsx` renders `BuilderPalette` without `DndContext`. After adding `useDraggable`, `draggableNodes.set(id, {...})` mutates the shared default context Map. Tests likely still pass (no throw), but the behavior is non-deterministic across test runs.
**Why it happens:** `useDraggable` reads from `InternalContext` which has a non-null default value — doesn't throw, but silently mutates shared state.
**How to avoid:** Wrap `BuilderPalette` in `DndContext` in its test file. Similarly, `BuilderCanvas.test.tsx` needs `DndContext` wrapper after `SortableRowList` is introduced.
**Warning signs:** Intermittent test failures in unrelated tests.

### Pitfall 4: `arrayMove` returns a new array — Immer assignment required
**What goes wrong:** Calling `state.doc.rows.sort()` or attempting to mutate in-place when `arrayMove` returns a new array.
**Why it happens:** Developers expect mutation syntax throughout Immer code.
**How to avoid:** Use assignment: `state.doc.rows = arrayMove(rows as Section[], fromIndex, toIndex)`. The existing `removeSection` action confirms assignment is valid in this codebase.
**Warning signs:** Array order unchanged after reorder, TypeScript error on `arrayMove` return type.

### Pitfall 5: `listeners` spread on outer `RowBlock` div activates drag on any click
**What goes wrong:** Spreading `{...listeners}` on the outer `RowBlock` div means clicking anywhere on the row (including text, buttons) initiates a drag. The 8 px distance constraint reduces false triggers but doesn't eliminate them.
**Why it happens:** Common example code puts listeners on the draggable root element.
**How to avoid:** Spread `{...listeners}` ONLY on the `GripVertical` button inside `SectionControls`. This is the drag handle pattern — drag only initiates from the grip icon.
**Warning signs:** Clicking on column slot areas accidentally starts a drag.

### Pitfall 6: `over` is null when `LAYOUT_CARD` dropped outside the canvas
**What goes wrong:** `onDragEnd` fires without null-checking `over` — crashes when accessing `over.id`.
**Why it happens:** User releases drag outside any droppable zone (e.g., on browser chrome).
**How to avoid:** Always null-check `over` before dispatching store actions: `if (dragType === DRAG_TYPES.LAYOUT_CARD && over !== null)`.

### Pitfall 7: `active.id === over.id` guard missing for row reorder
**What goes wrong:** `reorderSections` called when a row is dropped on itself, causing a no-op `arrayMove(rows, i, i)` call. While not harmful, it triggers an unnecessary Zustand re-render.
**Why it happens:** `onDragEnd` fires even when the drag didn't change position.
**How to avoid:** Guard with `active.id !== over.id` before calling `reorderSections`.

### Pitfall 8: `SortableContext` items must use same IDs as `useSortable`
**What goes wrong:** Mismatch between `items` prop on `SortableContext` and `id` prop on `useSortable` — row appears in wrong position or doesn't participate in sort.
**Why it happens:** IDs passed to `SortableContext` must exactly match the `id` passed to `useSortable` for each item.
**How to avoid:** Use `rows.map(s => s.id)` for `SortableContext` items and `useSortable({ id: section.id })` for each row. Both reference the same `Section.id` (UUID).

---

## Runtime State Inventory

> Not applicable — Phase 4 is a pure frontend code change. No rename/refactor/migration involved.

---

## Code Examples

### Complete `DragDropProvider.tsx`
```typescript
// apps/client/src/components/builder/DragDropProvider.tsx
import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DRAG_TYPES } from '@/dnd/types';
import type { LayoutType, Section } from '@/types/newsletter';
import { useNewsletterStore } from '@/store/useNewsletterStore';
import { RowBlock } from './RowBlock';

// Maps LayoutType → slot count
const LAYOUT_SLOT_COUNTS: Record<LayoutType, number> = {
  '1col': 1, '2col': 2, '3col': 3,
  'small-left-big-right': 2, 'big-left-small-right': 2,
};

const LAYOUT_NAMES: Record<LayoutType, string> = {
  '1col': '1 Column', '2col': '2 Columns', '3col': '3 Columns',
  'small-left-big-right': 'Small-Left / Big-Right',
  'big-left-small-right': 'Big-Left / Small-Right',
};

function createSection(layoutType: LayoutType): Section {
  return {
    id: crypto.randomUUID(),
    layoutType,
    slots: Array.from({ length: LAYOUT_SLOT_COUNTS[layoutType] }, () => ({
      id: crypto.randomUUID(),
      element: null,
    })),
  };
}

interface ActiveDrag {
  type: string;
  layoutType?: LayoutType;
  section?: Section;
}

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const { addSection, reorderSections, doc } = useNewsletterStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    const data = active.data.current;
    if (data?.type === DRAG_TYPES.LAYOUT_CARD) {
      setActiveDrag({ type: DRAG_TYPES.LAYOUT_CARD, layoutType: data.layoutType as LayoutType });
    } else if (data?.type === DRAG_TYPES.CANVAS_ROW) {
      const section = doc?.rows.find(r => r.id === String(active.id));
      setActiveDrag({ type: DRAG_TYPES.CANVAS_ROW, section });
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDrag(null);
    const dragType = active.data.current?.type as string | undefined;

    if (dragType === DRAG_TYPES.LAYOUT_CARD && over !== null) {
      const layoutType = active.data.current?.layoutType as LayoutType;
      addSection(createSection(layoutType));
      return;
    }

    if (dragType === DRAG_TYPES.CANVAS_ROW && over !== null && active.id !== over.id) {
      reorderSections(String(active.id), String(over.id));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeDrag?.type === DRAG_TYPES.LAYOUT_CARD && activeDrag.layoutType && (
          <div className="p-3 border rounded-md text-sm bg-white shadow-md opacity-80 cursor-grabbing select-none">
            {LAYOUT_NAMES[activeDrag.layoutType]}
          </div>
        )}
        {activeDrag?.type === DRAG_TYPES.CANVAS_ROW && activeDrag.section && (
          <div className="opacity-80 cursor-grabbing">
            <RowBlock section={activeDrag.section} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

### `SortableRowList.tsx` — Empty Drop Zone + Sortable List
```typescript
// apps/client/src/components/builder/SortableRowList.tsx
import React from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Section } from '@/types/newsletter';
import { RowBlock } from './RowBlock';
import { useNewsletterStore } from '@/store/useNewsletterStore';
import { cn } from '@/lib/utils';

const CANVAS_ZONE_ID = 'canvas-drop-zone';

function SortableRowBlock({ section }: { section: Section }) {
  const { removeSection, duplicateSection } = useNewsletterStore();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: section.id });

  return (
    <RowBlock
      section={section}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
      }}
      isDragging={isDragging}
      onDelete={() => removeSection(section.id)}
      onDuplicate={() => duplicateSection(section.id)}
    />
  );
}

interface SortableRowListProps {
  rows: Section[];
}

export function SortableRowList({ rows }: SortableRowListProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: CANVAS_ZONE_ID,
  });

  if (rows.length === 0) {
    return (
      <div
        ref={setNodeRef}
        aria-label="Canvas drop zone. Drop a layout here."
        className={cn(
          'h-48 border-2 rounded-md flex items-center justify-center',
          'text-sm text-muted-foreground transition-colors duration-150',
          isOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-dashed border-neutral-300',
        )}
      >
        Drop a layout here
      </div>
    );
  }

  return (
    <SortableContext items={rows.map(s => s.id)} strategy={verticalListSortingStrategy}>
      {rows.map(section => (
        <SortableRowBlock key={section.id} section={section} />
      ))}
    </SortableContext>
  );
}
```

### `reorderSections` + `duplicateSection` store actions
```typescript
// Add to useNewsletterStore.ts actions interface:
reorderSections: (activeId: string, overId: string) => void;
duplicateSection: (sectionId: string) => void;

// Implementation:
reorderSections: (activeId, overId) =>
  set((state) => {
    if (!state.doc) return;
    const rows = state.doc.rows;
    const activeIndex = rows.findIndex((r) => r.id === activeId);
    const overIndex  = rows.findIndex((r) => r.id === overId);
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;
    state.doc.rows = arrayMove(rows as Section[], activeIndex, overIndex);
  }),

duplicateSection: (sectionId) =>
  set((state) => {
    if (!state.doc) return;
    const index = state.doc.rows.findIndex((r) => r.id === sectionId);
    if (index === -1) return;
    const clone = structuredClone<Section>(state.doc.rows[index]);
    clone.id = crypto.randomUUID();
    clone.slots = clone.slots.map((slot) => ({
      ...slot,
      id: crypto.randomUUID(),
      element: slot.element ? { ...slot.element, id: crypto.randomUUID() } : null,
    }));
    state.doc.rows.splice(index + 1, 0, clone);
  }),
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + @testing-library/react 16.3.2 |
| Config file | `apps/client/vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` (from `apps/client/`) |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CANVAS-02 | `addSection` called when LAYOUT_CARD dropped on canvas | unit (store) | `npx vitest run src/store` | ❌ Wave 0 |
| CANVAS-03 | Section appended at bottom (index = last) | unit (store) | `npx vitest run src/store` | ❌ Wave 0 |
| CANVAS-04 | `reorderSections` reorders `doc.rows` correctly | unit (store) | `npx vitest run src/store` | ❌ Wave 0 |
| CANVAS-05 | `removeSection` + SectionControls delete flow | unit (store) + component | `npx vitest run src/store src/components/builder` | partial ✅ |
| CANVAS-06 | `duplicateSection` creates clone with new IDs, inserted at index+1 | unit (store) | `npx vitest run src/store` | ❌ Wave 0 |
| CANVAS-02..04 | Empty drop zone renders when rows=[] | component (render) | `npx vitest run src/components/builder` | ❌ Wave 0 |
| CANVAS-04 | SortableRowList renders N rows (not empty zone) when rows non-empty | component (render) | `npx vitest run src/components/builder` | ❌ Wave 0 |
| CANVAS-05/06 | RowBlock renders SectionControls; Trash2/Copy buttons present | component (render) | `npx vitest run src/components/builder/__tests__/RowBlock.test.tsx` | ✅ (needs extension) |
| CANVAS-05 | Delete confirm flow: click Trash2 → "Delete?" appears; click "Delete?" → onDelete called | component (interaction) | `npx vitest run src/components/builder/__tests__/RowBlock.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (from `apps/client/`)
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/client/src/store/__tests__/useNewsletterStore.test.ts` — covers CANVAS-02, CANVAS-03, CANVAS-04, CANVAS-05 (reorder), CANVAS-06
- [ ] `apps/client/src/components/builder/__tests__/SortableRowList.test.tsx` — covers empty drop zone rendering + rows rendering (with `DndContext` wrapper)
- [ ] `apps/client/src/components/builder/__tests__/DragDropProvider.test.tsx` — renders children
- [ ] Update `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` — add `DndContext` wrapper
- [ ] Update `apps/client/src/components/builder/__tests__/BuilderPalette.test.tsx` — add `DndContext` wrapper
- [ ] Extend `apps/client/src/components/builder/__tests__/RowBlock.test.tsx` — add SectionControls + delete confirm tests

---

## Testing Patterns for dnd-kit Components

There is **no `@dnd-kit/testing` package**. The recommended strategies:

### Strategy 1: Pure store unit tests (no DOM)
```typescript
// apps/client/src/store/__tests__/useNewsletterStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useNewsletterStore } from '../useNewsletterStore';
import { FIXTURE_DOC } from '../../fixtures/newsletter.fixture';

beforeEach(() => {
  // Reset store to fixture state before each test
  useNewsletterStore.setState({ doc: structuredClone(FIXTURE_DOC), selectedElementId: null });
});

it('CANVAS-04: reorderSections moves row to new index', () => {
  const { reorderSections } = useNewsletterStore.getState();
  const originalIds = useNewsletterStore.getState().doc!.rows.map(r => r.id);

  reorderSections(originalIds[0], originalIds[2]);

  const newIds = useNewsletterStore.getState().doc!.rows.map(r => r.id);
  expect(newIds[0]).toBe(originalIds[1]);
  expect(newIds[1]).toBe(originalIds[2]);
  expect(newIds[2]).toBe(originalIds[0]);
});

it('CANVAS-06: duplicateSection inserts clone after original with new IDs', () => {
  const { duplicateSection } = useNewsletterStore.getState();
  const targetId = FIXTURE_DOC.rows[1].id;

  duplicateSection(targetId);

  const rows = useNewsletterStore.getState().doc!.rows;
  expect(rows).toHaveLength(FIXTURE_DOC.rows.length + 1);
  const clone = rows[2];     // inserted at index+1
  expect(clone.id).not.toBe(targetId);         // new section ID
  expect(clone.layoutType).toBe(rows[1].layoutType);  // same layout
  clone.slots.forEach((slot, i) => {
    expect(slot.id).not.toBe(FIXTURE_DOC.rows[1].slots[i].id);  // new slot IDs
  });
});
```

### Strategy 2: Component render tests (DndContext wrapper)
```typescript
// Wrap DnD components in DndContext for tests
import { DndContext } from '@dnd-kit/core';

function renderWithDnd(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

it('SortableRowList shows empty drop zone when rows=[]', () => {
  const { getByText } = renderWithDnd(<SortableRowList rows={[]} />);
  getByText('Drop a layout here');
});
```

### Strategy 3: Interaction tests for SectionControls
```typescript
import { fireEvent } from '@testing-library/react';

it('delete confirm flow', async () => {
  const onDelete = vi.fn();
  render(<RowBlock section={makeSection()} onDelete={onDelete} />);

  // First click: shows confirm state
  fireEvent.click(screen.getByRole('button', { name: 'Delete section' }));
  expect(screen.getByText('Delete?')).toBeInTheDocument();

  // Second click: calls onDelete
  fireEvent.click(screen.getByText('Delete?'));
  expect(onDelete).toHaveBeenCalledOnce();
});
```

**Not testable in jsdom:** Actual pointer drag events, collision detection output, CSS transform calculations.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit (hooks-based) | ~2021 | Modular, accessible, maintained |
| `useSortable` requires `index` prop | No `index` prop needed (computed internally) | dnd-kit v7+ | Simpler API — just pass `id` |
| `DraggableNodes` as object | `DraggableNodes` as `Map` | dnd-kit v7 | Access via `.get(id)` not `[id]` |
| `arraySwap` | `arrayMove` (recommended) | dnd-kit v7+ | `arrayMove` is the standard for lists |

**Not deprecated in this phase:**
- Classic `@dnd-kit/core` + `@dnd-kit/sortable` packages: active and maintained; the new `@dnd-kit/react` package is an alpha/preview with a different API

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `structuredClone` is available in jsdom 29 test environment via Node.js 22 globals | Pattern 8 | Tests for `duplicateSection` would fail; polyfill needed |
| A2 | `over.id` always matches a row UUID (not a container ID) during CANVAS_ROW sortable reorder | Pattern 4 | `reorderSections` receives a container ID not found in rows; `findIndex` returns -1, guard prevents mutation |

**All other claims are VERIFIED or CITED from source code inspection.**

---

## Open Questions

1. **`onDragEnd` fires before `onDragStart` cleanup — potential stale `activeDrag.section` ref**
   - What we know: `handleDragStart` captures `section` from `doc.rows.find()` at drag start time
   - What's unclear: If the user triggers a rapid drag-drop before re-render, `activeDrag.section` could be stale
   - Recommendation: For Phase 4 this is acceptable; the ghost clone is visual-only and the Zustand store is the source of truth

2. **`useSortable` data for CANVAS_ROW — should it include the section data?**
   - What we know: `useSortable({ id: section.id })` makes the row's data available as `active.data.current` = `{ sortable: { containerId, index, items }, ...customData }`
   - What's unclear: Whether we need to pass `data: { type: DRAG_TYPES.CANVAS_ROW }` explicitly to `useSortable` for type discrimination in `onDragEnd`
   - Recommendation: **Yes — pass `data: { type: DRAG_TYPES.CANVAS_ROW }` to `useSortable`** so `active.data.current.type` is set correctly. The `sortable` sub-object is added automatically by dnd-kit alongside custom data.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@dnd-kit/core` | All DnD interactions | ✓ | 6.3.1 | — |
| `@dnd-kit/sortable` | Row reorder | ✓ | 10.0.0 | — |
| `@dnd-kit/utilities` | CSS.Transform.toString | ✓ | 3.2.2 | — |
| `lucide-react` | GripVertical, Copy, Trash2 icons | ✓ | 1.17.0 | — |
| `structuredClone` | duplicateSection | ✓ | Node 22 global | — |
| `crypto.randomUUID` | createSection + duplicateSection | ✓ | Node 22 + modern browsers | — |

[VERIFIED: apps/client/package.json + node --version]

---

## Security Domain

> Phase 4 is a pure frontend UI feature (client-side DnD + store mutations). No authentication, no data input from external sources, no API calls added. ASVS controls are not applicable to this phase.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No | Section IDs are UUIDs generated internally; no user input in this phase |
| V6 Cryptography | No | `crypto.randomUUID()` is browser-native; no custom crypto |

---

## Sources

### Primary (HIGH confidence)
- `@dnd-kit/sortable@10.0.0` — dist/sortable.cjs.development.js — `useSortable`, `SortableContext`, `arrayMove` source inspected
- `@dnd-kit/core@6.3.1` — dist/core.cjs.development.js — `useDraggable`, `DragOverlay`, `PointerSensor`, `onDragEnd` event shape source inspected
- `@dnd-kit/core@6.3.1` — dist/index.d.ts, dist/types/events.d.ts, dist/store/types.d.ts — TypeScript types verified
- `@dnd-kit/utilities@3.2.2` — dist/css.d.ts — `CSS.Transform.toString` signature verified
- `apps/client/src/store/useNewsletterStore.ts` — existing `removeSection` assignment pattern verified
- `apps/client/src/components/ui/button.tsx` — `icon-sm` size variant (`size-8`) confirmed
- `apps/client/node_modules/react-dom/cjs/react-dom.production.js` — `unstable_batchedUpdates` confirmed in React 19.2.7
- `apps/client/node_modules/typescript/lib/lib.dom.d.ts` — `structuredClone<T>` generic confirmed
- `@dnd-kit/sortable` CHANGELOG.md — v10.0.0 is patch-only (dep bump); no API changes

### Secondary (MEDIUM confidence)
- Context7 `/clauderic/dnd-kit` — `arrayMove`, `SortableContext`, `DragOverlay` usage patterns (note: docs mix old and new API)
- `apps/client/src/components/builder/ColumnGrid.tsx` — `COLUMN_CLASSES` slot counts used to derive `LAYOUT_SLOT_COUNTS`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages installed and source-verified
- Architecture: HIGH — existing codebase fully read; patterns verified against dnd-kit source
- Pitfalls: HIGH — discovered from source inspection (defaultPublicContext, arrayMove return, listener placement)
- Testing strategy: HIGH — existing test files read; vitest config confirmed

**Research date:** 2026-06-08
**Valid until:** 2026-09-08 (stable libraries; dnd-kit classic API has been stable for 2+ years)
