
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel as ShadFormLabel, // Renamed to avoid conflict
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label"; // For RadioGroup labels
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Save, LogIn, ThumbsUp, ThumbsDown, MessageSquare as FeedbackMessageIcon, Code, BrainCircuit, CheckCircle, XCircle } from 'lucide-react';
import { explainSTEMConcept, ExplainSTEMConceptInput, ExplainSTEMConceptOutput, Tone } from '@/ai/flows/explain-stem-concept';
import { generateQuizFromExplanation, GenerateQuizInput, GenerateQuizOutput, QuizQuestion } from '@/ai/flows/generate-quiz-flow';
import { useToast } from '@/hooks/use-toast';
import { addSavedNote } from '@/lib/notes-storage';
import { useAuth } from '@/contexts/auth-context';
import { addFeedback } from '@/lib/feedback-storage';
import type { AddFeedbackData } from '@/lib/feedback-storage';

const explanationFormSchema = z.object({
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
  QUIZ_QUESTIONS: 'explainerQuizQuestions',
  QUIZ_TITLE: 'explainerQuizTitle',
  USER_ANSWERS: 'explainerUserAnswers',
  QUIZ_SUBMITTED: 'explainerQuizSubmitted',
  QUIZ_SCORE: 'explainerQuizScore',
  SELECTED_TONE: 'explainerSelectedTone',
};

// Define Tones array locally for UI rendering
const TonesForUI = ["normal", "genZ", "brutalHonest"] as const;


export default function QuestionExplainer() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState<boolean>(false);
  const [selectedTone, setSelectedTone] = useState<Tone>("normal");

  // Quiz state
  const [quizTitle, setQuizTitle] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState<boolean>(false);


  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  const explainerForm = useForm<z.infer<typeof explanationFormSchema>>({
    resolver: zodResolver(explanationFormSchema),
    defaultValues: {
      question: "",
    },
  });
  const questionInputValue = explainerForm.watch('question');

  const feedbackForm = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedbackText: "",
    },
  });

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedQuestionInput = sessionStorage.getItem(SESSION_STORAGE_KEYS.QUESTION_INPUT);
      if (storedQuestionInput) explainerForm.setValue('question', storedQuestionInput);

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

      const storedSelectedTone = sessionStorage.getItem(SESSION_STORAGE_KEYS.SELECTED_TONE) as Tone | null;
      if (storedSelectedTone && TonesForUI.includes(storedSelectedTone)) setSelectedTone(storedSelectedTone);

      // Quiz state loading
      const storedQuizTitle = sessionStorage.getItem(SESSION_STORAGE_KEYS.QUIZ_TITLE);
      if (storedQuizTitle) setQuizTitle(storedQuizTitle);
      const storedQuizQuestions = sessionStorage.getItem(SESSION_STORAGE_KEYS.QUIZ_QUESTIONS);
      if (storedQuizQuestions) setQuizQuestions(JSON.parse(storedQuizQuestions));
      const storedUserAnswers = sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_ANSWERS);
      if (storedUserAnswers) setUserAnswers(JSON.parse(storedUserAnswers));
      const storedQuizSubmitted = sessionStorage.getItem(SESSION_STORAGE_KEYS.QUIZ_SUBMITTED);
      if (storedQuizSubmitted) setQuizSubmitted(JSON.parse(storedQuizSubmitted));
      const storedQuizScore = sessionStorage.getItem(SESSION_STORAGE_KEYS.QUIZ_SCORE);
      if (storedQuizScore) setQuizScore(JSON.parse(storedQuizScore));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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
      sessionStorage.setItem(SESSION_STORAGE_KEYS.SELECTED_TONE, selectedTone);
      if (error !== null) sessionStorage.setItem(SESSION_STORAGE_KEYS.ERROR, error);
      else sessionStorage.removeItem(SESSION_STORAGE_KEYS.ERROR);

      // Quiz state saving
      if (quizTitle !== null) sessionStorage.setItem(SESSION_STORAGE_KEYS.QUIZ_TITLE, quizTitle);
      else sessionStorage.removeItem(SESSION_STORAGE_KEYS.QUIZ_TITLE);
      if (quizQuestions !== null) sessionStorage.setItem(SESSION_STORAGE_KEYS.QUIZ_QUESTIONS, JSON.stringify(quizQuestions));
      else sessionStorage.removeItem(SESSION_STORAGE_KEYS.QUIZ_QUESTIONS);
      sessionStorage.setItem(SESSION_STORAGE_KEYS.USER_ANSWERS, JSON.stringify(userAnswers));
      sessionStorage.setItem(SESSION_STORAGE_KEYS.QUIZ_SUBMITTED, JSON.stringify(quizSubmitted));
      if (quizScore !== null) sessionStorage.setItem(SESSION_STORAGE_KEYS.QUIZ_SCORE, JSON.stringify(quizScore));
      else sessionStorage.removeItem(SESSION_STORAGE_KEYS.QUIZ_SCORE);

    }
  }, [questionInputValue, currentQuestion, explanation, userNotes, feedbackSubmitted, showFeedbackInput, showRawMarkdown, error, selectedTone, quizTitle, quizQuestions, userAnswers, quizSubmitted, quizScore]);


  const resetQuizState = useCallback((closeDialog: boolean = true) => {
    setQuizTitle(null);
    setQuizQuestions(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizError(null);
    if (closeDialog) {
      setIsQuizDialogOpen(false);
    }
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.QUIZ_TITLE);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.QUIZ_QUESTIONS);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.USER_ANSWERS);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.QUIZ_SUBMITTED);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.QUIZ_SCORE);
    }
  }, []);

  async function onSubmitExplanation(values: z.infer<typeof explanationFormSchema>) {
    setIsLoadingExplanation(true);
    setExplanation(null);
    setCurrentQuestion(values.question); 
    setUserNotes(''); 
    setError(null);
    setFeedbackSubmitted(false);
    setShowFeedbackInput(false);
    // setShowRawMarkdown(false); // Keep raw markdown view preference
    feedbackForm.reset();
    resetQuizState(true); // Reset quiz state and close dialog

    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.EXPLANATION);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.USER_NOTES);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.FEEDBACK_SUBMITTED);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.SHOW_FEEDBACK_INPUT);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.ERROR);
    }

    try {
      const input: ExplainSTEMConceptInput = { question: values.question, tone: selectedTone };
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

  const handleQuizify = async () => {
    if (!explanation) {
      toast({ title: "No Explanation", description: "Please generate an explanation first.", variant: "default" });
      return;
    }
    setIsGeneratingQuiz(true);
    setQuizError(null);
    resetQuizState(false); // Reset previous quiz state but don't close dialog yet

    try {
      const input: GenerateQuizInput = { explanation: explanation, numQuestions: 5 }; // Can add tone to quiz generation if needed
      const result: GenerateQuizOutput = await generateQuizFromExplanation(input);
      setQuizTitle(result.quizTitle);
      setQuizQuestions(result.questions);
      setIsQuizDialogOpen(true); // Open the dialog after successfully generating questions
    } catch (err) {
      console.error("Error generating quiz:", err);
      let errorMessage = "Failed to generate quiz. Please try again later.";
      if (err instanceof Error) {
        errorMessage = `An error occurred: ${err.message}. Please try again.`;
      }
      setQuizError(errorMessage);
      toast({
        title: "Quiz Generation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!quizQuestions) return;
    let score = 0;
    quizQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    toast({
      title: "Quiz Submitted!",
      description: `You scored ${score} out of ${quizQuestions.length}.`,
    });
  };

  const handleCloseQuizDialog = () => {
    resetQuizState(true);
  };

  const toneMapping: { [key in Tone]: string } = {
    normal: "Normal",
    genZ: "Gen Z ✨",
    brutalHonest: "Brutal Honest 🔪"
  };

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
          <Form {...explainerForm}>
            <form onSubmit={explainerForm.handleSubmit(onSubmitExplanation)} className="space-y-6">
              <FormField
                control={explainerForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <ShadFormLabel className="text-base font-semibold text-foreground">Your Question/Concept:</ShadFormLabel>
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
              <FormItem className="space-y-3">
                <ShadFormLabel className="text-base font-semibold text-foreground">Choose Explanation Tone:</ShadFormLabel>
                <RadioGroup
                  value={selectedTone}
                  onValueChange={(value) => setSelectedTone(value as Tone)}
                  className="flex flex-col sm:flex-row gap-2 sm:gap-4"
                >
                  {TonesForUI.map((tone) => (
                    <FormItem key={tone} className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={tone} id={`tone-${tone}`} />
                      </FormControl>
                      <Label htmlFor={`tone-${tone}`} className="font-normal cursor-pointer">
                        {toneMapping[tone]}
                      </Label>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormItem>

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
              <CardTitle className="text-2xl font-semibold text-primary">AI-Generated Explanation ({toneMapping[selectedTone]})</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                  className="whitespace-nowrap"
                >
                  <Code className="mr-2 h-4 w-4" />
                  {showRawMarkdown ? "View Rendered" : "View Raw"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleQuizify}
                  disabled={isGeneratingQuiz || !explanation}
                  className="whitespace-nowrap"
                >
                  {isGeneratingQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  Quizify
                </Button>
              </div>
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

            {!feedbackSubmitted && !showFeedbackInput && (
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
                        <ShadFormLabel className="text-base font-semibold text-foreground">Your Feedback:</ShadFormLabel>
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

      {isGeneratingQuiz && !isQuizDialogOpen && (
        <Card className="shadow-xl rounded-xl border-border/80 mt-6">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Generating your quiz...</p>
          </CardContent>
        </Card>
      )}

      {quizError && !isGeneratingQuiz && !isQuizDialogOpen && (
        <Card className="shadow-lg rounded-xl border-destructive bg-destructive/5 mt-6">
          <CardHeader className="p-4">
            <CardTitle className="text-destructive text-lg font-semibold flex items-center">
              <AlertCircle className="inline-block mr-2 h-5 w-5" />
              Quiz Generation Error
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-destructive-foreground opacity-90">{quizError}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isQuizDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseQuizDialog();
          }
          setIsQuizDialogOpen(open);
        }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-primary">
              {quizTitle || "Test Your Knowledge"}
            </DialogTitle>
            {quizSubmitted && quizScore !== null && quizQuestions && (
                 <DialogDescription className="text-lg">
                    Your Score: <span className="font-bold text-primary">{quizScore}</span> / {quizQuestions.length}
                 </DialogDescription>
            )}
            {isGeneratingQuiz && (
                 <DialogDescription className="text-lg flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    Generating quiz...
                 </DialogDescription>
            )}
            {quizError && (
                <DialogDescription className="text-destructive text-sm pt-2">
                    <AlertCircle className="inline-block mr-1 h-4 w-4" />
                    {quizError}
                </DialogDescription>
            )}
          </DialogHeader>

          {quizQuestions && quizQuestions.length > 0 && !isGeneratingQuiz && (
            <div className="space-y-4 overflow-y-auto py-2 pr-2 flex-grow">
              {quizQuestions.map((q, index) => (
                <Card key={q.id} className="pt-4 border shadow-md rounded-lg">
                  <CardContent>
                    <p className="font-semibold mb-3 text-foreground">{index + 1}. {q.questionText}</p>
                    <RadioGroup
                      onValueChange={(value) => handleAnswerSelect(q.id, parseInt(value))}
                      value={userAnswers[q.id]?.toString()}
                      disabled={quizSubmitted}
                    >
                      {q.options.map((option, optIndex) => {
                        const isCorrect = optIndex === q.correctAnswerIndex;
                        const isSelected = userAnswers[q.id] === optIndex;
                        let optionStyle = "text-foreground";
                        let indicatorIcon = null;

                        if (quizSubmitted) {
                          if (isCorrect) {
                            optionStyle = "text-green-600 dark:text-green-500 font-medium";
                            indicatorIcon = <CheckCircle className="h-5 w-5 text-green-500" />;
                          } else if (isSelected && !isCorrect) {
                            optionStyle = "text-red-600 dark:text-red-500 font-medium";
                            indicatorIcon = <XCircle className="h-5 w-5 text-red-500" />;
                          }
                        }

                        return (
                          <div key={optIndex} className="flex items-center space-x-3 space-y-0 mb-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={optIndex.toString()} id={`${q.id}-opt${optIndex}-dialog`} />
                            <Label htmlFor={`${q.id}-opt${optIndex}-dialog`} className={`font-normal flex-1 cursor-pointer ${optionStyle}`}>
                              {option}
                            </Label>
                            {quizSubmitted && indicatorIcon && (
                              <div className="ml-auto">{indicatorIcon}</div>
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                    {quizSubmitted && q.explanationForCorrectAnswer && userAnswers[q.id] !== q.correctAnswerIndex && (
                       <div className="mt-2 p-2 text-sm bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
                          <p className="font-semibold text-blue-700 dark:text-blue-300">Explanation:</p>
                          <p className="text-blue-600 dark:text-blue-400">{q.explanationForCorrectAnswer}</p>
                       </div>
                    )}
                     {quizSubmitted && q.explanationForCorrectAnswer && userAnswers[q.id] === q.correctAnswerIndex && (
                       <div className="mt-2 p-2 text-sm bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md">
                          <p className="text-green-600 dark:text-green-400">{q.explanationForCorrectAnswer}</p>
                       </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <DialogFooter className="pt-4">
            {quizQuestions && quizQuestions.length > 0 && !isGeneratingQuiz && !quizSubmitted && (
              <Button onClick={handleSubmitQuiz} className="w-full sm:w-auto" disabled={Object.keys(userAnswers).length !== quizQuestions.length}>
                Submit Quiz
              </Button>
            )}
            {quizSubmitted && (
              <Button onClick={handleCloseQuizDialog} variant="outline" className="w-full sm:w-auto">
                Close & Try Another Quiz
              </Button>
            )}
             {!quizQuestions && !isGeneratingQuiz && !quizError && (
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
