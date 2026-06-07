import React from 'react';
import { useNewsletters } from '../hooks/useNewsletters';
import { NewsletterCard } from '../components/dashboard/NewsletterCard';
import { CreateNewsletterDialog } from '../components/dashboard/CreateNewsletterDialog';

export default function DashboardPage() {
  const { data: newsletters, isPending, isError } = useNewsletters();

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-destructive">
        Error loading newsletters. Please refresh.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold">Newsletters</h1>
          <CreateNewsletterDialog />
        </div>

        {/* Grid or empty state */}
        {newsletters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <p className="text-base font-semibold">No newsletters yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first newsletter to get started.
            </p>
            <CreateNewsletterDialog triggerLabel="Create your first newsletter" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsletters.map((nl) => (
              <NewsletterCard key={nl.id} newsletter={nl} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
