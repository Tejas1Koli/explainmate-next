'use server';
/**
 * @fileOverview Explains a UPSC question in a clear, concise, and student-friendly manner.
 *
 * - explainUPSCQuestion - A function that handles the UPSC question explanation process.
 * - ExplainUPSCQuestionInput - The input type for the explainUPSCQuestion function.
 * - ExplainUPSCQuestionOutput - The return type for the explainUPSCQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainUPSCQuestionInputSchema = z.object({
  question: z.string().describe('The UPSC question to explain.'),
});
export type ExplainUPSCQuestionInput = z.infer<typeof ExplainUPSCQuestionInputSchema>;

const ExplainUPSCQuestionOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the UPSC question.'),
});
export type ExplainUPSCQuestionOutput = z.infer<typeof ExplainUPSCQuestionOutputSchema>;

export async function explainUPSCQuestion(input: ExplainUPSCQuestionInput): Promise<ExplainUPSCQuestionOutput> {
  return explainUPSCQuestionFlow(input);
}

const explainUPSCQuestionPrompt = ai.definePrompt({
  name: 'explainUPSCQuestionPrompt',
  input: {schema: ExplainUPSCQuestionInputSchema},
  output: {schema: ExplainUPSCQuestionOutputSchema},
  prompt: `You are an expert educator specializing in explaining complex UPSC questions in a clear, concise, and student-friendly manner.

  Question: {{{question}}}

  Generate an explanation that is easy to understand and focuses on the core concepts.
  `,
});

const explainUPSCQuestionFlow = ai.defineFlow(
  {
    name: 'explainUPSCQuestionFlow',
    inputSchema: ExplainUPSCQuestionInputSchema,
    outputSchema: ExplainUPSCQuestionOutputSchema,
  },
  async input => {
    const {output} = await explainUPSCQuestionPrompt(input);
    return output!;
  }
);
