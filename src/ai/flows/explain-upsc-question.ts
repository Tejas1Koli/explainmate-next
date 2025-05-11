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
  explanation: z.string().describe('The explanation of the UPSC question, formatted in points.'),
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
  Please explain the core concepts related to the following UPSC question.
  Structure your explanation using bullet points or a numbered list for better clarity and readability.
  Ensure the language is easy for a student to understand.

  Question: {{{question}}}
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
