// DragDropProvider component tests
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DragDropProvider } from '../DragDropProvider';

describe('DragDropProvider', () => {
  it('renders children without crashing', () => {
    render(
      <DragDropProvider>
        <div data-testid="child">hello</div>
      </DragDropProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('DragDropProvider — ELEMENT_CARD drop (Phase 5 RED stubs)', () => {
  it('ELEM-10: ELEMENT_CARD drag-end on a slot triggers addElement in store', () => {
    // RED: DragDropProvider.onDragEnd has no ELEMENT_CARD branch yet
    // Full simulation requires fireEvent.pointer + dnd-kit mock; this stub
    // just confirms the describe block is registered as a failing placeholder.
    // Plan 05-04 will replace this with a real test using DndContext simulation.
    expect(false).toBe(true); // RED — explicit failing stub
  });
});
