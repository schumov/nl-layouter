import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageLinkRenderer } from '../ImageLinkRenderer';
import type { ImageLinkElement } from '../../../types/newsletter';

function makeImageLinkElement(overrides: Partial<ImageLinkElement> = {}): ImageLinkElement {
  return {
    type: 'image-link', id: 'e1', src: 'https://x.com/img.jpg',
    alt: 'test', href: 'https://x.com', width: '100%',
    ...overrides,
  };
}

describe('ImageLinkRenderer', () => {
  it('ELEM-03: wraps ImageRenderer in an <a> tag', () => {
    const { container } = render(<ImageLinkRenderer element={makeImageLinkElement()} />);
    expect(container.querySelector('a')).not.toBeNull();
  });

  it('ELEM-03: <a> tag has the configured href', () => {
    const { container } = render(<ImageLinkRenderer element={makeImageLinkElement({ href: 'https://example.com' })} />);
    expect(container.querySelector('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('ELEM-03: <a> tag has target="_blank" and rel="noopener noreferrer"', () => {
    const { container } = render(<ImageLinkRenderer element={makeImageLinkElement()} />);
    const anchor = container.querySelector('a');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('ELEM-03: ExternalLink badge has data-builder-only="true"', () => {
    const { container } = render(<ImageLinkRenderer element={makeImageLinkElement()} />);
    const badge = container.querySelector('[data-builder-only="true"]');
    expect(badge).not.toBeNull();
  });

  it('ELEM-03: <img> renders inside the anchor', () => {
    const { container } = render(<ImageLinkRenderer element={makeImageLinkElement()} />);
    expect(container.querySelector('a img')).not.toBeNull();
  });

  it('ELEM-03: href falls back to "#" when href is empty', () => {
    const { container } = render(<ImageLinkRenderer element={makeImageLinkElement({ href: '' })} />);
    expect(container.querySelector('a')).toHaveAttribute('href', '#');
  });
});
