import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DividerEditor } from '../DividerEditor';
import type { DividerElement } from '../../../types/newsletter';

const MOCK_DIVIDER: DividerElement = {
  type: 'divider', id: 'div-1', color: '#cccccc', spacing: 16, thickness: 1,
};

describe('DividerEditor (ELEM-09)', () => {
  it('color picker dispatches onUpdate with { color }', () => {
    const onUpdate = vi.fn();
    render(<DividerEditor element={MOCK_DIVIDER} onUpdate={onUpdate} />);
    const colorInputs = screen.getAllByDisplayValue('#cccccc');
    const swatch = colorInputs.find(
      (el) => (el as HTMLInputElement).type === 'color',
    ) as HTMLInputElement;
    fireEvent.change(swatch, { target: { value: '#ff0000' } });
    expect(onUpdate).toHaveBeenCalledWith({ color: '#ff0000' });
  });

  it('hex text input dispatches onUpdate with { color } for valid 7-char hex', () => {
    const onUpdate = vi.fn();
    render(<DividerEditor element={MOCK_DIVIDER} onUpdate={onUpdate} />);
    const colorInputs = screen.getAllByDisplayValue('#cccccc');
    const hexText = colorInputs.find(
      (el) => (el as HTMLInputElement).type === 'text',
    ) as HTMLInputElement;
    fireEvent.change(hexText, { target: { value: '#abcdef' } });
    expect(onUpdate).toHaveBeenCalledWith({ color: '#abcdef' });
  });

  it('thickness range slider dispatches onUpdate with { thickness } as a number', () => {
    const onUpdate = vi.fn();
    render(<DividerEditor element={MOCK_DIVIDER} onUpdate={onUpdate} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '4' } });
    expect(onUpdate).toHaveBeenCalledWith({ thickness: 4 });
  });

  it('spacing number input dispatches onUpdate with { spacing } as a number', () => {
    const onUpdate = vi.fn();
    render(<DividerEditor element={MOCK_DIVIDER} onUpdate={onUpdate} />);
    const spacingInput = screen.getByDisplayValue('16');
    fireEvent.change(spacingInput, { target: { value: '32' } });
    expect(onUpdate).toHaveBeenCalledWith({ spacing: 32 });
  });

  it('renders section label text for Color, Thickness, and Spacing', () => {
    render(<DividerEditor element={MOCK_DIVIDER} onUpdate={vi.fn()} />);
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Thickness')).toBeInTheDocument();
    expect(screen.getByText('Spacing')).toBeInTheDocument();
  });
});
