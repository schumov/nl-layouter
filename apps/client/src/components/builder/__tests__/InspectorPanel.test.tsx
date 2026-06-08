// InspectorPanel component tests — D-04/D-05
// RED until Plan 05-05 implements the real InspectorPanel component.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InspectorPanel } from '../InspectorPanel';

describe('InspectorPanel (Phase 5 placeholder)', () => {
  it('D-05: renders element type display name as panel header — "Image"', () => {
    // RED: stub renders "stub", not the element type name
    render(<InspectorPanel elementType="image" onBack={() => {}} />);
    expect(screen.getByText('Image')).toBeInTheDocument();
  });

  it('D-05: renders element type display name — "Rich Text"', () => {
    // RED: stub renders "stub", not the element type name
    render(<InspectorPanel elementType="rich-text" onBack={() => {}} />);
    expect(screen.getByText('Rich Text')).toBeInTheDocument();
  });

  it('D-05: renders muted placeholder note text', () => {
    // RED: stub does not render the note
    render(<InspectorPanel elementType="button" onBack={() => {}} />);
    expect(screen.getByText('Editing available in the next step.')).toBeInTheDocument();
  });

  it('D-04: renders back arrow button with aria-label "Back to palette"', () => {
    // RED: stub has no button
    render(<InspectorPanel elementType="divider" onBack={() => {}} />);
    expect(screen.getByRole('button', { name: 'Back to palette' })).toBeInTheDocument();
  });

  it('D-04: clicking back arrow calls onBack callback', () => {
    // RED: stub has no button, so nothing to click
    const onBack = vi.fn();
    render(<InspectorPanel elementType="image-link" onBack={onBack} />);
    const btn = screen.getByRole('button', { name: 'Back to palette' });
    fireEvent.click(btn);
    expect(onBack).toHaveBeenCalledOnce();
  });
});
