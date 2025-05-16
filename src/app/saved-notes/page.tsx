
import type { Metadata } from 'next';
import SavedNotesViewer from '@/components/saved-notes-viewer';

export const metadata: Metadata = {
  title: 'Saved Notes - ExplainMate AI',
  description: 'View your saved explanations on ExplainMate AI.',
};

export default function SavedNotesPage() {
  // SavedNotesViewer now handles auth checks and redirects internally
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 bg-background">
      <SavedNotesViewer />
    </main>
  );
}
