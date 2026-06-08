import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageEditor } from '../ImageEditor';
import type { ImageElement, ImageLinkElement } from '../../../types/newsletter';

const MOCK_IMAGE: ImageElement = { type: 'image', id: 'e1', src: '', alt: '', width: '100%' };
const MOCK_IMGLINK: ImageLinkElement = { type: 'image-link', id: 'e2', src: '', alt: '', href: '', width: '100%' };

describe('ImageEditor — image type fields', () => {
  it('ELEM-01: src field dispatches onUpdate with { src: value }', () => {
    const onUpdate = vi.fn();
    render(<ImageEditor element={MOCK_IMAGE} onUpdate={onUpdate} />);
    const srcInput = screen.getByPlaceholderText('https://example.com/image.jpg');
    fireEvent.change(srcInput, { target: { value: 'https://new.example.com/img.jpg' } });
    expect(onUpdate).toHaveBeenCalledWith({ src: 'https://new.example.com/img.jpg' });
  });

  it('ELEM-02: alt field dispatches onUpdate with { alt: value }', () => {
    const onUpdate = vi.fn();
    render(<ImageEditor element={MOCK_IMAGE} onUpdate={onUpdate} />);
    const altInput = screen.getByPlaceholderText('Image description');
    fireEvent.change(altInput, { target: { value: 'My alt text' } });
    expect(onUpdate).toHaveBeenCalledWith({ alt: 'My alt text' });
  });

  it('ELEM-01: width field dispatches onUpdate with { width: value }', () => {
    const onUpdate = vi.fn();
    render(<ImageEditor element={MOCK_IMAGE} onUpdate={onUpdate} />);
    const widthInput = screen.getByPlaceholderText('e.g. 100% or 300px');
    fireEvent.change(widthInput, { target: { value: '50%' } });
    expect(onUpdate).toHaveBeenCalledWith({ width: '50%' });
  });

  it('ELEM-01: width field has default value "100%"', () => {
    render(<ImageEditor element={MOCK_IMAGE} onUpdate={vi.fn()} />);
    const widthInput = screen.getByPlaceholderText('e.g. 100% or 300px') as HTMLInputElement;
    expect(widthInput.value).toBe('100%');
  });
});

describe('ImageEditor — image-link type adds href field', () => {
  it('ELEM-03: href field is shown for image-link type', () => {
    render(<ImageEditor element={MOCK_IMGLINK} onUpdate={vi.fn()} />);
    expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
  });

  it('ELEM-03: href field dispatches onUpdate with { href: value }', () => {
    const onUpdate = vi.fn();
    render(<ImageEditor element={MOCK_IMGLINK} onUpdate={onUpdate} />);
    const hrefInput = screen.getByPlaceholderText('https://...');
    fireEvent.change(hrefInput, { target: { value: 'https://clicked.example.com' } });
    expect(onUpdate).toHaveBeenCalledWith({ href: 'https://clicked.example.com' });
  });

  it('ELEM-01: href field is NOT shown for image type', () => {
    render(<ImageEditor element={MOCK_IMAGE} onUpdate={vi.fn()} />);
    expect(screen.queryByPlaceholderText('https://...')).toBeNull();
  });
});
