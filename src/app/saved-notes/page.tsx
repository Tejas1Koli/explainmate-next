
import type { Metadata } from 'next';
import SavedNotesViewer from '@/components/saved-notes-viewer';

export const metadata: Metadata = {
  title: 'Saved Notes - UPSC Explain',
  description: 'View your saved UPSC question explanations.',
};

export default function SavedNotesPage() {
  // SavedNotesViewer now handles auth checks and redirects internally
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 bg-background">
      <SavedNotesViewer />
    </main>
  );
}
