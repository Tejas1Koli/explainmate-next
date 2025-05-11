'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Loader2, Trash2, FileText, Home, ListChecks, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SavedNote } from '@/lib/notes-storage';
import { getSavedNotes, deleteSavedNote, deleteAllSavedNotes } from '@/lib/notes-storage';
import { cn } from '@/lib/utils';

export default function SavedNotesViewer() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Ensure this runs only on the client
    setNotes(getSavedNotes());
    setIsLoading(false);
  }, []);

  const handleDelete = (noteId: string) => {
    const success = deleteSavedNote(noteId);
    if (success) {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      toast({ title: "Note Deleted", description: "The note has been successfully deleted." });
    } else {
       toast({ title: "Error", description: "Failed to delete the note.", variant: "destructive" });
    }
  };

  const triggerDeleteAll = () => {
    const success = deleteAllSavedNotes();
     if (success) {
      setNotes([]);
      toast({ title: "All Notes Deleted", description: "All saved notes have been cleared." });
    } else {
       toast({ title: "Error", description: "Failed to delete all notes.", variant: "destructive" });
    }
    setShowDeleteAllConfirm(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] w-full max-w-3xl mx-auto p-4 md:p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading saved notes...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-2 md:p-0 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <ListChecks className="mr-3 h-8 w-8" /> Saved Notes
        </h1>
        <Link href="/" passHref>
          <Button variant="outline" className="w-full sm:w-auto">
            <Home className="mr-2 h-4 w-4" /> Back to Explainer
          </Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <Card className="text-center shadow-lg rounded-xl border-border/80">
          <CardHeader className="p-6">
            <FileText className="mx-auto mt-2 mb-4 h-16 w-16 text-muted-foreground/40" />
            <CardTitle className="text-2xl">No Saved Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="text-muted-foreground">
              You haven&apos;t saved any notes yet. Go back to the explainer to generate and save explanations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-end">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={notes.length === 0}
              className="shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete All Notes
            </Button>
          </div>
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="shadow-xl rounded-xl border-border/80 overflow-hidden">
                <CardHeader className="p-6 bg-card">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl font-semibold text-foreground break-words flex-1">
                      {note.question}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(note.id)} 
                      className="text-muted-foreground hover:text-destructive shrink-0 -mt-2 -mr-2"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground pt-1">
                    Saved on: {new Date(note.savedAt).toLocaleDateString()} {new Date(note.savedAt).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed text-sm selection:bg-primary/20">
                    {note.explanation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center text-destructive mb-2">
              <AlertTriangle className="h-6 w-6 mr-2 "/>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your saved notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={triggerDeleteAll}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              Yes, delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
