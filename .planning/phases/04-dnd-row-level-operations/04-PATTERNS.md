# Phase 4: DnD — Row-Level Operations — Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 9 (2 new, 7 modified)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/client/src/components/builder/DragDropProvider.tsx` | provider | event-driven | `apps/client/src/pages/BuilderPage.tsx` | role-match |
| `apps/client/src/components/builder/SortableRowList.tsx` | component | event-driven | `apps/client/src/components/builder/BuilderCanvas.tsx` | exact |
| `apps/client/src/components/builder/RowBlock.tsx` | component | request-response | itself (extend) | exact |
| `apps/client/src/components/builder/BuilderPalette.tsx` | component | event-driven | itself (extend) | exact |
| `apps/client/src/components/builder/BuilderCanvas.tsx` | component | CRUD | itself (modify) | exact |
| `apps/client/src/store/useNewsletterStore.ts` | store | CRUD | itself (extend) | exact |
| `apps/client/src/components/builder/__tests__/RowBlock.test.tsx` | test | request-response | itself (extend) | exact |
| `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` | test | request-response | itself (extend) | exact |
| `apps/client/src/store/__tests__/useNewsletterStore.test.ts` | test | CRUD | `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` | role-match |

---

## Pattern Assignments

### `DragDropProvider.tsx` (NEW — provider, event-driven)

**Analog:** `apps/client/src/pages/BuilderPage.tsx`

**Imports pattern** (BuilderPage.tsx lines 1–8 — store selector + hook pattern to copy):
```typescript
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
```

**Store selector pattern** (BuilderPage.tsx lines 13–15 — exact pattern to copy):
```typescript
// Named action destructure (not selector) for mutations
const { addSection, reorderSections, doc } = useNewsletterStore();
// Selector pattern for reactive state reads
const doc = useNewsletterStore((state) => state.doc);
```

**Core provider pattern** (BuilderPage.tsx lines 38–50 — wrapper structure to follow):
```typescript
// BuilderPage wraps children in layout divs — DragDropProvider wraps in DndContext:
export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const { addSection, reorderSections, doc } = useNewsletterStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {/* ghost content — see Core Pattern below */}
      </DragOverlay>
    </DndContext>
  );
}
```

**onDragEnd discrimination pattern** (RESEARCH.md Pattern 4, lines 270–295):
```typescript
// Type-discriminate on active.data.current?.type — ALWAYS reference DRAG_TYPES, never string literals (CC-5)
function handleDragEnd({ active, over }: DragEndEvent) {
  setActiveDrag(null);
  const dragType = active.data.current?.type as string | undefined;

  // LAYOUT_CARD → addSection (append at bottom)
  if (dragType === DRAG_TYPES.LAYOUT_CARD && over !== null) {
    const layoutType = active.data.current?.layoutType as LayoutType;
    addSection(createSection(layoutType));
    return;
  }

  // CANVAS_ROW → reorderSections (guard: dropped on different row)
  if (dragType === DRAG_TYPES.CANVAS_ROW && over !== null && active.id !== over.id) {
    reorderSections(String(active.id), String(over.id));
  }
}
```

