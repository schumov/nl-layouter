// apps/client/src/components/builder/__tests__/BuilderHeader.export.test.tsx
// RED stubs — Plan 09-00. Implementation in Plan 09-07.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BuilderHeader from '../BuilderHeader';

const mockFetch = vi.fn();
beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockReset();
});

function renderHeader() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BuilderHeader
          id="test-id"
          title="Test Newsletter"
          saveStatus="idle"
          doc={null}
          onUpdateHeader={vi.fn()}
          onUpdateFooter={vi.fn()}
          onUpdatePreHeader={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BuilderHeader — Export button (Phase 9)', () => {
  it('EXPORT-BTN-01: Export button triggers POST /newsletters/:id/export', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<html><body>Export</body></html>',
    });

    renderHeader();
    const exportBtn = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/newsletters/test-id/export'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('EXPORT-BTN-02: Export button shows loading state during export', async () => {
    // Delay the fetch to catch the loading state
    let resolveFetch!: (value: unknown) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    renderHeader();
    const exportBtn = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportBtn);

    // Button should show loading text
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /exporting/i })).toBeTruthy();
    });

    // Resolve to clean up
    resolveFetch({ ok: true, text: async () => '<html></html>' });
  });
});
