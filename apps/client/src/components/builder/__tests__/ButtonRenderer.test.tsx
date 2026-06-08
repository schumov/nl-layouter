import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ButtonRenderer } from '../ButtonRenderer';
import type { ButtonElement } from '../../../types/newsletter';

function makeButtonElement(overrides: Partial<ButtonElement> = {}): ButtonElement {
  return {
    type: 'button', id: 'e1', label: 'Click me', href: '',
    backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid',
    ...overrides,
  };
}

describe('ButtonRenderer', () => {
  it('ELEM-04: renders the button label text', () => {
    render(<ButtonRenderer element={makeButtonElement()} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('ELEM-04: renders as an <a> tag', () => {
    const { container } = render(<ButtonRenderer element={makeButtonElement()} />);
    expect(container.querySelector('a')).not.toBeNull();
  });

  it('ELEM-04: href falls back to "#" when href is empty', () => {
    const { container } = render(<ButtonRenderer element={makeButtonElement({ href: '' })} />);
    expect(container.querySelector('a')).toHaveAttribute('href', '#');
  });

  it('ELEM-04: <a> has configured href when non-empty', () => {
    const { container } = render(<ButtonRenderer element={makeButtonElement({ href: 'https://buy.example.com' })} />);
    expect(container.querySelector('a')).toHaveAttribute('href', 'https://buy.example.com');
  });
});

describe('ButtonRenderer — solid variant (ELEM-05)', () => {
  it('ELEM-05: solid variant has backgroundColor as inline style', () => {
    const { container } = render(<ButtonRenderer element={makeButtonElement({ style: 'solid' })} />);
    const anchor = container.querySelector('a');
    expect(anchor).toHaveStyle({ backgroundColor: '#0066cc' });
  });

  it('ELEM-05: solid variant has textColor as inline style', () => {
    const { container } = render(<ButtonRenderer element={makeButtonElement({ style: 'solid' })} />);
    const anchor = container.querySelector('a');
    expect(anchor).toHaveStyle({ color: '#ffffff' });
  });
});

describe('ButtonRenderer — outline variant (ELEM-05)', () => {
  it('ELEM-05: outline variant has transparent background', () => {
    const { container } = render(<ButtonRenderer element={makeButtonElement({ style: 'outline' })} />);
    const anchor = container.querySelector('a');
    expect(anchor).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('ELEM-05: outline variant has border derived from backgroundColor', () => {
    const { container } = render(<ButtonRenderer element={makeButtonElement({ style: 'outline' })} />);
    const anchor = container.querySelector('a');
    expect(anchor).toHaveStyle({ border: '2px solid #0066cc' });
  });
});

describe('ButtonRenderer — ghost fallthrough (D-05)', () => {
  it('D-05: ghost style falls through to solid (has backgroundColor, not transparent)', () => {
    const { container } = render(<ButtonRenderer element={makeButtonElement({ style: 'ghost' })} />);
    const anchor = container.querySelector('a');
    expect(anchor).toHaveStyle({ backgroundColor: '#0066cc' });
  });
});