**DragOverlay ghost rendering pattern** (RESEARCH.md Pattern 5, lines 312–337):
```typescript
// activeDrag state shape:
interface ActiveDrag {
  type: string;
  layoutType?: LayoutType;   // for LAYOUT_CARD ghost label
  section?: Section;         // for CANVAS_ROW ghost clone
}

// Ghost rendering — two conditional branches inside single DragOverlay:
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

**createSection helper** (RESEARCH.md Pattern 9, lines 454–473 — local to DragDropProvider.tsx):
```typescript
// Maps LayoutType → slot count — keep in sync with ColumnGrid.tsx COLUMN_CLASSES
const LAYOUT_SLOT_COUNTS: Record<LayoutType, number> = {
  '1col': 1, '2col': 2, '3col': 3,
  'small-left-big-right': 2, 'big-left-small-right': 2,
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
```

---

### `SortableRowList.tsx` (NEW — component, event-driven)

**Analog:** `apps/client/src/components/builder/BuilderCanvas.tsx`

**Imports pattern** (BuilderCanvas.tsx lines 1–3 extended with dnd-kit):
```typescript
import React from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Section } from '@/types/newsletter';
import { RowBlock } from './RowBlock';
import { useNewsletterStore } from '@/store/useNewsletterStore';
import { cn } from '@/lib/utils';
```

**Droppable constant** (agent's discretion — local constant):
```typescript
// Droppable ID for the empty canvas drop zone — stable string, not a UUID
const CANVAS_ZONE_ID = 'canvas-drop-zone';
```

**SortableRowBlock inner component pattern** (RESEARCH.md Pattern 2, lines 196–229):
```typescript
// SortableRowBlock is LOCAL to SortableRowList.tsx — NOT exported.
// useSortable hook lives here; RowBlock stays a dumb component (no hook calls in RowBlock).
// CRITICAL: Pass data: { type: DRAG_TYPES.CANVAS_ROW } so onDragEnd type-discrimination works.
function SortableRowBlock({ section }: { section: Section }) {
  const { removeSection, duplicateSection } = useNewsletterStore();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: section.id,
    data: { type: DRAG_TYPES.CANVAS_ROW },   // REQUIRED for onDragEnd discrimination
  });

  return (
    <RowBlock
      section={section}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),  // handles null → undefined
        transition: transition ?? undefined,
      }}
      isDragging={isDragging}
      onDelete={() => removeSection(section.id)}
      onDuplicate={() => duplicateSection(section.id)}
    />
  );
}
```

**SortableRowList core pattern** — empty drop zone + sortable list (RESEARCH.md lines 838–868):
```typescript
export function SortableRowList({ rows }: { rows: Section[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: CANVAS_ZONE_ID });

  // Empty state: full droppable zone with visual feedback
  if (rows.length === 0) {
    return (
      <div
        ref={setNodeRef}
        aria-label="Canvas drop zone. Drop a layout here."
        className={cn(
          'h-48 border-2 rounded-md flex items-center justify-center',
          'text-sm text-muted-foreground transition-colors duration-150',
          isOver
            ? 'border-blue-400 bg-blue-50'            // D-04: solid blue on hover
            : 'border-dashed border-neutral-300',      // D-03: dashed default
        )}
      >
        Drop a layout here
      </div>
    );
  }

  // Populated state: SortableContext wrapping SortableRowBlock items
  return (
    <SortableContext items={rows.map(s => s.id)} strategy={verticalListSortingStrategy}>
      {rows.map(section => (
        <SortableRowBlock key={section.id} section={section} />
      ))}
    </SortableContext>
  );
}
```

**cn() usage pattern** (ColumnSlot.tsx line 15 — conditional class composition):
```typescript
// Use cn() from '@/lib/utils' for conditional Tailwind class application
// Tailwind v4 CC-5 rule: complete string literals only — no template literals
import { cn } from '@/lib/utils';
// cn(baseClasses, conditionalClass && 'complete-literal-class')
```

---

### `RowBlock.tsx` (MODIFY — component, request-response)

**Current file:** `apps/client/src/components/builder/RowBlock.tsx` (lines 1–23)

**Existing structure to preserve** (RowBlock.tsx lines 9–22):
```typescript
// Existing inline style pattern — backgroundColor + padding overrides
// KEEP this exact pattern; prepend ...style (sortable transform) before section styles
export function RowBlock({ section }: RowBlockProps) {
  return (
    <div
      className="bg-white rounded border shadow-sm overflow-hidden"
      style={{
        backgroundColor: section.backgroundColor ?? '#ffffff',
        paddingTop:    section.paddingTop    ? `${section.paddingTop}px`    : undefined,
        paddingBottom: section.paddingBottom ? `${section.paddingBottom}px` : undefined,
      }}
    >
      <ColumnGrid section={section} />
    </div>
  );
}
```

**New imports to add** (lines 1–2 extended):
```typescript
import React, { useState } from 'react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Section } from '../../types/newsletter';
import { ColumnGrid } from './ColumnGrid';
```

**Extended RowBlockProps interface** (RESEARCH.md Pattern 10, lines 490–500):
```typescript
interface RowBlockProps {
  section:      Section;
  // Sortable bindings — all optional; no-op when RowBlock is rendered outside SortableContext
  listeners?:   DraggableSyntheticListeners;
  attributes?:  DraggableAttributes;
  setNodeRef?:  (node: HTMLElement | null) => void;
  style?:       React.CSSProperties;   // transform + transition from useSortable
  isDragging?:  boolean;               // true while this row is the drag source
  onDuplicate?: () => void;
  onDelete?:    () => void;
}
```

**Updated RowBlock render** (RESEARCH.md Pattern 10, lines 503–531):
```typescript
export function RowBlock({
  section, listeners, attributes, setNodeRef, style, isDragging = false,
  onDuplicate, onDelete,
}: RowBlockProps) {
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        ...style,                                  // sortable transform FIRST to avoid overriding section styles
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

**SectionControls sub-component** (inline in RowBlock.tsx — RESEARCH.md Pattern 11, lines 544–610):
```typescript
// Inlined as a named function before RowBlock export — NOT a separate file
function SectionControls({
  listeners, onDuplicate, onDelete,
}: {
  listeners?: DraggableSyntheticListeners;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    // D-05: absolute right-0 top-1/2 -translate-y-1/2 translate-x-full → floats outside RowBlock to the right
    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 flex items-center gap-1">
      {/* Grip handle — listeners on this button ONLY (not on outer RowBlock div) */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Drag to reorder"
        className="cursor-grab text-muted-foreground"
        {...listeners}
      >
        <GripVertical className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Duplicate section"
        className="text-muted-foreground hover:text-foreground"
        onClick={onDuplicate}
      >
        <Copy className="size-4" />
      </Button>

      {/* D-07: inline delete confirm — no modal, local useState only */}
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

**Button component API** (button.tsx lines 22–32 — `size="icon-sm"` = `size-8`):
```typescript
// Confirmed variant + size API from apps/client/src/components/ui/button.tsx:
// variant="ghost"  → hover:bg-accent hover:text-accent-foreground
// size="icon-sm"   → size-8 (32px touch target)
// Use <Button variant="ghost" size="icon-sm" className="...override...">
```

---

### `BuilderPalette.tsx` (MODIFY — component, event-driven)

**Current file:** `apps/client/src/components/builder/BuilderPalette.tsx` (lines 1–37)

**New imports to add** (lines 1–2 extended):
```typescript
import { useDraggable } from '@dnd-kit/core';
import { DRAG_TYPES } from '@/dnd/types';
import type { LayoutType } from '@/types/newsletter';
import { cn } from '@/lib/utils';
```

**DraggableLayoutCard sub-component pattern** (RESEARCH.md Pattern 6, lines 351–374):
```typescript
// Extract each layout card <div> into a DraggableLayoutCard component — local to BuilderPalette.tsx
function DraggableLayoutCard({ layoutType, label }: { layoutType: LayoutType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: layoutType,     // layoutType string is unique; no collision with UUID-based row IDs
    data: {
      type: DRAG_TYPES.LAYOUT_CARD,   // CC-5: reference DRAG_TYPES, never string literal
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
        isDragging && 'opacity-40 cursor-grabbing',  // source card fades — ghost overlay takes over
      )}
    >
      {label}
    </div>
  );
}
```

**Updated map in BuilderPalette** (replace static div in lines 22–24):
```typescript
// Replace the static map:
//   {Object.entries(LAYOUT_NAMES).map(([type, label]) => (
//     <div key={type} className="p-3 border rounded-md text-sm cursor-default">
// With:
{Object.entries(LAYOUT_NAMES).map(([type, label]) => (
  <DraggableLayoutCard
    key={type}
    layoutType={type as LayoutType}
    label={label}
  />
))}
```

---

### `BuilderCanvas.tsx` (MODIFY — component, CRUD)

**Current file:** `apps/client/src/components/builder/BuilderCanvas.tsx` (lines 1–25)

**New imports to add** (replace RowBlock import with SortableRowList):
```typescript
// Remove: import { RowBlock } from './RowBlock';
// Add:
import { SortableRowList } from './SortableRowList';
```

**Minimal change — replace section map with SortableRowList** (lines 12–21):
```typescript
// BEFORE (lines 13–21):
// {doc?.rows.map((section) => (
//   <RowBlock key={section.id} section={section} />
// ))}
// {(!doc || doc.rows.length === 0) && (
//   <p className="text-center text-sm text-muted-foreground py-16">
//     No sections yet. Drag a layout from the palette to begin.
//   </p>
// )}

