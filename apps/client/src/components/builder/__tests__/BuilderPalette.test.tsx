// BuilderPalette component tests — CANVAS-01
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BuilderPalette } from '../BuilderPalette';

describe('BuilderPalette', () => {
  it('renders Layouts tab and Elements tab', () => {
    const { getByText } = render(<BuilderPalette />);
    getByText('Layouts');
    getByText('Elements');
  });

  it('renders all 5 layout cards in Layouts tab', () => {
    const { getByText } = render(<BuilderPalette />);
    getByText('1 Column');
    getByText('2 Columns');
    getByText('3 Columns');
    getByText('Small-Left / Big-Right');
    getByText('Big-Left / Small-Right');
  });

  it('renders Elements stub text in Elements tab', () => {
    const { getByText } = render(<BuilderPalette />);
    getByText('Elements will be available in a future phase.', { hidden: true });
  });
});
