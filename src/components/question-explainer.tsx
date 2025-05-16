
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Save, LogIn, ThumbsUp, ThumbsDown, MessageSquare as FeedbackMessageIcon, Code } from 'lucide-react';
import { explainSTEMConcept, ExplainSTEMConceptInput, ExplainSTEMConceptOutput } from '@/ai/flows/explain-stem-concept';
import { useToast } from '@/hooks/use-toast';
import { addSavedNote } from '@/lib/notes-storage';
import { useAuth } from '@/contexts/auth-context';
import { addFeedback } from '@/lib/feedback-storage';
import type { AddFeedbackData } from '@/lib/feedback-storage';

const formSchema = z.object({
  question: z.string()
    .min(10, "Question must be at least 10 characters.")
    .max(2000, "Question must be at most 2000 characters."),
});

const feedbackFormSchema = z.object({
  feedbackText: z.string().min(10, "Feedback must be at least 10 characters.").max(1000, "Feedback must be at most 1000 characters."),
});

const SESSION_STORAGE_KEYS = {
  QUESTION_INPUT: 'explainerQuestionInput',
  CURRENT_EXPLAINED_QUESTION: 'explainerCurrentExplainedQuestion',
  EXPLANATION: 'explainerExplanation',
  USER_NOTES: 'explainerUserNotes',
  FEEDBACK_SUBMITTED: 'explainerFeedbackSubmitted',
  SHOW_FEEDBACK_INPUT: 'explainerShowFeedbackInput',
  SHOW_RAW_MARKDOWN: 'explainerShowRawMarkdown',
  ERROR: 'explainerError',
};


