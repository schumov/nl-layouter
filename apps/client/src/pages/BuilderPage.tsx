import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { useNewsletter } from '../hooks/useNewsletters';
import { useNewsletterStore } from '../store/useNewsletterStore';
import { useAutoSave } from '../hooks/useAutoSave';
import BuilderHeader from '../components/builder/BuilderHeader';
import { BuilderCanvas } from '../components/builder/BuilderCanvas';
import { BuilderPalette } from '../components/builder/BuilderPalette';
import { DragDropProvider } from '../components/builder/DragDropProvider';

export default function BuilderPage() {
  const { id }                       = useParams<{ id: string }>();
  const { data, isPending, isError } = useNewsletter(id!);
  const { setDoc, clearDoc }         = useNewsletterStore();
  const { saveStatus }               = useAutoSave(id!);
  const doc                          = useNewsletterStore((state) => state.doc);

  useEffect(() => {
    if (data) setDoc(data.document);
    return () => clearDoc();
  }, [data, setDoc, clearDoc]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Loading newsletter…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-destructive p-4">
        Error loading newsletter. It may have been deleted.
      </div>
    );
  }

  return (
    <DragDropProvider>
      <div className="flex flex-col h-screen">
        <BuilderHeader
          id={id!}
          title={data?.title ?? ''}
          saveStatus={saveStatus}
        />
        <main className="flex flex-1 overflow-hidden">
          <BuilderCanvas doc={doc} />
          <BuilderPalette />
        </main>
      </div>
    </DragDropProvider>
  );
}
