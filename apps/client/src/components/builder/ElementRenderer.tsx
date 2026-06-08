import React from 'react';
import type { ElementUnion } from '../../types/newsletter';

interface ElementRendererProps {
  element: ElementUnion;
}

// STUB: Phase 3 renders element type name only.
// Phases 5-7 replace this with real element renderers.
export function ElementRenderer({ element }: ElementRendererProps) {
  return (
    <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">
      [{element.type}]
    </div>
  );
}
