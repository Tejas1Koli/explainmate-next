'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { explainUPSCQuestion, ExplainUPSCQuestionInput, ExplainUPSCQuestionOutput } from '@/ai/flows/explain-upsc-question';

const formSchema = z.object({
  question: z.string()
    .min(10, "Question must be at least 10 characters.")
    .max(2000, "Question must be at most 2000 characters."),
});

export default function QuestionExplainer() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setExplanation(null);
    setError(null);
    try {
      const input: ExplainUPSCQuestionInput = { question: values.question };
      const result: ExplainUPSCQuestionOutput = await explainUPSCQuestion(input);
      setExplanation(result.explanation);
    } catch (err) {
      console.error("Error fetching explanation:", err);
      let errorMessage = "Failed to generate explanation. Please check your connection or try again later.";
      if (err instanceof Error) {
        // Potentially check for specific error messages from Genkit if available
        // For now, a generic message based on error type
        errorMessage = `An error occurred: ${err.message}. Please try again.`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
            Enter your UPSC-related question and get a clear, concise explanation.
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
                        placeholder="e.g., Discuss the socio-economic impact of Green Revolution in India."
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
            <CardTitle className="text-destructive text-lg font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 h-5 w-5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-destructive-foreground opacity-90">{error}</p>
          </CardContent>
        </Card>
      )}

      {explanation && (
        <Card className="shadow-xl rounded-xl border-border/80">
          <CardHeader className="bg-card p-6">
            <CardTitle className="text-2xl font-semibold text-primary">AI-Generated Explanation</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed text-base selection:bg-primary/20">
              {explanation}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
