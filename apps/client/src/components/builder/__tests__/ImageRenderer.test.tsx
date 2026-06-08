import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageRenderer } from '../ImageRenderer';
import type { ImageElement } from '../../../types/newsletter';

function makeImageElement(overrides: Partial<ImageElement> = {}): ImageElement {
  return { type: 'image', id: 'e1', src: '', alt: '', width: '100%', ...overrides };
}

describe('ImageRenderer — empty state (src === "")', () => {
  it('ELEM-01: renders branded placeholder when src is empty', () => {
    render(<ImageRenderer element={makeImageElement()} />);
    expect(screen.getByText('Add image URL')).toBeInTheDocument();
  });

  it('ELEM-01: placeholder has min-height of 70px (min-h-[70px] class)', () => {
    const { container } = render(<ImageRenderer element={makeImageElement()} />);
    const placeholder = container.firstChild as HTMLElement;
    expect(placeholder.className).toContain('min-h-[70px]');
  });
});

describe('ImageRenderer — rendered state (src !== "")', () => {
  it('ELEM-01: renders <img> element when src is non-empty', () => {
    render(<ImageRenderer element={makeImageElement({ src: 'https://example.com/img.jpg' })} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('ELEM-01: <img> has the correct src attribute', () => {
    render(<ImageRenderer element={makeImageElement({ src: 'https://example.com/img.jpg' })} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/img.jpg');
  });

  it('ELEM-02: <img> has the correct alt attribute', () => {
    render(<ImageRenderer element={makeImageElement({ src: 'https://x.com/i.jpg', alt: 'My image' })} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'My image');
  });

  it('ELEM-01: <img> has objectFit: cover inline style', () => {
    const { container } = render(<ImageRenderer element={makeImageElement({ src: 'https://x.com/i.jpg' })} />);
    const img = container.querySelector('img');
    expect(img).toHaveStyle({ objectFit: 'cover' });
  });
});
