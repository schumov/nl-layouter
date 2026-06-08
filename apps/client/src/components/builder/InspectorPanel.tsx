// PHASE 5 STUB — replaced by full implementation in Plan 05-05
// Minimal placeholder so test imports resolve without module-not-found error.

import React from 'react';
import type { ElementUnion } from '../../types/newsletter';

interface InspectorPanelProps {
  elementType: ElementUnion['type'];
  onBack: () => void;
}

export function InspectorPanel({ elementType, onBack }: InspectorPanelProps) {
  void elementType;
  void onBack;
  return <div data-testid="inspector-panel-stub">stub</div>;
}
