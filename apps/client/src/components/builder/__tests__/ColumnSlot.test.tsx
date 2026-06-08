// ColumnSlot component tests — empty-slot rendering
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ColumnSlot } from '../ColumnSlot';

describe('ColumnSlot', () => {
  it('renders dashed border placeholder when slot.element is null', () => {
    const { getByText } = render(
      <ColumnSlot slot={{ id: 'test-slot', element: null }} sectionId="test-section" />
    );
    getByText('Drop element here');
  });

  it('renders element type badge when slot.element is defined', () => {
    const { getByText } = render(
      <ColumnSlot
        slot={{ id: 'test-slot', element: { type: 'image' } as any }}
        sectionId="test-section"
      />
    );
    getByText('[image]');
  });
});
