import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DividerRenderer } from '../DividerRenderer';
import type { DividerElement } from '../../../types/newsletter';

function makeDivider(overrides: Partial<DividerElement> = {}): DividerElement {
  return { type: 'divider', id: 'div-1', color: '#cccccc', spacing: 16, thickness: 1, ...overrides };
}

describe('DividerRenderer (ELEM-09)', () => {
  it('renders an <hr> element', () => {
    const { container } = render(<DividerRenderer element={makeDivider()} />);
    expect(container.querySelector('hr')).not.toBeNull();
  });

  it('applies border-top color from element.color', () => {
    const { container } = render(<DividerRenderer element={makeDivider({ color: '#ff0000' })} />);
    const hr = container.querySelector('hr') as HTMLElement;
    expect(hr).toHaveStyle({ borderTopColor: '#ff0000' });
  });

  it('applies border-top thickness from element.thickness', () => {
    const { container } = render(<DividerRenderer element={makeDivider({ thickness: 3 })} />);
    const hr = container.querySelector('hr') as HTMLElement;
    expect(hr.style.borderTop).toContain('3px');
  });

  it('applies vertical padding from element.spacing', () => {
    const { container } = render(<DividerRenderer element={makeDivider({ spacing: 24 })} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.padding).toContain('24px');
  });

  it('renders without errors using default props', () => {
    expect(() => render(<DividerRenderer element={makeDivider()} />)).not.toThrow();
  });
});
