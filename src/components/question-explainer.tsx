
'use client';

import { useState } from 'react';
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
import { Loader2, AlertCircle, Save, LogIn, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { explainUPSCQuestion, ExplainUPSCQuestionInput, ExplainUPSCQuestionOutput } from '@/ai/flows/explain-upsc-question';
import { useToast } from '@/hooks/use-toast';
import { addSavedNote } from '@/lib/notes-storage';
import { useAuth } from '@/contexts/auth-context';
import { addFeedback } from '@/lib/feedback-storage';

const formSchema = z.object({
  question: z.string()
    .min(10, "Question must be at least 10 characters.")
    .max(2000, "Question must be at most 2000 characters."),
});

const feedbackFormSchema = z.object({
  feedbackText: z.string().min(10, "Feedback must be at least 10 characters.").max(1000, "Feedback must be at most 1000 characters."),
});

export default function QuestionExplainer() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  const feedbackForm = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedbackText: "",
    },
  });

  async function onSubmitExplanation(values: z.infer<typeof formSchema>) {
    setIsLoadingExplanation(true);
    setExplanation(null);
    setCurrentQuestion(values.question);
    setUserNotes(''); 
    setError(null);
    setFeedbackSubmitted(false);
    setShowFeedbackInput(false);
    setFeedbackText('');

    try {
      // Note: The flow is named explainUPSCQuestion, but the app is now ExplainMate AI.
      // This flow might need to be generalized if the app's scope is broader than UPSC.
      const input: ExplainUPSCQuestionInput = { question: values.question };
      const result: ExplainUPSCQuestionOutput = await explainUPSCQuestion(input);
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
    setIsSavingNote(true);
    // const questionText = form.getValues("question"); // This is currentQuestion
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
    await addFeedback({
      userId: currentUser?.uid,
      question: currentQuestion,
      explanation: explanation,
      isHelpful: true,
    });
    setFeedbackSubmitted(true);
    setShowFeedbackInput(false);
    setIsSubmittingFeedback(false);
    toast({ title: "Feedback Received", description: "Thank you for your feedback!" });
  };

  const handleNotHelpfulClick = () => {
    setShowFeedbackInput(true);
    setFeedbackSubmitted(false); // Allow submitting new feedback if they first said helpful
  };
  
  async function onFeedbackSubmit(values: z.infer<typeof feedbackFormSchema>) {
    if (!currentQuestion || !explanation) return;
    setIsSubmittingFeedback(true);
    await addFeedback({
      userId: currentUser?.uid,
      question: currentQuestion,
      explanation: explanation,
      isHelpful: false,
      feedbackText: values.feedbackText,
    });
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
            Enter your question and get a clear, concise explanation with rich formatting from ExplainMate AI.
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
                    <FormLabel className="text-base font-semibold text-foreground">Your Question:</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Discuss the socio-economic impact of Green Revolution in India, including relevant formulas like $y = mx + c$."
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

      {error && (
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
            <CardTitle className="text-2xl font-semibold text-primary">AI-Generated Explanation</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <article className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none selection:bg-primary/20">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {explanation}
              </ReactMarkdown>
            </article>
            
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
                      {isSubmittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
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
                disabled={isSavingNote || !currentQuestion} // Also disable if no question was processed
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
                <Button variant="outline" className="w-full shadow-md hover:shadow-lg transition-shadow duration-200" disabled={!currentQuestion}>
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