// AFTER — SortableRowList handles both empty and populated states:
{doc ? (
  <SortableRowList rows={doc.rows} />
) : (
  <p className="text-center text-sm text-muted-foreground py-16">
    No sections yet. Drag a layout from the palette to begin.
  </p>
)}
```

**Note:** The outer wrapper div (`flex-[3] min-w-0 overflow-y-auto bg-canvas`) and inner centering div (`max-w-[640px] mx-auto px-4 py-8 space-y-2`) are **unchanged**.

---

### `useNewsletterStore.ts` (MODIFY — store, CRUD)

**Current file:** `apps/client/src/store/useNewsletterStore.ts` (lines 1–93)

**New imports to add** (line 13 area):
```typescript
// Add to existing imports block:
import { arrayMove } from '@dnd-kit/sortable';
```

**Extend NewsletterActions interface** (after line 39 `removeSection`):
```typescript
// Add to interface NewsletterActions (lines 28–42):
reorderSections: (activeId: string, overId: string) => void;
duplicateSection: (sectionId: string) => void;
```

**reorderSections action** (RESEARCH.md Pattern 7, lines 392–401):
```typescript
// Add after removeSection (line 80) — uses assignment (not mutation) because arrayMove returns new array
reorderSections: (activeId, overId) =>
  set((state) => {
    if (!state.doc) return;
    const rows = state.doc.rows;
    const activeIndex = rows.findIndex((r) => r.id === activeId);
    const overIndex  = rows.findIndex((r) => r.id === overId);
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;
    state.doc.rows = arrayMove(rows as Section[], activeIndex, overIndex);
    // ^^^^^^^ Assignment pattern — same as removeSection's filter assignment on line 79
  }),
