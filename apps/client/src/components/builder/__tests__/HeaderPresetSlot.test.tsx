// HeaderPresetSlot component tests — Phase 8 TDD RED stubs
// RED: Cannot find module '../HeaderPresetSlot' — component is created in Plan 08-04.
// These tests turn GREEN after Plan 08-04 executes.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeaderPresetSlot } from '../HeaderPresetSlot';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('HeaderPresetSlot (HF-01)', () => {
  it('renders "No header selected" when presetId is empty string', () => {
    const { getByText } = render(<HeaderPresetSlot presetId="" />, { wrapper: makeWrapper() });
    expect(getByText('No header selected')).toBeInTheDocument();
  });

  it('renders "No header selected" when presetId is unknown (no matching preset fetched)', async () => {
    const { findByText } = render(<HeaderPresetSlot presetId="unknown-xyz" />, { wrapper: makeWrapper() });
    expect(await findByText('No header selected')).toBeInTheDocument();
  });

  it('renders a div element wrapping the slot area', () => {
    const { container } = render(<HeaderPresetSlot presetId="" />, { wrapper: makeWrapper() });
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('accepts presetId prop without throwing', () => {
    expect(() => {
      render(<HeaderPresetSlot presetId="header-minimal-logo" />, { wrapper: makeWrapper() });
    }).not.toThrow();
  });
});
