import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { useNewsletter } from '../hooks/useNewsletters';
import { useNewsletterStore } from '../store/useNewsletterStore';
import { useAutoSave } from '../hooks/useAutoSave';
import BuilderHeader from '../components/builder/BuilderHeader';
import { BuilderCanvas } from '../components/builder/BuilderCanvas';
import { BuilderPalette } from '../components/builder/BuilderPalette';
import { InspectorPanel } from '../components/builder/InspectorPanel';
import { DragDropProvider } from '../components/builder/DragDropProvider';

export default function BuilderPage() {
  const { id }                       = useParams<{ id: string }>();
  const { data, isPending, isError } = useNewsletter(id!);
  const { setDoc, clearDoc }         = useNewsletterStore();
  const { saveStatus }               = useAutoSave(id!);
  const doc                          = useNewsletterStore((state) => state.doc);

  const selectedElementId   = useNewsletterStore((state) => state.selectedElementId);
  const setSelectedElement  = useNewsletterStore((state) => state.setSelectedElement);

  // Phase 8: preset + pre-header actions
  const updateHeader    = useNewsletterStore((s) => s.updateHeader);
  const updateFooter    = useNewsletterStore((s) => s.updateFooter);
  const updatePreHeader = useNewsletterStore((s) => s.updatePreHeader);

  // D-09: Derive full element object (not just type string) for Phase 6 InspectorPanel
  const selectedElement = useNewsletterStore((state) => {
    if (!state.selectedElementId || !state.doc) return null;
    for (const row of state.doc.rows) {
      for (const slot of row.slots) {
        if (slot.id === state.selectedElementId && slot.element) {
          return slot.element;  // full ElementUnion object
        }
      }
    }
    return null;
  });
  const updateElement = useNewsletterStore((s) => s.updateElement);

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
          doc={doc}
          onUpdateHeader={updateHeader}
          onUpdateFooter={updateFooter}
          onUpdatePreHeader={updatePreHeader}
        />
        <main className="flex flex-1 overflow-hidden">
          <BuilderCanvas
            doc={doc}
            onCanvasClick={() => setSelectedElement(null)}
            headerPresetId={doc?.header?.presetId ?? ''}
            footerPresetId={doc?.footer?.presetId ?? ''}
          />
          {selectedElementId && selectedElement
            ? (
                <InspectorPanel
                  element={selectedElement}
                  onBack={() => setSelectedElement(null)}
                  onUpdate={(patch) => updateElement(selectedElementId, patch)}
                />
              )
            : <BuilderPalette />
          }
        </main>
      </div>
    </DragDropProvider>
  );
}
