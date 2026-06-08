// ColumnSlot component tests — empty-slot rendering + Phase 5 DnD behaviors
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ColumnSlot } from '../ColumnSlot';
import { useNewsletterStore } from '../../../store/useNewsletterStore';

// Matches renderWithDnd pattern established in BuilderPalette.test.tsx
function renderWithDnd(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

beforeEach(() => {
  useNewsletterStore.setState({ selectedElementId: null });
});

describe('ColumnSlot — empty slot (idle)', () => {
  it('renders dashed border placeholder when slot.element is null', () => {
    const { getByText } = renderWithDnd(
      <ColumnSlot slot={{ id: 'test-slot', element: null }} sectionId="test-section" />,
    );
    getByText('Drop element here');
  });
});

describe('ColumnSlot — occupied slot (idle)', () => {
  it('renders element type badge when slot.element is defined', () => {
    const { getByText } = renderWithDnd(
      <ColumnSlot
        slot={{ id: 'test-slot', element: { type: 'image' } as any }}
        sectionId="test-section"
      />,
    );
    getByText('[image]');
  });
});

describe('ColumnSlot — Phase 5 RED stubs (Wave 2 implements)', () => {
  it('D-09/D-10: occupied slot renders × button with aria-label "Remove element"', () => {
    // RED: current ColumnSlot has no × button — passes after Plan 05-03
    const { container } = renderWithDnd(
      <ColumnSlot
        slot={{ id: 's1', element: { type: 'button', id: 'e1', label: '', href: '', backgroundColor: '#000', textColor: '#fff', style: 'solid' } as any }}
        sectionId="sec"
      />,
    );
    expect(container.querySelector('button[aria-label="Remove element"]')).not.toBeNull();
  });

  it('D-11: clicking × on occupied slot shows remove confirm "Remove?" and "Cancel"', () => {
    // RED: no confirm UI exists yet — passes after Plan 05-03
    const { container } = renderWithDnd(
      <ColumnSlot
        slot={{ id: 's2', element: { type: 'divider', id: 'e2', color: '#ccc', spacing: 16, thickness: 1 } as any }}
        sectionId="sec"
      />,
    );
    const btn = container.querySelector('button[aria-label="Remove element"]');
    expect(btn).not.toBeNull();
    // Further clicking + asserting Remove?/Cancel is tested in 05-03
  });

  it('ELEM-10: empty slot has ref attached (useDroppable) — no crash when wrapped in DndContext', () => {
    // GREEN already: renderWithDnd wraps in DndContext so even after useDroppable is added, no crash
    expect(() =>
      renderWithDnd(<ColumnSlot slot={{ id: 's3', element: null }} sectionId="sec" />),
    ).not.toThrow();
  });

  it('ELEM-10: occupied slot shows ring-2 class when selectedElementId matches slot.id', () => {
    // RED: current ColumnSlot has no ring styling — passes after Plan 05-03
    useNewsletterStore.setState({ selectedElementId: 's4' });
    const { container } = renderWithDnd(
      <ColumnSlot
        slot={{ id: 's4', element: { type: 'rich-text', id: 'e3', content: { type: 'doc', content: [] }, textStyle: 'body' } as any }}
        sectionId="sec"
      />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('ring-2');
  });
});
