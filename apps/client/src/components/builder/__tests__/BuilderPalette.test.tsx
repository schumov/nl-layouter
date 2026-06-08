// BuilderPalette component tests — CANVAS-01
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { BuilderPalette } from '../BuilderPalette';

function renderWithDnd(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('BuilderPalette', () => {
  it('renders Layouts tab and Elements tab', () => {
    const { getByText } = renderWithDnd(<BuilderPalette />);
    getByText('Layouts');
    getByText('Elements');
  });

  it('renders all 5 layout cards in Layouts tab', () => {
    const { getByText } = renderWithDnd(<BuilderPalette />);
    getByText('1 Column');
    getByText('2 Columns');
    getByText('3 Columns');
    getByText('Small-Left / Big-Right');
    getByText('Big-Left / Small-Right');
  });

  it('renders Elements stub text in Elements tab', () => {
    const { getByText } = renderWithDnd(<BuilderPalette />);
    getByText('Elements will be available in a future phase.', { hidden: true });
  });
});
