// SortableRowList component tests — CANVAS-02, CANVAS-03
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableRowList } from '../SortableRowList';
import { FIXTURE_DOC } from '../../../fixtures/newsletter.fixture';

function renderWithDnd(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('SortableRowList', () => {
  it('CANVAS-02: renders empty drop zone when rows is empty', () => {
    renderWithDnd(<SortableRowList rows={[]} />);
    expect(screen.getByText('Drop a layout here')).toBeInTheDocument();
  });

  it('CANVAS-02: empty drop zone has aria-label for accessibility', () => {
    renderWithDnd(<SortableRowList rows={[]} />);
    expect(
      screen.getByRole('generic', { name: 'Canvas drop zone. Drop a layout here.' }),
    ).toBeInTheDocument();
  });

  it('CANVAS-03: renders one row per section when rows is non-empty', () => {
    renderWithDnd(<SortableRowList rows={FIXTURE_DOC.rows} />);
    // Each RowBlock contains column wrappers — FIXTURE_DOC has 5 rows
    const columnWrappers = document.querySelectorAll('[data-testid="column-wrapper"]');
    // 1col(1) + 2col(2) + 3col(3) + slbr(2) + blsr(2) = 10 column wrappers total
    expect(columnWrappers.length).toBe(10);
  });

  it('does not render empty drop zone when rows is non-empty', () => {
    renderWithDnd(<SortableRowList rows={FIXTURE_DOC.rows} />);
    expect(screen.queryByText('Drop a layout here')).not.toBeInTheDocument();
  });
});
