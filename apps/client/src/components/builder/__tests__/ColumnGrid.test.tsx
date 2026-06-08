// ColumnGrid component tests — LAYOUT-01 through LAYOUT-05
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ColumnGrid } from '../ColumnGrid';
import type { Section } from '../../../types/newsletter';

function makeSection(layoutType: Section['layoutType'], slotCount: number): Section {
  return {
    id: 'test-section',
    layoutType,
    slots: Array.from({ length: slotCount }, (_, i) => ({
      id: `slot-${i}`,
      element: null,
    })),
  };
}

describe('ColumnGrid', () => {
  it('LAYOUT-01: renders 1 column for 1col with basis-full', () => {
    const { container } = render(<ColumnGrid section={makeSection('1col', 1)} />);
    const cols = container.querySelectorAll('[data-testid="column-wrapper"]');
    expect(cols).toHaveLength(1);
    expect(cols[0]).toHaveClass('basis-full');
  });

  it('LAYOUT-02: renders 2 equal columns for 2col with basis-1/2', () => {
    const { container } = render(<ColumnGrid section={makeSection('2col', 2)} />);
    const cols = container.querySelectorAll('[data-testid="column-wrapper"]');
    expect(cols).toHaveLength(2);
    expect(cols[0]).toHaveClass('basis-1/2');
    expect(cols[1]).toHaveClass('basis-1/2');
  });

  it('LAYOUT-03: renders 3 equal columns for 3col with basis-1/3', () => {
    const { container } = render(<ColumnGrid section={makeSection('3col', 3)} />);
    const cols = container.querySelectorAll('[data-testid="column-wrapper"]');
    expect(cols).toHaveLength(3);
    expect(cols[0]).toHaveClass('basis-1/3');
    expect(cols[1]).toHaveClass('basis-1/3');
    expect(cols[2]).toHaveClass('basis-1/3');
  });

  it('LAYOUT-04: renders 1/3 + 2/3 columns for small-left-big-right', () => {
    const { container } = render(
      <ColumnGrid section={makeSection('small-left-big-right', 2)} />
    );
    const cols = container.querySelectorAll('[data-testid="column-wrapper"]');
    expect(cols).toHaveLength(2);
    expect(cols[0]).toHaveClass('basis-1/3');
    expect(cols[1]).toHaveClass('basis-2/3');
  });

  it('LAYOUT-05: renders 2/3 + 1/3 columns for big-left-small-right', () => {
    const { container } = render(
      <ColumnGrid section={makeSection('big-left-small-right', 2)} />
    );
    const cols = container.querySelectorAll('[data-testid="column-wrapper"]');
    expect(cols).toHaveLength(2);
    expect(cols[0]).toHaveClass('basis-2/3');
    expect(cols[1]).toHaveClass('basis-1/3');
  });
});
