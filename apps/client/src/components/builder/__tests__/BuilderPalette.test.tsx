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

  it('renders all 5 element type cards in Elements tab', () => {
    const { getByText } = renderWithDnd(<BuilderPalette />);
    // UI-SPEC D-08 locked label strings — must match exactly
    // { hidden: true } needed because Elements tab is force-mounted but inactive (aria-hidden) by default
    getByText('Image', { hidden: true });
    getByText('Image with Link', { hidden: true });
    getByText('Button', { hidden: true });
    getByText('Rich Text', { hidden: true });
    getByText('Divider', { hidden: true });
  });
});
