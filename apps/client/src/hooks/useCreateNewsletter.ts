// apps/client/src/hooks/useCreateNewsletter.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NEWSLETTERS_QUERY_KEY } from './useNewsletters';

export function useCreateNewsletter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('http://localhost:3001/newsletters', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to create newsletter');
      return res.json() as Promise<{ id: string; title: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY });
    },
  });
}
