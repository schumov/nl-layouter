// apps/client/src/components/builder/PresetSelector.tsx
// Controlled dialog for selecting a header or footer preset.
// Caller (BuilderHeader) controls open/close state; no internal open state.
// Uses Dialog from ui/dialog.tsx (Radix UI primitive wrapper).
import React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePresets } from '../../hooks/usePresets';
import type { PresetSummary } from '../../hooks/usePresets';

interface PresetSelectorProps {
  /** Whether to show 'Header' or 'Footer' presets */
  type:             'header' | 'footer';
  /** The currently applied preset ID — highlights the matching card */
  currentPresetId:  string;
  /** Controlled open state — managed by BuilderHeader */
  open:             boolean;
  /** Called when dialog should close (Escape, overlay click, card selection) */
  onOpenChange:     (open: boolean) => void;
  /** Called with selected presetId; empty string means "None" */
  onSelect:         (presetId: string) => void;
}

export function PresetSelector({
  type,
  currentPresetId,
  open,
  onOpenChange,
  onSelect,
}: PresetSelectorProps) {
  const { data: presets = [], isLoading } = usePresets(type);

  const label = type === 'header' ? 'Header' : 'Footer';

  const handleSelect = (presetId: string) => {
    onSelect(presetId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select {label} Preset</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          /* Loading skeletons — shown while usePresets fetches from API */
          <div className="grid grid-cols-2 gap-3 py-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-2">

            {/* None card — clears the current selection */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={cn(
                'rounded-md border px-3 py-4 text-left text-sm transition-colors hover:bg-accent',
                currentPresetId === '' && 'ring-2 ring-ring'
              )}
            >
              <span className="font-semibold text-muted-foreground">None</span>
              <p className="text-xs text-muted-foreground mt-1">
                No {label.toLowerCase()} applied
              </p>
            </button>

            {/* Preset cards — one per preset returned by usePresets(type) */}
            {presets.map((preset: PresetSummary) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelect(preset.id)}
                className={cn(
                  'rounded-md border px-3 py-4 text-left text-sm transition-colors hover:bg-accent',
                  currentPresetId === preset.id && 'ring-2 ring-ring'
                )}
              >
                <span className="font-semibold">{preset.name}</span>
                {currentPresetId === preset.id && (
                  <p className="text-xs text-muted-foreground mt-1">Currently selected</p>
                )}
              </button>
            ))}

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
