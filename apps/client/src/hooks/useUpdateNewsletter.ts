// apps/client/src/hooks/useUpdateNewsletter.ts
// Auto-save transport hook — fires PUT /newsletters/:id with full document.
// CRITICAL: onSuccess must NEVER call setDoc() — would trigger infinite save loop.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewsletterDoc } from '../types/newsletter';
import { NEWSLETTERS_QUERY_KEY, type NewsletterSummary } from './useNewsletters';

export function useUpdateNewsletter(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: NewsletterDoc) => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ document }),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json() as Promise<{ id: string; updatedAt: string }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<NewsletterSummary[]>(
        NEWSLETTERS_QUERY_KEY,
        (old) => old?.map((n) => n.id === id ? { ...n, updatedAt: data.updatedAt } : n) ?? []
      );
    },
  });
}
