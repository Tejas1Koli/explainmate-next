'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
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
import {
  Dialog,
  DialogContent,
  DialogDescription as EditDialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, FileText, Home, ListChecks, AlertTriangle, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SavedNote } from '@/lib/notes-storage';
import { getSavedNotes, deleteSavedNote, deleteAllSavedNotes, updateSavedNote } from '@/lib/notes-storage';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const editNoteSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters.").max(2000, "Question must be at most 2000 characters."),
  explanation: z.string().min(10, "Explanation must be at least 10 characters."),
});
type EditNoteFormData = z.infer<typeof editNoteSchema>;


export default function SavedNotesViewer() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<SavedNote | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const editForm = useForm<EditNoteFormData>({
    resolver: zodResolver(editNoteSchema),
    defaultValues: {
      question: '',
      explanation: '',
    },
  });

  useEffect(() => {
    // Ensure this runs only on the client
    setNotes(getSavedNotes());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isEditModalOpen && noteToEdit) {
      editForm.reset({
        question: noteToEdit.question,
        explanation: noteToEdit.explanation,
      });
    } else if (!isEditModalOpen) {
      // Clear noteToEdit and reset form when modal is closed
      setNoteToEdit(null);
      editForm.reset({ question: '', explanation: '' });
    }
  }, [isEditModalOpen, noteToEdit, editForm]);


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

  const handleOpenEditModal = (note: SavedNote) => {
    setNoteToEdit(note);
    setIsEditModalOpen(true);
  };

  const onSubmitEdit = async (data: EditNoteFormData) => {
    if (!noteToEdit) return;

    const updatedNote = updateSavedNote(noteToEdit.id, data.question, data.explanation);

    if (updatedNote) {
      setNotes(prevNotes => 
        prevNotes.map(n => n.id === updatedNote.id ? updatedNote : n).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      );
      toast({
        title: "Note Updated",
        description: "Your note has been successfully updated.",
      });
      setIsEditModalOpen(false); // This will trigger useEffect for cleanup
    } else {
      toast({
        title: "Error Updating Note",
        description: "Could not update the note. Please try again.",
        variant: "destructive",
      });
    }
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
                    <div className="flex items-center gap-1 shrink-0 -mt-2 -mr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(note)}
                        className="text-muted-foreground hover:text-primary"
                        aria-label="Edit note"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(note.id)} 
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground pt-1">
                    Saved on: {new Date(note.savedAt).toLocaleDateString()} {new Date(note.savedAt).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <article className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none selection:bg-primary/20">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {note.explanation}
                    </ReactMarkdown>
                  </article>
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

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <EditDialogDescription>
              Make changes to your saved question and explanation. Click save when you&apos;re done.
            </EditDialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4 py-2">
              <FormField
                control={editForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Edit your question"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Edit your explanation"
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
