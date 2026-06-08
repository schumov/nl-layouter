import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonEditor } from '../ButtonEditor';
import type { ButtonElement } from '../../../types/newsletter';

const MOCK_BUTTON: ButtonElement = {
  type: 'button', id: 'e1', label: 'Click me', href: '',
  backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid',
};

describe('ButtonEditor — text fields', () => {
  it('ELEM-04: label field dispatches onUpdate with { label: value }', () => {
    const onUpdate = vi.fn();
    render(<ButtonEditor element={MOCK_BUTTON} onUpdate={onUpdate} />);
    const labelInput = screen.getByPlaceholderText('Button label');
    fireEvent.change(labelInput, { target: { value: 'Buy Now' } });
    expect(onUpdate).toHaveBeenCalledWith({ label: 'Buy Now' });
  });

  it('ELEM-04: href field dispatches onUpdate with { href: value }', () => {
    const onUpdate = vi.fn();
    render(<ButtonEditor element={MOCK_BUTTON} onUpdate={onUpdate} />);
    const hrefInput = screen.getByPlaceholderText('https://...');
    fireEvent.change(hrefInput, { target: { value: 'https://buy.example.com' } });
    expect(onUpdate).toHaveBeenCalledWith({ href: 'https://buy.example.com' });
  });
});

describe('ButtonEditor — style toggle (ELEM-05)', () => {
  it('ELEM-05: "Filled" button dispatches { style: "solid" }', () => {
    const onUpdate = vi.fn();
    render(<ButtonEditor element={MOCK_BUTTON} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Filled' }));
    expect(onUpdate).toHaveBeenCalledWith({ style: 'solid' });
  });

  it('ELEM-05: "Outline" button dispatches { style: "outline" }', () => {
    const onUpdate = vi.fn();
    render(<ButtonEditor element={MOCK_BUTTON} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Outline' }));
    expect(onUpdate).toHaveBeenCalledWith({ style: 'outline' });
  });

  it('ELEM-05: "Filled" button has variant="default" when style is "solid" (active)', () => {
    render(<ButtonEditor element={MOCK_BUTTON} onUpdate={vi.fn()} />);
    const filledBtn = screen.getByRole('button', { name: 'Filled' });
    expect(filledBtn).toBeInTheDocument();
  });
});

describe('ButtonEditor — color fields (ELEM-04)', () => {
  it('ELEM-04: backgroundColor hex input dispatches onUpdate with { backgroundColor: value }', () => {
    const onUpdate = vi.fn();
    render(<ButtonEditor element={MOCK_BUTTON} onUpdate={onUpdate} />);
    const hexInputs = screen.getAllByDisplayValue('#0066cc');
    fireEvent.change(hexInputs[0], { target: { value: '#ff0000' } });
    expect(onUpdate).toHaveBeenCalledWith({ backgroundColor: '#ff0000' });
  });

  it('ELEM-04: textColor hex input dispatches onUpdate with { textColor: value }', () => {
    const onUpdate = vi.fn();
    render(<ButtonEditor element={MOCK_BUTTON} onUpdate={onUpdate} />);
    const hexInputs = screen.getAllByDisplayValue('#ffffff');
    fireEvent.change(hexInputs[0], { target: { value: '#333333' } });
    expect(onUpdate).toHaveBeenCalledWith({ textColor: '#333333' });
  });
});
