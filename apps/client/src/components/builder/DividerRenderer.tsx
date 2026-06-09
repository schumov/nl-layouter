// apps/client/src/components/builder/DividerRenderer.tsx
//
// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.
// CC-2/CC-6: ALL color and dimension values are inline styles only.
// D-08: exact render structure required for correct test assertions.

import React from 'react';
import type { DividerElement } from '../../types/newsletter';

interface DividerRendererProps {
  element: DividerElement;
}

export function DividerRenderer({ element }: DividerRendererProps) {
  return (
    <div style={{ padding: `${element.spacing}px 0` }}>
      <hr
        style={{
          border: 'none',
          borderTop: `${element.thickness}px solid ${element.color}`,
          margin: 0,
        }}
      />
    </div>
  );
}
