// PresetSelector dialog tests — Phase 8 TDD RED stubs
// RED: Cannot find module '../PresetSelector' — component is created in Plan 08-05.
// These tests turn GREEN after Plan 08-05 executes.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PresetSelector } from '../PresetSelector';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('PresetSelector (HF-01, HF-02)', () => {
  it('renders a dialog element when open=true', () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <PresetSelector
        type="header"
        currentPresetId=""
        open={true}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
      { wrapper: makeWrapper() }
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render dialog content when open=false', () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <PresetSelector
        type="header"
        currentPresetId=""
        open={false}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
      { wrapper: makeWrapper() }
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('accepts type="footer" without throwing', () => {
    expect(() => {
      render(
        <PresetSelector
          type="footer"
          currentPresetId="footer-simple-links"
          open={false}
          onOpenChange={vi.fn()}
          onSelect={vi.fn()}
        />,
        { wrapper: makeWrapper() }
      );
    }).not.toThrow();
  });

  it('calls onOpenChange(false) when Escape is pressed inside the dialog', () => {
    const onOpenChange = vi.fn();
    render(
      <PresetSelector
        type="header"
        currentPresetId=""
        open={true}
        onOpenChange={onOpenChange}
        onSelect={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
