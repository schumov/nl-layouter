// apps/client/src/components/builder/DragDropProvider.tsx
//
// Single DndContext root for the builder. All drag event handlers live here.
// DragOverlay renders the ghost during drags (LAYOUT_CARD ghost + CANVAS_ROW ghost).
//
// CRITICAL imports: @dnd-kit/core and @dnd-kit/sortable (NOT @dnd-kit/react or @dnd-kit/dom)
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
import type { CollisionDetection, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DRAG_TYPES } from '@/dnd/types';
import type { LayoutType, Section, ElementUnion } from '@/types/newsletter';
import { useNewsletterStore } from '@/store/useNewsletterStore';
import { RowBlock } from './RowBlock';
import { LAYOUT_NAMES, ELEMENT_NAMES, ELEMENT_CARD_ICONS } from './BuilderPalette';

// ─── createSection helper ─────────────────────────────────────────────────────
// Maps LayoutType → correct slot count — kept in sync with ColumnGrid.tsx COLUMN_CLASSES.
// Defined here (not in store) because it requires browser crypto.randomUUID().

const LAYOUT_SLOT_COUNTS: Record<LayoutType, number> = {
  '1col':                 1,
  '2col':                 2,
  '3col':                 3,
  'small-left-big-right': 2,
  'big-left-small-right': 2,
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

// ─── ActiveDrag state shape ───────────────────────────────────────────────────

interface ActiveDrag {
  type: string;
  layoutType?: LayoutType;              // LAYOUT_CARD ghost
  section?: Section;                     // CANVAS_ROW ghost
  elementType?: ElementUnion['type'];    // ELEMENT_CARD ghost — Phase 5
  elementLabel?: string;                 // display label for ELEMENT_CARD ghost
}

// ─── customCollision ──────────────────────────────────────────────────────────
// Critical fix for nested droppable collision (RESEARCH Finding 1).
// When an ELEMENT_CARD is being dragged, filter droppableContainers to only
// ColumnSlot droppables (those with data.current.type === DRAG_TYPES.ELEMENT_CARD).
// Without this, closestCenter returns the SortableRowBlock row in 1-column sections,
// preventing ColumnSlot.isOver from ever being true.

const customCollision: CollisionDetection = (args) => {
  const dragType = args.active.data.current?.type;

  if (dragType === DRAG_TYPES.ELEMENT_CARD) {
    const slotContainers = args.droppableContainers.filter(
      (c) => c.data.current?.type === DRAG_TYPES.ELEMENT_CARD,
    );
    if (slotContainers.length === 0) return [];
    return closestCenter({ ...args, droppableContainers: slotContainers });
  }

  return closestCenter(args);  // LAYOUT_CARD + CANVAS_ROW: standard closestCenter unchanged
};

// ─── ElementCardGhost ─────────────────────────────────────────────────────────
// DragOverlay ghost for ELEMENT_CARD drags. Extracted from DragDropProvider to
// avoid the IIFE pattern and keep JSX readable (IN-03 review fix).

function ElementCardGhost({ elementType, elementLabel }: { elementType: ElementUnion['type']; elementLabel: string }) {
  const Icon = ELEMENT_CARD_ICONS[elementType];
  return (
    <div className="p-3 border rounded-md text-sm bg-white shadow-md opacity-80 cursor-grabbing select-none flex items-center gap-2">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{elementLabel}</span>
    </div>
  );
}

// ─── DragDropProvider ─────────────────────────────────────────────────────────

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const { addSection, reorderSections, addElement } = useNewsletterStore();
  const doc = useNewsletterStore((state) => state.doc);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,   // 8px movement required before drag starts — prevents accidental drag on click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,   // built-in arrow-key navigation for sortable
    }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    const data = active.data.current;
    if (data?.type === DRAG_TYPES.LAYOUT_CARD) {
      setActiveDrag({
        type: DRAG_TYPES.LAYOUT_CARD,
        layoutType: data.layoutType as LayoutType,
      });
    } else if (data?.type === DRAG_TYPES.CANVAS_ROW) {
      // Find the section in store to render its ghost clone
      const section = doc?.rows.find((r) => r.id === String(active.id));
      setActiveDrag({ type: DRAG_TYPES.CANVAS_ROW, section });
    } else if (data?.type === DRAG_TYPES.ELEMENT_CARD) {
      const elemType = data.elementType as ElementUnion['type'];
      setActiveDrag({
        type: DRAG_TYPES.ELEMENT_CARD,
        elementType: elemType,
        elementLabel: ELEMENT_NAMES[elemType],
      });
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDrag(null);   // always clear ghost on drag end
    const dragType = active.data.current?.type as string | undefined;

    // ── Palette card → canvas: create new section ──────────────────────────
    if (dragType === DRAG_TYPES.LAYOUT_CARD && over !== null) {
      // over !== null guard: user must release over a droppable zone (not browser chrome)
      const layoutType = active.data.current?.layoutType as LayoutType;
      addSection(createSection(layoutType));   // appends at bottom (CANVAS-03)
      return;
    }

    // ── Palette element card → column slot: create/replace element ─────────
    if (dragType === DRAG_TYPES.ELEMENT_CARD && over !== null) {
      const elementType = active.data.current?.elementType as ElementUnion['type'];
      addElement(String(over.id), elementType);
      // String() cast: over.id is UniqueIdentifier (string | number); slot.id is always string UUID
      return;
    }

    // ── Canvas row reorder ─────────────────────────────────────────────────
    if (
      dragType === DRAG_TYPES.CANVAS_ROW &&
      over !== null &&              // Pitfall 6: null guard required
      active.id !== over.id         // Pitfall 7: no-op guard when dropped on same row
    ) {
      reorderSections(String(active.id), String(over.id));
      // String() cast: UniqueIdentifier is string | number; Section.id is always string (UUID)
    }
  }

  function handleDragCancel() {
    setActiveDrag(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>
        {/* D-01: LAYOUT_CARD ghost — semi-transparent palette card clone at 80% opacity */}
        {activeDrag?.type === DRAG_TYPES.LAYOUT_CARD && activeDrag.layoutType && (
          <div className="p-3 border rounded-md text-sm bg-white shadow-md opacity-80 cursor-grabbing select-none">
            {LAYOUT_NAMES[activeDrag.layoutType]}
          </div>
        )}
        {/* D-02: CANVAS_ROW ghost — semi-transparent RowBlock clone at 80% opacity */}
        {activeDrag?.type === DRAG_TYPES.CANVAS_ROW && activeDrag.section && (
          <div className="opacity-80 cursor-grabbing">
            <RowBlock section={activeDrag.section} />
          </div>
        )}
        {/* Phase 5: ELEMENT_CARD ghost — icon + label card at 80% opacity */}
        {activeDrag?.type === DRAG_TYPES.ELEMENT_CARD && activeDrag.elementType && (
          <ElementCardGhost
            elementType={activeDrag.elementType}
            elementLabel={activeDrag.elementLabel ?? ''}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