```

**duplicateSection action** (RESEARCH.md Pattern 8, lines 420–441):
```typescript
// Add after reorderSections
duplicateSection: (sectionId) =>
  set((state) => {
    if (!state.doc) return;
    const index = state.doc.rows.findIndex((r) => r.id === sectionId);
    if (index === -1) return;
    const clone = structuredClone<Section>(state.doc.rows[index]);
    // Assign fresh UUIDs — section, all slots, all non-null elements
    clone.id = crypto.randomUUID();
    clone.slots = clone.slots.map((slot) => ({
      ...slot,
      id: crypto.randomUUID(),
      element: slot.element ? { ...slot.element, id: crypto.randomUUID() } : null,
    }));
    state.doc.rows.splice(index + 1, 0, clone);  // .splice is mutation — Immer-compatible ✅
  }),
```

**Immer pattern notes** (from current file lines 71–80):
- `state.doc?.rows.push(section)` — optional chaining mutation ✅
- `state.doc.rows = state.doc.rows.filter(...)` — assignment ✅ (same pattern needed for `arrayMove`)
- `state.doc.rows.splice(index + 1, 0, clone)` — in-place mutation ✅

---

### `__tests__/RowBlock.test.tsx` (MODIFY — test, request-response)

**Current file:** `apps/client/src/components/builder/__tests__/RowBlock.test.tsx` (lines 1–33)

**Keep existing** — current 2 tests remain unchanged. **Add** these new tests:

**New imports needed** (add to line 3 area):
```typescript
import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
```

**SectionControls render test** (RESEARCH.md Strategy 3, lines 1005–1021):
```typescript
// RowBlock does NOT use dnd-kit hooks — no DndContext wrapper needed for RowBlock tests
it('renders SectionControls with all three buttons', () => {
  render(<RowBlock section={makeSection()} onDelete={vi.fn()} onDuplicate={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Drag to reorder' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Duplicate section' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delete section' })).toBeInTheDocument();
});

it('delete confirm flow: first click shows "Delete?", second click calls onDelete', () => {
  const onDelete = vi.fn();
  render(<RowBlock section={makeSection()} onDelete={onDelete} />);

  // First click — transitions to confirm state
  fireEvent.click(screen.getByRole('button', { name: 'Delete section' }));
  expect(screen.getByText('Delete?')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Delete section' })).not.toBeInTheDocument();

  // Second click — dispatches onDelete
  fireEvent.click(screen.getByText('Delete?'));
  expect(onDelete).toHaveBeenCalledOnce();
});

it('delete confirm cancel returns to normal state', () => {
  render(<RowBlock section={makeSection()} onDelete={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete section' }));
  expect(screen.getByText('Cancel')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Cancel'));
  expect(screen.getByRole('button', { name: 'Delete section' })).toBeInTheDocument();
  expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
});

it('applies opacity-40 when isDragging=true', () => {
  const { container } = render(<RowBlock section={makeSection()} isDragging={true} />);
  const card = container.firstChild as HTMLElement;
  expect(card).toHaveClass('opacity-40');
});
```

---

### `__tests__/BuilderCanvas.test.tsx` (MODIFY — test, request-response)

**Current file:** `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` (lines 1–28)

**New import to add** (line 3 area):
```typescript
import { DndContext } from '@dnd-kit/core';
```

**renderWithDnd helper** (RESEARCH.md Strategy 2, lines 995–1003):
```typescript
// Add above describe block — wraps components that include useDraggable / useSortable / SortableContext
function renderWithDnd(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}
```

**Update existing test calls** — replace `render(...)` with `renderWithDnd(...)` for all `BuilderCanvas` renders:
```typescript
// BEFORE: const { container } = render(<BuilderCanvas doc={FIXTURE_DOC} />);
// AFTER:
const { container } = renderWithDnd(<BuilderCanvas doc={FIXTURE_DOC} />);

// BEFORE: const { getByText } = render(<BuilderCanvas doc={null} />);
// AFTER:
const { getByText } = renderWithDnd(<BuilderCanvas doc={null} />);
```

**Note:** Existing test assertions (`flex-[3]`, column wrappers count, empty text) are **unchanged**. Only wrapping changes.

---

### `store/__tests__/useNewsletterStore.test.ts` (NEW — test, CRUD)

**Analog:** `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx`

**Full test file pattern** (RESEARCH.md Strategy 1, lines 951–987):
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useNewsletterStore } from '../useNewsletterStore';
import { FIXTURE_DOC } from '../../fixtures/newsletter.fixture';

// Reset store to clean fixture state before each test
// useNewsletterStore.setState is available from Zustand's static API
beforeEach(() => {
  useNewsletterStore.setState({
    doc: structuredClone(FIXTURE_DOC),
    selectedElementId: null,
  });
});
```

**CANVAS-03: addSection appends at bottom** pattern:
```typescript
it('CANVAS-03: addSection appends section at the bottom of doc.rows', () => {
  const { addSection } = useNewsletterStore.getState();
  const newSection = {
    id: 'new-section-id',
    layoutType: '1col' as const,
    slots: [{ id: 'new-slot-id', element: null }],
  };
  addSection(newSection);
  const rows = useNewsletterStore.getState().doc!.rows;
  expect(rows).toHaveLength(FIXTURE_DOC.rows.length + 1);
  expect(rows[rows.length - 1].id).toBe('new-section-id');
});
```

**CANVAS-04: reorderSections** pattern (RESEARCH.md lines 961–971):
```typescript
it('CANVAS-04: reorderSections moves row to new index', () => {
  const { reorderSections } = useNewsletterStore.getState();
  const originalIds = useNewsletterStore.getState().doc!.rows.map(r => r.id);

  reorderSections(originalIds[0], originalIds[2]);  // move first row to third position

  const newIds = useNewsletterStore.getState().doc!.rows.map(r => r.id);
  expect(newIds[0]).toBe(originalIds[1]);
  expect(newIds[1]).toBe(originalIds[2]);
  expect(newIds[2]).toBe(originalIds[0]);
});
```

**CANVAS-06: duplicateSection** pattern (RESEARCH.md lines 973–987):
```typescript
it('CANVAS-06: duplicateSection inserts clone after original with new IDs', () => {
  const { duplicateSection } = useNewsletterStore.getState();
  const targetId = FIXTURE_DOC.rows[1].id;  // fixture-row-2col

  duplicateSection(targetId);

  const rows = useNewsletterStore.getState().doc!.rows;
  expect(rows).toHaveLength(FIXTURE_DOC.rows.length + 1);

  const clone = rows[2];  // inserted at index 1 + 1 = 2
  expect(clone.id).not.toBe(targetId);                            // new section ID
  expect(clone.layoutType).toBe(FIXTURE_DOC.rows[1].layoutType); // same layout type

  clone.slots.forEach((slot, i) => {
    expect(slot.id).not.toBe(FIXTURE_DOC.rows[1].slots[i].id);   // new slot IDs
  });
});
```

**CANVAS-05: removeSection** pattern (extend existing coverage):
```typescript
it('CANVAS-05: removeSection removes section by ID', () => {
  const { removeSection } = useNewsletterStore.getState();
  const targetId = FIXTURE_DOC.rows[0].id;
  removeSection(targetId);
  const rows = useNewsletterStore.getState().doc!.rows;
  expect(rows).toHaveLength(FIXTURE_DOC.rows.length - 1);
  expect(rows.find(r => r.id === targetId)).toBeUndefined();
});
```

**Edge case guards** pattern (validates Pitfall 4 guard in reorderSections):
```typescript
it('reorderSections is a no-op when activeId === overId', () => {
  const id = FIXTURE_DOC.rows[0].id;
  useNewsletterStore.getState().reorderSections(id, id);
  const rows = useNewsletterStore.getState().doc!.rows;
  expect(rows.map(r => r.id)).toEqual(FIXTURE_DOC.rows.map(r => r.id));  // order unchanged
});

it('duplicateSection is a no-op for unknown sectionId', () => {
  useNewsletterStore.getState().duplicateSection('unknown-id');
  expect(useNewsletterStore.getState().doc!.rows).toHaveLength(FIXTURE_DOC.rows.length);
});
```

---

## Shared Patterns

### CC-5: DRAG_TYPES — Never String Literals
**Source:** `apps/client/src/dnd/types.ts` lines 11–20
**Apply to:** `DragDropProvider.tsx`, `SortableRowList.tsx`, `BuilderPalette.tsx`
```typescript
import { DRAG_TYPES } from '@/dnd/types';
// ✅ DRAG_TYPES.LAYOUT_CARD    DRAG_TYPES.CANVAS_ROW
// ❌ 'LAYOUT_CARD'             'CANVAS_ROW'
```

### Tailwind v4 CC-5 — Complete String Literals
**Source:** `apps/client/src/components/builder/ColumnGrid.tsx` lines 7–13 (comment + COLUMN_CLASSES)
**Apply to:** All new and modified component files
```typescript
// ⚠️ TAILWIND V4 RULE: All class names MUST be complete string literals.
// NEVER build via template literals — JIT scanner won't find them.
// ✅ 'bg-blue-50'   'border-blue-400'   'opacity-40'
// ❌ `bg-${color}-50`   `opacity-${val}`
```

### cn() Conditional Class Composition
**Source:** `apps/client/src/lib/utils.ts` lines 1–5
**Apply to:** `RowBlock.tsx`, `SortableRowList.tsx`, `BuilderPalette.tsx`
```typescript
import { cn } from '@/lib/utils';
// Pattern: cn(baseClasses, conditionalClass && 'literal-class-name')
className={cn('base classes', isDragging && 'opacity-40 cursor-grabbing')}
```

### Immer Store Mutation Pattern
**Source:** `apps/client/src/store/useNewsletterStore.ts` lines 71–80
**Apply to:** `reorderSections`, `duplicateSection` additions
```typescript
// Three valid patterns in this Zustand+Immer store:
// 1. Direct mutation:   state.doc?.rows.push(section)
// 2. Assignment:        state.doc.rows = state.doc.rows.filter(...)   ← use for arrayMove
// 3. Splice mutation:   state.doc.rows.splice(index + 1, 0, clone)    ← use for duplicate
```

### Store Selector Pattern
**Source:** `apps/client/src/pages/BuilderPage.tsx` lines 13–15
**Apply to:** `DragDropProvider.tsx` (reads `doc` for CANVAS_ROW ghost lookup)
```typescript
// Named destructure for actions (not reactive)
const { addSection, reorderSections } = useNewsletterStore();
// Selector for reactive state reads
const doc = useNewsletterStore((state) => state.doc);
```

### import type ColumnSlot Alias Pattern
**Source:** `apps/client/src/components/builder/ColumnSlot.tsx` line 2
**Apply to:** Any file that imports both the `ColumnSlot` component and the `ColumnSlot` type
```typescript
import type { ColumnSlot as ColumnSlotData } from '../../types/newsletter';
// Avoids component vs type naming collision
```

### DndContext Wrapper for Tests
**Source:** RESEARCH.md Strategy 2, lines 993–1003
**Apply to:** `BuilderCanvas.test.tsx`, `BuilderPalette.test.tsx` (and any new test for SortableRowList, DragDropProvider)
```typescript
import { DndContext } from '@dnd-kit/core';

function renderWithDnd(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}
// Required for any component that calls useDraggable, useSortable, or useDroppable
```

### Zustand Test Reset Pattern
**Source:** RESEARCH.md Strategy 1, lines 956–959
**Apply to:** `useNewsletterStore.test.ts`
```typescript
beforeEach(() => {
  useNewsletterStore.setState({
    doc: structuredClone(FIXTURE_DOC),
    selectedElementId: null,
  });
});
// structuredClone isolates each test — mutations in one test don't leak to the next
```

---

## No Analog Found

All 9 files have analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

---

## Metadata

**Analog search scope:** `apps/client/src/components/builder/`, `apps/client/src/store/`, `apps/client/src/pages/`, `apps/client/src/dnd/`, `apps/client/src/types/`, `apps/client/src/lib/`
**Files scanned:** 14 source files + 5 test files
**Pattern extraction date:** 2026-06-08
