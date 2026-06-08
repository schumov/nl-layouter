// apps/client/src/components/builder/SortableRowList.tsx
//
// Renders the sortable section list on the canvas.
// Two modes:
//   rows.length === 0 → dashed empty drop zone (useDroppable) with D-03/D-04 visuals
//   rows.length > 0  → SortableContext wrapping SortableRowBlock instances (CANVAS-04)
//
// ARCHITECTURAL RULE: SortableRowBlock (local, not exported) calls useSortable.
// RowBlock is a DUMB component — it does NOT call useSortable (keeps it testable alone).
import React from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { DRAG_TYPES } from '@/dnd/types';
import type { Section } from '@/types/newsletter';
import { RowBlock } from './RowBlock';
import { useNewsletterStore } from '@/store/useNewsletterStore';
import { cn } from '@/lib/utils';

// Stable ID for the empty canvas droppable zone — not a UUID (must be stable across renders)
const CANVAS_ZONE_ID = 'canvas-drop-zone';

// ─── SortableRowBlock (local — NOT exported) ──────────────────────────────────
// Calls useSortable and passes all bindings to the dumb RowBlock component.
// CRITICAL: data: { type: DRAG_TYPES.CANVAS_ROW } is REQUIRED so DragDropProvider's
// onDragEnd and onDragStart can discriminate CANVAS_ROW from LAYOUT_CARD types.

function SortableRowBlock({ section }: { section: Section }) {
  const { removeSection, duplicateSection } = useNewsletterStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: DRAG_TYPES.CANVAS_ROW },   // REQUIRED for onDragEnd type discrimination
  });

  return (
    <RowBlock
      section={section}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),   // null → undefined (safe)
        transition: transition ?? undefined,
      }}
      isDragging={isDragging}
      onDelete={() => removeSection(section.id)}
      onDuplicate={() => duplicateSection(section.id)}
    />
  );
}

// ─── SortableRowList (exported) ───────────────────────────────────────────────

interface SortableRowListProps {
  rows: Section[];
}

export function SortableRowList({ rows }: SortableRowListProps) {
  const { isOver, setNodeRef } = useDroppable({ id: CANVAS_ZONE_ID });

  // ── Empty state: full-area droppable zone (D-03/D-04) ──────────────────────
  if (rows.length === 0) {
    return (
      <div
        ref={setNodeRef}
        aria-label="Canvas drop zone. Drop a layout here."
        className={cn(
          'h-48 border-2 rounded-md flex items-center justify-center',
          'text-sm text-muted-foreground transition-colors duration-150',
          isOver
            ? 'border-blue-400 bg-blue-50'         // D-04: solid blue on hover
            : 'border-dashed border-neutral-300',  // D-03: dashed default
        )}
      >
        Drop a layout here
      </div>
    );
  }

  // ── Populated state: SortableContext + SortableRowBlock items ──────────────
  // items must exactly match useSortable id values — both use section.id (Pitfall 8)
  return (
    <SortableContext items={rows.map((s) => s.id)} strategy={verticalListSortingStrategy}>
      {rows.map((section) => (
        <SortableRowBlock key={section.id} section={section} />
      ))}
    </SortableContext>
  );
}
