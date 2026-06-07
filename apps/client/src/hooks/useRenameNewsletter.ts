// apps/client/src/hooks/useRenameNewsletter.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NEWSLETTERS_QUERY_KEY, NEWSLETTER_QUERY_KEY, type NewsletterSummary } from './useNewsletters';

export function useRenameNewsletter(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Rename failed');
      return res.json() as Promise<{ id: string; title: string; updatedAt: string }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<NewsletterSummary[]>(
        NEWSLETTERS_QUERY_KEY,
        (old) => old?.map((n) => n.id === id
          ? { ...n, title: data.title, updatedAt: data.updatedAt }
          : n
        ) ?? []
      );
      queryClient.setQueryData(NEWSLETTER_QUERY_KEY(id), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...(old as object), title: data.title, updatedAt: data.updatedAt };
      });
    },
  });
}
