import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteNewsletter } from '../../hooks/useDeleteNewsletter';
import type { NewsletterSummary } from '../../hooks/useNewsletters';

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60)  return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)  return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

interface Props {
  newsletter: NewsletterSummary;
}

export function NewsletterCard({ newsletter }: Props) {
  const navigate = useNavigate();
  const { handleDelete } = useDeleteNewsletter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div
        className="relative group rounded-lg border bg-card shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/newsletters/${newsletter.id}`)}
      >
        {/* Header: title + ⋮ button */}
        <div className="flex items-start justify-between">
          <h2 className="text-base font-semibold truncate max-w-[calc(100%-2rem)]">
            {newsletter.title}
          </h2>
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Card actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate(`/newsletters/${newsletter.id}`)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Footer: timestamp + section count */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span>Last saved {formatRelativeTime(newsletter.updatedAt)}</span>
          <span>·</span>
          <span>
            {newsletter.sectionCount} section{newsletter.sectionCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Delete confirm dialog — outside card div to avoid click propagation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete newsletter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{newsletter.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Newsletter</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete(newsletter.id, newsletter.title);
                setDeleteOpen(false);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete Newsletter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
