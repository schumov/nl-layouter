import React from 'react';
import type { LayoutType, Section } from '../../types/newsletter';
import { ColumnSlot } from './ColumnSlot';

// ⚠️ TAILWIND V4 RULE: All class names MUST be complete string literals.
// NEVER build via template literals (e.g. `basis-${fraction}`) — JIT scanner won't find them.
const COLUMN_CLASSES: Record<LayoutType, readonly string[]> = {
  '1col':                 ['basis-full'],
  '2col':                 ['basis-1/2',  'basis-1/2'],
  '3col':                 ['basis-1/3',  'basis-1/3', 'basis-1/3'],
  'small-left-big-right': ['basis-1/3',  'basis-2/3'],
  'big-left-small-right': ['basis-2/3',  'basis-1/3'],
} as const;

interface ColumnGridProps {
  section: Section;
}

export function ColumnGrid({ section }: ColumnGridProps) {
  const basisClasses = COLUMN_CLASSES[section.layoutType];

  return (
    <div className="flex gap-2 p-2">
      {section.slots.map((slot, i) => (
        <div
          key={slot.id}
          data-testid="column-wrapper"
          className={`min-w-0 ${basisClasses[i] ?? 'basis-full'}`}
        >
          <ColumnSlot slot={slot} sectionId={section.id} />
        </div>
      ))}
    </div>
  );
}
