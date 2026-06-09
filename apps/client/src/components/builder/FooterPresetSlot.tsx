// apps/client/src/components/builder/FooterPresetSlot.tsx
// Renders the selected footer preset HTML at the bottom of BuilderCanvas.
//
// TRUST BOUNDARY: htmlContent is developer-authored seed data (inserted via seed.ts).
// It is NOT user-submitted. DOMPurify is NOT installed (see 08-RESEARCH.md §6).
// Never pass user-generated strings to dangerouslySetInnerHTML.
import React from 'react';
import { usePreset } from '../../hooks/usePresets';

interface FooterPresetSlotProps {
  presetId: string;
}

export function FooterPresetSlot({ presetId }: FooterPresetSlotProps) {
  // usePreset is disabled when presetId is empty string (enabled: !!id inside the hook)
  const { data: preset, isLoading } = usePreset(presetId);

  // No preset selected — show neutral placeholder
  if (!presetId) {
    return (
      <div className="w-full py-3 text-center text-xs text-muted-foreground border-t">
        No footer selected
      </div>
    );
  }

  // Preset ID provided but still loading from API
  if (isLoading) {
    return <div className="w-full h-16 bg-muted animate-pulse" />;
  }

  // Preset ID provided but not found (404 or unknown ID) — show placeholder
  if (!preset) {
    return (
      <div className="w-full py-3 text-center text-xs text-muted-foreground border-t">
        No footer selected
      </div>
    );
  }

  // TRUST BOUNDARY: preset.htmlContent is loaded from DB where it was inserted by seed.ts.
  // Developer-authored HTML only — safe to render without sanitization.
  return (
    <div dangerouslySetInnerHTML={{ __html: preset.htmlContent }} />
  );
}
