import React from 'react';
import type { Section } from '../../types/newsletter';
import { ColumnGrid } from './ColumnGrid';

interface RowBlockProps {
  section: Section;
}

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
