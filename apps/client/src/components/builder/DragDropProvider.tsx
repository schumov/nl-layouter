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
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DRAG_TYPES } from '@/dnd/types';
import type { LayoutType, Section } from '@/types/newsletter';
import { useNewsletterStore } from '@/store/useNewsletterStore';
import { RowBlock } from './RowBlock';
import { LAYOUT_NAMES } from './BuilderPalette';

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
  layoutType?: LayoutType;   // for LAYOUT_CARD ghost — shows layout name label
  section?: Section;         // for CANVAS_ROW ghost — clones the actual RowBlock
}

// ─── DragDropProvider ─────────────────────────────────────────────────────────

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const { addSection, reorderSections } = useNewsletterStore();
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
      </DragOverlay>
    </DndContext>
  );
}
