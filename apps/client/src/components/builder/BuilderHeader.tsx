import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRenameNewsletter } from '../../hooks/useRenameNewsletter';
import type { SaveStatus } from '../../hooks/useAutoSave';

interface BuilderHeaderProps {
  id:         string;
  title:      string;
  saveStatus: SaveStatus;
}

export default function BuilderHeader({ id, title, saveStatus }: BuilderHeaderProps) {
  const navigate       = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const renameMutation = useRenameNewsletter(id);

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
    <header className="sticky top-0 z-10 h-14 bg-background border-b">
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

        {/* RIGHT: Save status + Export button */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {saveStatus !== 'idle' && (
            <span
              className={cn(
                'text-sm min-w-[5rem] text-right',
                saveStatus === 'saving' && 'text-muted-foreground',
                saveStatus === 'saved'  && 'text-muted-foreground',
                saveStatus === 'error'  && 'text-destructive',
              )}
            >
              {saveStatus === 'saving' && 'Saving…'}
              {saveStatus === 'saved'  && 'Saved ✓'}
              {saveStatus === 'error'  && 'Save failed'}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast('Export is not yet available')}
          >
            Export
          </Button>
        </div>

      </div>
    </header>
  );
}
