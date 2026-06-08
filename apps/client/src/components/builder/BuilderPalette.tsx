import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Image,
  ImagePlus,
  MousePointerClick,
  AlignLeft,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DRAG_TYPES } from '@/dnd/types';
import type { LayoutType, ElementUnion } from '@/types/newsletter';
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

// Display labels for the 5 element types
// Exported so DragDropProvider can use for ghost overlay label text
export const ELEMENT_NAMES: Record<ElementUnion['type'], string> = {
  'image':      'Image',
  'image-link': 'Image with Link',
  'button':     'Button',
  'rich-text':  'Rich Text',
  'divider':    'Divider',
};

// Icon components for the 5 element types (D-08 locked decisions)
// Exported so DragDropProvider can render the icon in the DragOverlay ghost
export const ELEMENT_CARD_ICONS: Record<ElementUnion['type'], LucideIcon> = {
  'image':      Image,
  'image-link': ImagePlus,
  'button':     MousePointerClick,
  'rich-text':  AlignLeft,
  'divider':    Minus,
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

// ─── DraggableElementCard ─────────────────────────────────────────────────────
// Local sub-component — NOT exported. One instance per element type in the palette.
// Mirrors DraggableLayoutCard pattern. D-07/D-08: icon left + label right.

function DraggableElementCard({
  elementType,
  label,
}: {
  elementType: ElementUnion['type'];
  label: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: elementType,   // unique string — no collision with layout card IDs or UUID slot IDs
    data: {
      type: DRAG_TYPES.ELEMENT_CARD,  // CC-5: always use enum constant, never string literal
      elementType,
    },
  });

  const Icon = ELEMENT_CARD_ICONS[elementType];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'p-3 border rounded-md text-sm select-none',
        'flex items-center gap-2',
        'cursor-grab hover:bg-accent hover:text-accent-foreground transition-colors duration-100',
        isDragging && 'opacity-40 cursor-grabbing',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
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
        <TabsContent value="elements" className="p-4 space-y-2" forceMount>
          {Object.entries(ELEMENT_NAMES).map(([type, label]) => (
            <DraggableElementCard
              key={type}
              elementType={type as ElementUnion['type']}
              label={label}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
