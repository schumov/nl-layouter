// DragDropProvider component tests
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DragDropProvider } from '../DragDropProvider';
import { useNewsletterStore } from '../../../store/useNewsletterStore';

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

describe('DragDropProvider — ELEMENT_CARD drop (Phase 5)', () => {
  it('ELEM-10: renders children and ELEMENT_CARD addElement is callable via store', () => {
    // Verify the provider mounts without error when store has addElement
    // (full drag simulation requires e2e / manual test — see VALIDATION.md manual-only section)
    const { getByTestId } = render(
      <DragDropProvider>
        <div data-testid="slot-child">content</div>
      </DragDropProvider>,
    );
    expect(getByTestId('slot-child')).toBeInTheDocument();

    // Verify addElement action is available in store (Plan 05-01 green state)
    const { addElement } = useNewsletterStore.getState() as any;
    expect(typeof addElement).toBe('function');
  });
});
