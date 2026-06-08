// BuilderCanvas component tests — CANVAS-01
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BuilderCanvas } from '../BuilderCanvas';
import { FIXTURE_DOC } from '../../../fixtures/newsletter.fixture';

describe('BuilderCanvas', () => {
  it('CANVAS-01: renders outer panel with flex-[3] class', () => {
    const { container } = render(<BuilderCanvas doc={FIXTURE_DOC} />);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass('flex-[3]');
  });

  it('CANVAS-01: renders one RowBlock per fixture section (5 total)', () => {
    const { container } = render(<BuilderCanvas doc={FIXTURE_DOC} />);
    // Each RowBlock contains at least one [data-testid="column-wrapper"]
    const columnWrappers = container.querySelectorAll('[data-testid="column-wrapper"]');
    // FIXTURE_DOC has 5 rows: 1+2+3+2+2 = 10 column wrappers total
    expect(columnWrappers.length).toBe(10);
  });

  it('shows empty state when doc is null', () => {
    const { getByText } = render(<BuilderCanvas doc={null} />);
    getByText('No sections yet. Drag a layout from the palette to begin.');
  });
});
