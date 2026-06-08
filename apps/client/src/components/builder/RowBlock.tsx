import React, { useState } from 'react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Section } from '../../types/newsletter';
import { ColumnGrid } from './ColumnGrid';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RowBlockProps {
  section:      Section;
  // Sortable bindings — all optional; RowBlock is "dumb" (no useSortable calls here).
  // Only SortableRowBlock (inside SortableRowList.tsx) calls useSortable.
  listeners?:   DraggableSyntheticListeners;
  attributes?:  DraggableAttributes;
  setNodeRef?:  (node: HTMLElement | null) => void;
  style?:       React.CSSProperties;   // transform + transition from useSortable
  isDragging?:  boolean;               // true while this row is the drag source
  onDuplicate?: () => void;
  onDelete?:    () => void;
}

// ─── SectionControls sub-component ───────────────────────────────────────────
// Inlined here (NOT exported) — scoped to RowBlock.tsx.
// D-05: floating cluster positioned absolute outside RowBlock right edge
// D-06: always visible (no hover-gating)
// D-07: local useState for inline delete confirm — no modal, no Zustand

function SectionControls({
  listeners,
  onDuplicate,
  onDelete,
}: {
  listeners?:   DraggableSyntheticListeners;
  onDuplicate?: () => void;
  onDelete?:    () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    // D-05: absolute right-0 top-1/2 -translate-y-1/2 translate-x-full → floats to the right outside RowBlock
    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 flex items-center gap-1">
      {/* Grip handle — listeners ONLY on this button; outer RowBlock div is NOT a drag activator */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Drag to reorder"
        className="cursor-grab text-muted-foreground"
        {...listeners}
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

      {/* Delete — inline confirm state (D-07): no modal, no AlertDialog */}
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

// ─── RowBlock ─────────────────────────────────────────────────────────────────

export function RowBlock({
  section,
  listeners,
  attributes,
  setNodeRef,
  style,
  isDragging = false,
  onDuplicate,
  onDelete,
}: RowBlockProps) {
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        ...style,                                    // sortable transform + transition FIRST
        backgroundColor: section.backgroundColor ?? '#ffffff',
        paddingTop:    section.paddingTop    ? `${section.paddingTop}px`    : undefined,
        paddingBottom: section.paddingBottom ? `${section.paddingBottom}px` : undefined,
      }}
      className={cn(
        'relative bg-white rounded border shadow-sm overflow-hidden',
        // 'relative' enables the absolute-positioned SectionControls (D-05)
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
