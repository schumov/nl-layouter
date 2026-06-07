// apps/client/src/hooks/useAutoSave.ts
// Auto-save hook — watches Zustand doc state and fires PUT /newsletters/:id after 1500ms debounce.
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNewsletterStore } from '../store/useNewsletterStore';
import type { NewsletterDoc } from '../types/newsletter';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(id: string) {
  const doc = useNewsletterStore((state) => state.doc);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const isInitialLoadRef     = useRef(true);
  const timerRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (document: NewsletterDoc) => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ document }),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json() as Promise<{ id: string; updatedAt: string }>;
    },
    onSuccess: () => {
      setSaveStatus('saved');
      savedFadeTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      // INVARIANT: never call setDoc() here — would trigger another useEffect fire → infinite loop
    },
    onError: () => {
      setSaveStatus('error');
      retryTimerRef.current = setTimeout(() => {
        if (doc) saveMutation.mutate(doc);
      }, 5000);
    },
  });

  useEffect(() => {
    if (!doc) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return; // NO cleanup reset
    }

    setSaveStatus('saving');

    if (timerRef.current) clearTimeout(timerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    timerRef.current = setTimeout(() => {
      saveMutation.mutate(doc);
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (timerRef.current)          clearTimeout(timerRef.current);
      if (retryTimerRef.current)     clearTimeout(retryTimerRef.current);
      if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
    };
  }, []);

  return { saveStatus };
}
