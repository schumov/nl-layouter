// InspectorPanel component tests — Phase 6 upgrade (D-08)
// Tests are RED until Plan 06-06 implements the Phase 6 InspectorPanel (element prop + body routing).
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InspectorPanel } from '../InspectorPanel';
import type {
  ImageElement, ImageLinkElement, ButtonElement,
  RichTextElement, DividerElement,
} from '../../../types/newsletter';

// Mock element fixtures — cover all 5 element types
const MOCK_IMAGE: ImageElement = { type: 'image', id: 'e1', src: '', alt: '', width: '100%' };
const MOCK_RICHTEXT: RichTextElement = { type: 'rich-text', id: 'e2', content: { type: 'doc', content: [] }, textStyle: 'body' };
const MOCK_BUTTON: ButtonElement = { type: 'button', id: 'e3', label: 'Click me', href: '', backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid' };
const MOCK_DIVIDER: DividerElement = { type: 'divider', id: 'e4', color: '#cccccc', spacing: 16, thickness: 1 };
const MOCK_IMGLINK: ImageLinkElement = { type: 'image-link', id: 'e5', src: '', alt: '', href: '', width: '100%' };

describe('InspectorPanel (Phase 6)', () => {
  it('D-08: renders element type display name "Image" from element.type', () => {
    // RED until Plan 06-06: component still reads elementType prop (undefined), not element.type
    render(<InspectorPanel element={MOCK_IMAGE} onBack={() => {}} onUpdate={vi.fn()} />);
    expect(screen.getByText('Image')).toBeInTheDocument();
  });

  it('D-08: renders element type display name "Rich Text" from element.type', () => {
    // RED until Plan 06-06
    render(<InspectorPanel element={MOCK_RICHTEXT} onBack={() => {}} onUpdate={vi.fn()} />);
    expect(screen.getByText('Rich Text')).toBeInTheDocument();
  });

  it('D-08: rich-text element shows Phase 7 note in body', () => {
    // RED until Plan 06-06: component still shows "Editing available in the next step."
    render(<InspectorPanel element={MOCK_RICHTEXT} onBack={() => {}} onUpdate={vi.fn()} />);
    expect(screen.getByText('Editor available in Phase 7.')).toBeInTheDocument();
  });

  it('D-08: renders back arrow button with aria-label "Back to palette"', () => {
    // Passes even before Plan 06-06 (button still renders regardless of prop rename)
    render(<InspectorPanel element={MOCK_DIVIDER} onBack={() => {}} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Back to palette' })).toBeInTheDocument();
  });

  it('D-04: clicking back arrow calls onBack callback', () => {
    // Passes even before Plan 06-06 (onBack still wired regardless of prop rename)
    const onBack = vi.fn();
    render(<InspectorPanel element={MOCK_IMGLINK} onBack={onBack} onUpdate={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Back to palette' });
    fireEvent.click(btn);
    expect(onBack).toHaveBeenCalledOnce();
  });
});
