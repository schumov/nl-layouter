// apps/client/src/hooks/useDeleteNewsletter.ts
// Optimistic delete with 5-second undo window.
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { NEWSLETTERS_QUERY_KEY, type NewsletterSummary } from './useNewsletters';

export function useDeleteNewsletter() {
  const queryClient = useQueryClient();

  const handleDelete = (id: string, title: string) => {
    const previous = queryClient.getQueryData<NewsletterSummary[]>(NEWSLETTERS_QUERY_KEY);

    queryClient.setQueryData<NewsletterSummary[]>(
      NEWSLETTERS_QUERY_KEY,
      (old) => old?.filter((n) => n.id !== id) ?? []
    );

    let undone = false;
    const timerId = setTimeout(async () => {
      if (undone) return;
      try {
        const res = await fetch(`http://localhost:3001/newsletters/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
      } catch {
        queryClient.setQueryData(NEWSLETTERS_QUERY_KEY, previous);
        toast.error(`Failed to delete "${title}"`);
      }
    }, 5000);

    toast(`"${title}" deleted`, {
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true;
          clearTimeout(timerId);
          queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY });
        },
      },
      duration: 5000,
    });
  };

  return { handleDelete };
}
