// apps/client/src/hooks/useNewsletters.ts
// Query hooks for listing and loading newsletters.
// NEWSLETTERS_QUERY_KEY and NEWSLETTER_QUERY_KEY are exported for use by all mutation hooks.
import { useQuery } from '@tanstack/react-query';
import type { NewsletterDoc } from '../types/newsletter';

// ── Shared types ────────────────────────────────────────────────────────────

// Lean list item — matches GET /newsletters response shape
// updatedAt is string (ISO) because JSON.parse converts Date → string
export interface NewsletterSummary {
  id:           string;
  title:        string;
  updatedAt:    string;
  sectionCount: number;
}

// Full newsletter row — matches GET /newsletters/:id response shape
export interface NewsletterDetail {
  id:        string;
  title:     string;
  document:  NewsletterDoc;
  createdAt: string;
  updatedAt: string;
}

// ── Query key constants (exported for use in mutation hooks) ────────────────
export const NEWSLETTERS_QUERY_KEY                = ['newsletters'] as const;
export const NEWSLETTER_QUERY_KEY = (id: string) => ['newsletter', id] as const;

// ── Query hooks ─────────────────────────────────────────────────────────────

/**
 * useNewsletters — fetches the lean list from GET /newsletters
 * staleTime: 0 so dashboard always shows fresh data; invalidated on mutations.
 */
export function useNewsletters() {
  return useQuery<NewsletterSummary[]>({
    queryKey: NEWSLETTERS_QUERY_KEY,
    queryFn:  async () => {
      const res = await fetch('http://localhost:3001/newsletters');
      if (!res.ok) throw new Error('Failed to fetch newsletters');
      return res.json() as Promise<NewsletterSummary[]>;
    },
    staleTime: 0,
  });
}

/**
 * useNewsletter — fetches a single newsletter with full document JSONB
 * staleTime: 1 minute — builder caches between renders; auto-save keeps server in sync.
 */
export function useNewsletter(id: string) {
  return useQuery<NewsletterDetail>({
    queryKey: NEWSLETTER_QUERY_KEY(id),
    queryFn:  async () => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`);
      if (!res.ok) throw new Error('Newsletter not found');
      return res.json() as Promise<NewsletterDetail>;
    },
    staleTime: 1000 * 60,
    enabled:   Boolean(id),
  });
}
