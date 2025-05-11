'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
import { Loader2, AlertCircle, Save } from 'lucide-react';
import { explainUPSCQuestion, ExplainUPSCQuestionInput, ExplainUPSCQuestionOutput } from '@/ai/flows/explain-upsc-question';
import { useToast } from '@/hooks/use-toast';
import { addSavedNote } from '@/lib/notes-storage';

const formSchema = z.object({
  question: z.string()
    .min(10, "Question must be at least 10 characters.")
    .max(2000, "Question must be at most 2000 characters."),
});

export default function QuestionExplainer() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setExplanation(null);
    setUserNotes(''); // Reset user notes when a new question is submitted
    setError(null);
    try {
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
      setIsLoading(false);
    }
  }

  function handleSaveNote() {
    const questionText = form.getValues("question");
    // userNotes is from component state. Explanation is not saved.
    const savedNote = addSavedNote(questionText, userNotes);

    if (savedNote) {
      toast({
        title: "Note Saved!",
        description: "Your question and additional notes have been saved locally.",
      });
    } else {
      toast({
        title: "Error Saving Note",
        description: "Could not save the note. LocalStorage might be unavailable or full.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-2 md:p-0 space-y-6">
      <Card className="shadow-xl rounded-xl overflow-hidden border-border/80">
        <CardHeader className="bg-card p-6">
          <CardTitle className="text-3xl font-bold text-center text-primary tracking-tight">
            UPSC Insight
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground text-md pt-1">
            Enter your UPSC-related question and get a clear, concise explanation with rich formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                disabled={isLoading} 
                className="w-full text-lg py-3 rounded-md shadow-md hover:shadow-lg transition-shadow duration-200"
                variant="default"
              >
                {isLoading ? (
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

      {explanation && !isLoading && (
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

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Your Additional Notes</h3>
              <Textarea
                placeholder="Type or paste your notes based on the explanation above..."
                className="min-h-[150px] text-base resize-y focus:ring-primary focus:border-primary rounded-md shadow-sm"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="p-6 border-t bg-card">
            <Button onClick={handleSaveNote} variant="default" className="w-full sm:w-auto ml-auto shadow-md hover:shadow-lg transition-shadow duration-200">
              <Save className="mr-2 h-4 w-4" />
              Save Question &amp; Your Notes
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
