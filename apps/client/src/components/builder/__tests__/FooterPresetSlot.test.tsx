// FooterPresetSlot component tests — Phase 8 TDD RED stubs
// RED: Cannot find module '../FooterPresetSlot' — component is created in Plan 08-04.
// These tests turn GREEN after Plan 08-04 executes.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FooterPresetSlot } from '../FooterPresetSlot';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('FooterPresetSlot (HF-02)', () => {
  it('renders "No footer selected" when presetId is empty string', () => {
    const { getByText } = render(<FooterPresetSlot presetId="" />, { wrapper: makeWrapper() });
    expect(getByText('No footer selected')).toBeInTheDocument();
  });

  it('renders "No footer selected" when presetId is unknown (no matching preset fetched)', () => {
    const { getByText } = render(<FooterPresetSlot presetId="unknown-xyz" />, { wrapper: makeWrapper() });
    expect(getByText('No footer selected')).toBeInTheDocument();
  });

  it('accepts presetId prop without throwing', () => {
    expect(() => {
      render(<FooterPresetSlot presetId="footer-simple-links" />, { wrapper: makeWrapper() });
    }).not.toThrow();
  });
});
