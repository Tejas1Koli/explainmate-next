
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';

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
import { Loader2, Trash2, FileText, Home, ListChecks, AlertTriangle, Pencil, Download, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SavedNote } from '@/lib/notes-storage';
import { getSavedNotes, deleteSavedNote, deleteAllSavedNotes, updateSavedNote } from '@/lib/notes-storage';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import type { Timestamp } from 'firebase/firestore';


const editNoteSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters.").max(2000, "Question must be at most 2000 characters."),
  userNotes: z.string().optional(),
});
type EditNoteFormData = z.infer<typeof editNoteSchema>;


export default function SavedNotesViewer() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<SavedNote | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const editForm = useForm<EditNoteFormData>({
    resolver: zodResolver(editNoteSchema),
    defaultValues: {
      question: '',
      userNotes: '',
    },
  });

  const fetchNotes = useCallback(async () => {
    if (currentUser) {
      setIsLoadingNotes(true);
      const userNotes = await getSavedNotes(currentUser.uid);
      // Sort by savedAt descending (Firebase Timestamps can be compared directly or via .toMillis())
      userNotes.sort((a, b) => b.savedAt.toMillis() - a.savedAt.toMillis());
      setNotes(userNotes);
      setIsLoadingNotes(false);
    } else {
      setNotes([]);
      setIsLoadingNotes(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!authLoading) {
      if (currentUser) {
        fetchNotes();
      } else {
        // Redirect to login if not authenticated and not loading
        toast({ title: "Login Required", description: "Please login to view your saved notes.", variant: "default" });
        router.push('/login');
      }
    }
  }, [currentUser, authLoading, fetchNotes, router, toast]);

  useEffect(() => {
    if (isEditModalOpen && noteToEdit) {
      editForm.reset({
        question: noteToEdit.question,
        userNotes: noteToEdit.userNotes || '', 
      });
    } else if (!isEditModalOpen) {
      setNoteToEdit(null);
      editForm.reset({ question: '', userNotes: '' });
    }
  }, [isEditModalOpen, noteToEdit, editForm]);


  const handleDelete = async (noteId: string) => {
    if (!currentUser) return;
    const success = await deleteSavedNote(currentUser.uid, noteId);
    if (success) {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      toast({ title: "Note Deleted", description: "The note has been successfully deleted." });
    } else {
       toast({ title: "Error", description: "Failed to delete the note.", variant: "destructive" });
    }
  };

  const triggerDeleteAll = async () => {
    if (!currentUser) return;
    const success = await deleteAllSavedNotes(currentUser.uid);
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
    if (!noteToEdit || !currentUser) return;

    const updatedNoteData = await updateSavedNote(currentUser.uid, noteToEdit.id, data.question, data.userNotes);

    if (updatedNoteData) {
      // Refetch or update locally. Fetching ensures consistency with server-generated timestamps.
      await fetchNotes(); 
      toast({
        title: "Note Updated",
        description: "Your note has been successfully updated.",
      });
      setIsEditModalOpen(false); 
    } else {
      toast({
        title: "Error Updating Note",
        description: "Could not update the note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFirebaseTimestamp = (timestamp: Timestamp | string): string => {
    if (!timestamp) return 'N/A';
    const date = (timestamp as Timestamp).toDate ? (timestamp as Timestamp).toDate() : new Date(timestamp as string);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const handleExportToPdf = async (note: SavedNote) => {
    setIsExportingPdf(note.id);
    const noteElementId = `note-to-export-${note.id}`;
    let tempDiv = document.getElementById(noteElementId);
    let newTempDivCreated = false;
    let root: ReactDOM.Root | null = null;
  
    if (!tempDiv) {
      tempDiv = document.createElement('div');
      tempDiv.id = noteElementId;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px'; 
      tempDiv.style.background = 'white'; 
      tempDiv.className = 'font-sans'; 
      document.body.appendChild(tempDiv);
      newTempDivCreated = true;
    }
  
    const contentToRender = (
      <div className="p-5 bg-white">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Question/Concept:</h2>
        <p className="text-base text-gray-700 mb-4 whitespace-pre-wrap break-words">{note.question}</p>
        <hr className="my-4 border-gray-300"/>
        <h2 className="text-xl font-bold mb-2 text-gray-800">Your Notes:</h2>
        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none text-gray-700">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {note.userNotes || "No additional notes."}
          </ReactMarkdown>
        </div>
      </div>
    );
    
    root = ReactDOM.createRoot(tempDiv);
    root.render(contentToRender);
  
    await new Promise(resolve => setTimeout(resolve, 1000)); 
  
    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 1, 
        useCORS: true,
        backgroundColor: '#ffffff', 
        logging: false,
        onclone: (document) => {
          let katexStylesheet = document.getElementById('katex-stylesheet');
          if (!katexStylesheet) {
            katexStylesheet = document.createElement('link');
            katexStylesheet.id = 'katex-stylesheet';
            katexStylesheet.rel = 'stylesheet';
            katexStylesheet.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(katexStylesheet);
          }
        }
      });
  
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });
  
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10; 
      const availableWidth = pdfWidth - 2 * margin;
      const availableHeight = pdfHeight - 2 * margin;
      
      let imgRenderWidth = imgProps.width;
      let imgRenderHeight = imgProps.height;
      const aspectRatio = imgProps.width / imgProps.height;

      if (imgRenderWidth > availableWidth) {
        imgRenderWidth = availableWidth;
        imgRenderHeight = imgRenderWidth / aspectRatio;
      }
      if (imgRenderHeight > availableHeight) {
        imgRenderHeight = availableHeight;
        imgRenderWidth = imgRenderHeight * aspectRatio;
      }
      
      const xOffset = (pdfWidth - imgRenderWidth) / 2;
      const yOffset = margin;
  
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgRenderWidth, imgRenderHeight);
      pdf.save(`stem_concept_note_${note.id.substring(0,8)}.pdf`);
  
      toast({
          title: "PDF Exported",
          description: "The note has been exported as a PDF."
      });
  
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "PDF Export Error",
        description: "Could not export the note to PDF. Check console for details.",
        variant: "destructive",
      });
    } finally {
      if (root) {
        root.unmount();
      }
      if (newTempDivCreated && tempDiv && tempDiv.parentNode) {
          tempDiv.parentNode.removeChild(tempDiv);
      }
      setIsExportingPdf(null);
    }
  };
  
  if (authLoading || (isLoadingNotes && currentUser)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] w-full max-w-3xl mx-auto p-4 md:p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading notes...</p>
      </div>
    );
  }

  if (!currentUser && !authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] w-full max-w-3xl mx-auto p-4 md:p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-xl font-semibold mb-2">Access Denied</p>
        <p className="text-muted-foreground mb-4">You need to be logged in to view your saved notes.</p>
        <Link href="/login" passHref>
          <Button variant="default"><LogIn className="mr-2 h-4 w-4" />Login</Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="w-full max-w-3xl mx-auto p-2 md:p-0 space-y-6 my-8">
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
                    <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExportToPdf(note)}
                        disabled={isExportingPdf === note.id}
                        className="text-muted-foreground hover:text-primary"
                        aria-label="Export to PDF"
                      >
                        {isExportingPdf === note.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(note)}
                        className="text-muted-foreground hover:text-primary"
                        aria-label="Edit note"
                        disabled={!!isExportingPdf}
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(note.id)} 
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete note"
                        disabled={!!isExportingPdf}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground pt-1">
                    Saved on: {formatFirebaseTimestamp(note.savedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {(note.userNotes && note.userNotes.trim() !== '') ? (
                     <article className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none selection:bg-primary/20">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {note.userNotes}
                      </ReactMarkdown>
                    </article>
                  ) : (
                    <p className="text-muted-foreground italic">No additional notes were saved for this question.</p>
                  )}
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
              Make changes to your saved question/concept and your additional notes. Click save when you&apos;re done.
            </EditDialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <FormField
                control={editForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question/Concept</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Edit your question or concept"
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
                name="userNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Edit your additional notes (optional)"
                        className="min-h-[150px] resize-y"
                        {...field}
                        value={field.value ?? ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4 sticky bottom-0 bg-background">
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
