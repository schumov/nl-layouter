import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateNewsletter } from '../../hooks/useCreateNewsletter';

interface CreateNewsletterDialogProps {
  triggerLabel?: string;
}

export function CreateNewsletterDialog({ triggerLabel = 'New Newsletter' }: CreateNewsletterDialogProps) {
  const [open, setOpen]   = useState(false);
  const [title, setTitle] = useState('');
  const navigate          = useNavigate();
  const createMutation    = useCreateNewsletter();

  const handleSubmit = () => {
    if (!title.trim()) return;
    createMutation.mutate(title.trim(), {
      onSuccess: (data) => {
        navigate(`/newsletters/${data.id}`);
      },
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTitle('');
      createMutation.reset();
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Newsletter</DialogTitle>
          <DialogDescription>Give your newsletter a name to get started.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <Input
            autoFocus
            placeholder="Newsletter name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            disabled={createMutation.isPending}
          />

          {createMutation.isError && (
            <p className="text-sm text-destructive">
              Failed to create newsletter. Please try again.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Discard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create Newsletter'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
