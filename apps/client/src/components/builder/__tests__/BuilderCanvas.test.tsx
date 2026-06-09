// BuilderCanvas component tests — CANVAS-01
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BuilderCanvas } from '../BuilderCanvas';
import { FIXTURE_DOC } from '../../../fixtures/newsletter.fixture';

function renderWithDnd(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DndContext>{ui}</DndContext>
    </QueryClientProvider>
  );
}

describe('BuilderCanvas', () => {
  it('CANVAS-01: renders outer panel with flex-[3] class', () => {
    const { container } = renderWithDnd(<BuilderCanvas doc={FIXTURE_DOC} headerPresetId="" footerPresetId="" />);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass('flex-[3]');
  });

  it('CANVAS-01: renders one RowBlock per fixture section (5 total)', () => {
    const { container } = renderWithDnd(<BuilderCanvas doc={FIXTURE_DOC} headerPresetId="" footerPresetId="" />);
    // Each RowBlock contains at least one [data-testid="column-wrapper"]
    const columnWrappers = container.querySelectorAll('[data-testid="column-wrapper"]');
    // FIXTURE_DOC has 5 rows: 1+2+3+2+2 = 10 column wrappers total
    expect(columnWrappers.length).toBe(10);
  });

  it('shows empty state when doc is null', () => {
    const { getByText } = renderWithDnd(<BuilderCanvas doc={null} headerPresetId="" footerPresetId="" />);
    getByText('No sections yet. Drag a layout from the palette to begin.');
  });
});
