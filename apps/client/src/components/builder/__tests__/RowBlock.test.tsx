// RowBlock component tests
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RowBlock } from '../RowBlock';

function makeSection(overrides: Partial<{ backgroundColor: string }> = {}) {
  return {
    id: 'test-row',
    layoutType: '1col' as const,
    slots: [{ id: 'test-slot', element: null }],
    ...overrides,
  };
}

describe('RowBlock', () => {
  it('renders a white card with border and shadow', () => {
    const { container } = render(<RowBlock section={makeSection()} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('shadow-sm');
  });

  it('applies section.backgroundColor via inline style', () => {
    const { container } = render(
      <RowBlock section={makeSection({ backgroundColor: '#ff0000' })} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});
