// apps/client/src/components/builder/__tests__/RichTextEditor.test.tsx
//
// TipTap is mocked — preset picker behavior is tested without a real ProseMirror instance.
// BubbleMenu and EditorContent are no-ops in this test environment.

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RichTextEditor } from '../RichTextEditor';
import type { RichTextElement } from '../../../types/newsletter';

// Mock TipTap — useEditor returns null (loading state); EditorContent is a no-op.
// This prevents jsdom from requiring a full ProseMirror DOM environment.
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid="editor-content" />,
}));
vi.mock('@tiptap/react/menus', () => ({
  BubbleMenu: () => null,
}));

const MOCK_RICHTEXT: RichTextElement = {
  type: 'rich-text',
  id: 'rt-1',
  content: { type: 'doc', content: [{ type: 'paragraph' }] },
  textStyle: 'body',
};

describe('RichTextEditor — preset picker (ELEM-07)', () => {
  it('renders all 4 preset buttons with correct labels', () => {
    render(<RichTextEditor element={MOCK_RICHTEXT} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Header' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subheader' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Body Text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Code' })).toBeInTheDocument();
  });

  it('clicking "Header" dispatches onUpdate({ textStyle: "header" })', () => {
    const onUpdate = vi.fn();
    render(<RichTextEditor element={MOCK_RICHTEXT} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Header' }));
    expect(onUpdate).toHaveBeenCalledWith({ textStyle: 'header' });
  });

  it('clicking "Body Text" dispatches onUpdate({ textStyle: "body" })', () => {
    const onUpdate = vi.fn();
    render(<RichTextEditor element={MOCK_RICHTEXT} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Body Text' }));
    expect(onUpdate).toHaveBeenCalledWith({ textStyle: 'body' });
  });

  it('active preset button (matching element.textStyle) has aria-pressed="true"', () => {
    render(<RichTextEditor element={MOCK_RICHTEXT} onUpdate={vi.fn()} />);
    // MOCK_RICHTEXT has textStyle: 'body' — "Body Text" should be active
    const bodyBtn = screen.getByRole('button', { name: 'Body Text' });
    expect(bodyBtn).toHaveAttribute('aria-pressed', 'true');
    // All other preset buttons should be inactive
    const headerBtn = screen.getByRole('button', { name: 'Header' });
    expect(headerBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
