import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RichTextStaticRenderer } from '../RichTextStaticRenderer';
import type { RichTextElement } from '../../../types/newsletter';

function makeRichText(overrides: Partial<RichTextElement> = {}): RichTextElement {
  return {
    type: 'rich-text',
    id: 'rt-1',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
    },
    textStyle: 'body',
    ...overrides,
  };
}

describe('RichTextStaticRenderer (ELEM-06, ELEM-07, ELEM-08)', () => {
  it('renders text content from TipTap JSON doc', () => {
    const { container } = render(<RichTextStaticRenderer element={makeRichText()} />);
    expect(container.textContent).toContain('Hello world');
  });

  it('applies header preset wrapper style: fontSize 28px, fontWeight 700', () => {
    const { container } = render(
      <RichTextStaticRenderer element={makeRichText({ textStyle: 'header' })} />,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.fontSize).toBe('28px');
    expect(div.style.fontWeight).toBe('700');
  });

  it('applies body preset wrapper style: fontSize 16px', () => {
    const { container } = render(
      <RichTextStaticRenderer element={makeRichText({ textStyle: 'body' })} />,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.fontSize).toBe('16px');
  });

  it('renders paragraph HTML via dangerouslySetInnerHTML', () => {
    const { container } = render(
      <RichTextStaticRenderer
        element={makeRichText({
          content: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test' }] }],
          },
        })}
      />,
    );
    expect(container.innerHTML).toMatch(/<p[^>]*>.*Test.*<\/p>/);
  });
});
