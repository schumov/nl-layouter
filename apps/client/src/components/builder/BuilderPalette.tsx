import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DRAG_TYPES } from '@/dnd/types';
import type { LayoutType } from '@/types/newsletter';
import { cn } from '@/lib/utils';

// ⚠️ TAILWIND V4 RULE: All class names MUST be complete string literals.
// NEVER build via template literals — JIT scanner won't find them.

// Display labels for the 5 layout types (matches UI-SPEC copywriting contract)
// Exported so DragDropProvider can use for ghost overlay label text
export const LAYOUT_NAMES: Record<LayoutType, string> = {
  '1col':                 '1 Column',
  '2col':                 '2 Columns',
  '3col':                 '3 Columns',
  'small-left-big-right': 'Small-Left / Big-Right',
  'big-left-small-right': 'Big-Left / Small-Right',
};

// ─── DraggableLayoutCard ──────────────────────────────────────────────────────
// Local sub-component — NOT exported. One instance per layout type in the palette.
// useDraggable requires DndContext ancestor (provided by DragDropProvider in Plan 06).
// Tests wrap with renderWithDnd (Plan 00 Task 2) so tests do not throw.

function DraggableLayoutCard({ layoutType, label }: { layoutType: LayoutType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: layoutType,     // layoutType string is unique; no collision with UUID-based row IDs
    data: {
      type: DRAG_TYPES.LAYOUT_CARD,   // CC-5: DRAG_TYPES enum, never string literal 'LAYOUT_CARD'
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
        // isDragging: source card fades to opacity-40 — DragOverlay ghost takes over as visual
      )}
    >
      {label}
    </div>
  );
}

// ─── BuilderPalette ───────────────────────────────────────────────────────────

export function BuilderPalette() {
  return (
    <div className="flex-[2] min-w-0 border-l bg-background overflow-y-auto">
      <Tabs defaultValue="layouts" className="h-full flex flex-col">
        <TabsList className="w-full shrink-0 rounded-none border-b">
          <TabsTrigger value="layouts" className="flex-1">Layouts</TabsTrigger>
          <TabsTrigger value="elements" className="flex-1">Elements</TabsTrigger>
        </TabsList>
        <TabsContent value="layouts" className="p-4 space-y-2">
          {Object.entries(LAYOUT_NAMES).map(([type, label]) => (
            <DraggableLayoutCard
              key={type}
              layoutType={type as LayoutType}
              label={label}
            />
          ))}
        </TabsContent>
        <TabsContent value="elements" className="p-4" forceMount>
          <p className="text-sm text-muted-foreground">
            Elements will be available in a future phase.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