export default function QuestionExplainer() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>(''); // Question for which explanation is shown
  const [userNotes, setUserNotes] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState<boolean>(false);

  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });
  const questionInputValue = form.watch('question');

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedQuestionInput = sessionStorage.getItem(SESSION_STORAGE_KEYS.QUESTION_INPUT);
      if (storedQuestionInput) form.setValue('question', storedQuestionInput);

      const storedCurrentExplainedQuestion = sessionStorage.getItem(SESSION_STORAGE_KEYS.CURRENT_EXPLAINED_QUESTION);
      if (storedCurrentExplainedQuestion) setCurrentQuestion(storedCurrentExplainedQuestion);
      
      const storedExplanation = sessionStorage.getItem(SESSION_STORAGE_KEYS.EXPLANATION);
      if (storedExplanation) setExplanation(storedExplanation);

      const storedUserNotes = sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_NOTES);
      if (storedUserNotes) setUserNotes(storedUserNotes);

      const storedFeedbackSubmitted = sessionStorage.getItem(SESSION_STORAGE_KEYS.FEEDBACK_SUBMITTED);
      if (storedFeedbackSubmitted) setFeedbackSubmitted(JSON.parse(storedFeedbackSubmitted));

      const storedShowFeedbackInput = sessionStorage.getItem(SESSION_STORAGE_KEYS.SHOW_FEEDBACK_INPUT);
      if (storedShowFeedbackInput) setShowFeedbackInput(JSON.parse(storedShowFeedbackInput));
      
      const storedShowRawMarkdown = sessionStorage.getItem(SESSION_STORAGE_KEYS.SHOW_RAW_MARKDOWN);
      if (storedShowRawMarkdown) setShowRawMarkdown(JSON.parse(storedShowRawMarkdown));

      const storedError = sessionStorage.getItem(SESSION_STORAGE_KEYS.ERROR);
      if (storedError) setError(storedError);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Save state to sessionStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.QUESTION_INPUT, questionInputValue);
      sessionStorage.setItem(SESSION_STORAGE_KEYS.CURRENT_EXPLAINED_QUESTION, currentQuestion);
      if (explanation !== null) sessionStorage.setItem(SESSION_STORAGE_KEYS.EXPLANATION, explanation);
      else sessionStorage.removeItem(SESSION_STORAGE_KEYS.EXPLANATION);
      sessionStorage.setItem(SESSION_STORAGE_KEYS.USER_NOTES, userNotes);
      sessionStorage.setItem(SESSION_STORAGE_KEYS.FEEDBACK_SUBMITTED, JSON.stringify(feedbackSubmitted));
      sessionStorage.setItem(SESSION_STORAGE_KEYS.SHOW_FEEDBACK_INPUT, JSON.stringify(showFeedbackInput));
      sessionStorage.setItem(SESSION_STORAGE_KEYS.SHOW_RAW_MARKDOWN, JSON.stringify(showRawMarkdown));
      if (error !== null) sessionStorage.setItem(SESSION_STORAGE_KEYS.ERROR, error);
      else sessionStorage.removeItem(SESSION_STORAGE_KEYS.ERROR);
    }
  }, [questionInputValue, currentQuestion, explanation, userNotes, feedbackSubmitted, showFeedbackInput, showRawMarkdown, error]);


  async function onSubmitExplanation(values: z.infer<typeof formSchema>) {
    setIsLoadingExplanation(true);
    setExplanation(null);
    setCurrentQuestion(values.question); // Set current question being processed
    setUserNotes(''); 
    setError(null);
    setFeedbackSubmitted(false);
    setShowFeedbackInput(false);
    setShowRawMarkdown(false);
    feedbackForm.reset();

    // Clear previous explanation-related items from session storage for a fresh start
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.EXPLANATION);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.USER_NOTES);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.FEEDBACK_SUBMITTED);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.SHOW_FEEDBACK_INPUT);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.SHOW_RAW_MARKDOWN);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.ERROR);
    }


    try {
      const input: ExplainSTEMConceptInput = { question: values.question };
      const result: ExplainSTEMConceptOutput = await explainSTEMConcept(input);
      setExplanation(result.explanation);
    } catch (err) {
      console.error("Error fetching explanation:", err);
      let errorMessage = "Failed to generate explanation. Please check your connection or try again later.";
      if (err instanceof Error) {
        errorMessage = `An error occurred: ${err.message}. Please try again.`;
      }
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingExplanation(false);
    }
  }

  async function handleSaveNote() {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to save your notes.",
        variant: "destructive",
      });
      return;
    }
    if (!currentQuestion || !explanation) {
       toast({
        title: "Nothing to Save",
        description: "Please generate an explanation before saving.",
        variant: "default",
      });
      return;
    }

    setIsSavingNote(true);
    // Pass currentQuestion (the one for which explanation was generated)
    const savedNote = await addSavedNote(currentUser.uid, currentQuestion, userNotes);
    setIsSavingNote(false);

    if (savedNote) {
      toast({
        title: "Note Saved!",
        description: "Your question and additional notes have been saved.",
      });
    } else {
      toast({
        title: "Error Saving Note",
        description: "Could not save the note. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleHelpfulClick = async () => {
    if (!currentQuestion || !explanation) return;
    setIsSubmittingFeedback(true);
    const feedbackData: AddFeedbackData = {
      userId: currentUser?.uid,
      question: currentQuestion,
      explanation: explanation,
      isHelpful: true,
      feedbackText: '', 
      feedbackType: 'explanation',
    };
    await addFeedback(feedbackData);
    setFeedbackSubmitted(true);
    setShowFeedbackInput(false);
    setIsSubmittingFeedback(false);
    toast({ title: "Feedback Received", description: "Thank you for your feedback!" });
  };

  const handleNotHelpfulClick = () => {
    setShowFeedbackInput(true);
    setFeedbackSubmitted(false); 
  };
  
  async function onFeedbackSubmit(values: z.infer<typeof feedbackFormSchema>) {
    if (!currentQuestion || !explanation) return;
    setIsSubmittingFeedback(true);
    const feedbackData: AddFeedbackData = {
      userId: currentUser?.uid,
      question: currentQuestion,
      explanation: explanation,
      isHelpful: false,
      feedbackText: values.feedbackText,
      feedbackType: 'explanation',
    };
    await addFeedback(feedbackData);
    setFeedbackSubmitted(true);
    setShowFeedbackInput(false);
    setIsSubmittingFeedback(false);
    feedbackForm.reset();
    toast({ title: "Feedback Received", description: "Thank you for your feedback! We'll use it to improve." });
  }


  return (
    <div className="w-full max-w-2xl mx-auto p-2 md:p-0 space-y-6">
      <Card className="shadow-xl rounded-xl overflow-hidden border-border/80">
        <CardHeader className="bg-card p-6">
          <CardTitle className="text-3xl font-bold text-center text-primary tracking-tight">
            ExplainMate AI
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground text-md pt-1">
            Enter your question and get a clear, concise explanation with rich formatting from ExplainMate AI. Perfect for quick revisions and deepening your understanding!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitExplanation)} className="space-y-6">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-foreground">Your Question/Concept:</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Explain the concept of black holes, derive the formula for kinetic energy $KE = \\frac{1}{2}mv^2$, or describe how a lithium-ion battery works."
                        className="min-h-[120px] text-base resize-y focus:ring-primary focus:border-primary rounded-md shadow-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isLoadingExplanation || authLoading} 
                className="w-full text-lg py-3 rounded-md shadow-md hover:shadow-lg transition-shadow duration-200"
                variant="default"
              >
                {isLoadingExplanation ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Explanation...
                  </>
                ) : (
                  'Get Explanation'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && !isLoadingExplanation && (
        <Card className="shadow-lg rounded-xl border-destructive bg-destructive/5">
          <CardHeader className="p-4">
            <CardTitle className="text-destructive text-lg font-semibold flex items-center">
              <AlertCircle className="inline-block mr-2 h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-destructive-foreground opacity-90">{error}</p>
          </CardContent>
        </Card>
      )}

      {explanation && !isLoadingExplanation && (
        <Card className="shadow-xl rounded-xl border-border/80">
          <CardHeader className="bg-card p-6">
            <div className="flex justify-between items-center gap-2">
              <CardTitle className="text-2xl font-semibold text-primary">AI-Generated Explanation</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                className="whitespace-nowrap"
              >
                <Code className="mr-2 h-4 w-4" />
                {showRawMarkdown ? "View Rendered" : "View Raw"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {showRawMarkdown ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Below is the raw Markdown source, including LaTeX for math formulas. You can copy directly from here.
                </p>
                <pre className="p-4 bg-muted/50 dark:bg-muted/20 border border-border rounded-md overflow-x-auto text-sm whitespace-pre-wrap break-all font-mono selection:bg-primary/20">
                  {explanation}
                </pre>
              </>
            ) : (
              <article className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none selection:bg-primary/20">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {explanation}
                </ReactMarkdown>
              </article>
            )}
            
            <Separator />

            {!feedbackSubmitted && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Was this explanation helpful?</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleHelpfulClick} disabled={isSubmittingFeedback || showFeedbackInput}>
                    <ThumbsUp className="mr-2 h-4 w-4" /> Helpful
                  </Button>
                  <Button variant="outline" onClick={handleNotHelpfulClick} disabled={isSubmittingFeedback}>
                    <ThumbsDown className="mr-2 h-4 w-4" /> Not Helpful
                  </Button>
                </div>
              </div>
            )}

            {showFeedbackInput && !feedbackSubmitted && (
              <Form {...feedbackForm}>
                <form onSubmit={feedbackForm.handleSubmit(onFeedbackSubmit)} className="space-y-4 pt-3">
                   <FormField
                    control={feedbackForm.control}
                    name="feedbackText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-foreground">Your Feedback:</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please tell us how we can improve this explanation..."
                            className="min-h-[100px] text-base resize-y focus:ring-primary focus:border-primary rounded-md shadow-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                     <Button type="button" variant="ghost" onClick={() => {setShowFeedbackInput(false); feedbackForm.reset();}} disabled={isSubmittingFeedback}>
                        Cancel
                     </Button>
                    <Button type="submit" disabled={isSubmittingFeedback}>
                      {isSubmittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FeedbackMessageIcon className="mr-2 h-4 w-4" />}
                      Submit Feedback
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {feedbackSubmitted && (
               <p className="text-sm text-green-600 dark:text-green-400 font-medium">Thank you for your feedback!</p>
            )}

            <Separator />

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Your Additional Notes</h3>
              <Textarea
                placeholder="Type or paste your notes based on the explanation above..."
                className="min-h-[150px] text-base resize-y focus:ring-primary focus:border-primary rounded-md shadow-sm"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                disabled={!currentUser || authLoading}
              />
               {!currentUser && !authLoading && (
                <p className="text-sm text-muted-foreground mt-2">
                  <Link href="/login" className="text-primary hover:underline">Login</Link> to save your notes.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-6 border-t bg-card">
            {currentUser && !authLoading ? (
              <Button 
                onClick={handleSaveNote} 
                variant="default" 
                className="w-full sm:w-auto ml-auto shadow-md hover:shadow-lg transition-shadow duration-200"
                disabled={isSavingNote || !currentQuestion || !explanation} 
              >
                {isSavingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Question &amp; Your Notes
              </Button>
            ) : authLoading ? (
                <Button className="w-full sm:w-auto ml-auto" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                </Button>
            ): (
              <Link href="/login" passHref className="w-full sm:w-auto ml-auto">
                <Button variant="outline" className="w-full shadow-md hover:shadow-lg transition-shadow duration-200" disabled={!currentQuestion || !explanation}>
                  <LogIn className="mr-2 h-4 w-4" /> Login to Save Notes
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

    