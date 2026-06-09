// apps/client/src/components/builder/BuilderHeader.tsx
// Phase 8 additions:
//   - "Header" and "Footer" outline buttons open PresetSelector dialogs
//   - Pre-header row below the main toolbar: input + char count (N/90)
//
// Layout structure:
//   <div sticky top-0 z-10 bg-background border-b>
//     <header h-14>  [LEFT: back] [CENTER: title] [RIGHT: Header | Footer | save | Export]  </header>
//     <div border-b>  Pre-header: [input] [N/90]  </div>
//   </div>
//   <PresetSelector type="header" ... />
//   <PresetSelector type="footer" ... />
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRenameNewsletter } from '../../hooks/useRenameNewsletter';
import type { SaveStatus } from '../../hooks/useAutoSave';
import type { NewsletterDoc } from '../../types/newsletter';
import { PresetSelector } from './PresetSelector';

interface BuilderHeaderProps {
  id:         string;
  title:      string;
  saveStatus: SaveStatus;
  // Phase 8 additions:
  doc:               NewsletterDoc | null;
  onUpdateHeader:    (presetId: string) => void;
  onUpdateFooter:    (presetId: string) => void;
  onUpdatePreHeader: (text: string) => void;
}

export default function BuilderHeader({
  id,
  title,
  saveStatus,
  doc,
  onUpdateHeader,
  onUpdateFooter,
  onUpdatePreHeader,
}: BuilderHeaderProps) {
  const navigate       = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const renameMutation = useRenameNewsletter(id);

  // PresetSelector open state — one per type (header / footer)
  const [headerSelectorOpen, setHeaderSelectorOpen] = useState(false);
  const [footerSelectorOpen, setFooterSelectorOpen] = useState(false);

  // Phase 9: export state
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`http://localhost:3001/newsletters/${id}/export`, { method: 'POST' });
      if (!res.ok) throw new Error('Export failed');
      const html  = await res.text();
      const blob  = new Blob([html], { type: 'text/html' });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href      = url;
      a.download  = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Newsletter exported!');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!isEditing) setEditValue(title);
  }, [title, isEditing]);

  const commitRename = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      renameMutation.mutate(trimmed);
    } else {
      setEditValue(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitRename();
    } else if (e.key === 'Escape') {
      setEditValue(title);
      setIsEditing(false);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b">

      {/* Main toolbar row — h-14 */}
      <header className="h-14">
        <div className="flex items-center justify-between gap-4 px-4 h-full">

          {/* LEFT: Back arrow */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/newsletters')}
              aria-label="Back to newsletters"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* CENTER: Click-to-edit title */}
          <div className="flex-1 flex justify-center">
            {isEditing ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleKeyDown}
                className={cn(
                  'bg-transparent border-none shadow-none outline-none',
                  'focus:ring-1 focus:ring-ring rounded',
                  'text-base font-semibold text-center',
                  'min-w-[12rem] max-w-md'
                )}
              />
            ) : (
              <button
                onClick={() => { setEditValue(title); setIsEditing(true); }}
                className="text-base font-semibold truncate max-w-md cursor-pointer hover:underline"
              >
                {title}
              </button>
            )}
          </div>

          {/* RIGHT: Header | Footer | save status | Export */}
          <div className="flex-shrink-0 flex items-center gap-2">

            {/* Phase 8: Header preset selector trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHeaderSelectorOpen(true)}
            >
              Header
            </Button>

            {/* Phase 8: Footer preset selector trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFooterSelectorOpen(true)}
            >
              Footer
            </Button>

            {saveStatus !== 'idle' && (
              <span
                className={cn(
                  'text-sm min-w-[5rem] text-right',
                  saveStatus === 'saving' && 'text-muted-foreground',
                  saveStatus === 'saved'  && 'text-muted-foreground',
                  saveStatus === 'error'  && 'text-destructive',
                )}
              >
                {saveStatus === 'saving' && 'Saving\u2026'}
                {saveStatus === 'saved'  && 'Saved \u2713'}
                {saveStatus === 'error'  && 'Save failed'}
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting\u2026' : 'Export'}
            </Button>

          </div>
        </div>
      </header>

      {/* Pre-header row — hidden inbox-preview text for email clients (HF-04) */}
      {/* Enforces 90-char limit via .slice(0, 90) in onChange — NOT maxlength alone */}
      <div className="border-b px-4 py-2 flex items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground min-w-fit">Pre-header</span>
        <input
          type="text"
          placeholder="Hidden inbox preview text\u2026"
          value={doc?.preHeader ?? ''}
          onChange={(e) => onUpdatePreHeader(e.target.value.slice(0, 90))}
          className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-1 focus:ring-ring rounded px-1"
        />
        <span className="text-xs text-muted-foreground">
          {(doc?.preHeader ?? '').length}/90
        </span>
      </div>

      {/* PresetSelector dialogs — controlled by headerSelectorOpen / footerSelectorOpen state */}
      <PresetSelector
        type="header"
        currentPresetId={doc?.header?.presetId ?? ''}
        open={headerSelectorOpen}
        onOpenChange={setHeaderSelectorOpen}
        onSelect={onUpdateHeader}
      />
      <PresetSelector
        type="footer"
        currentPresetId={doc?.footer?.presetId ?? ''}
        open={footerSelectorOpen}
        onOpenChange={setFooterSelectorOpen}
        onSelect={onUpdateFooter}
      />

    </div>
  );
}
