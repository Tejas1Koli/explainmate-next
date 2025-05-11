'use server';
/**
 * @fileOverview Explains a UPSC question in a clear, concise, and student-friendly manner, using Markdown and LaTeX for formatting.
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
  explanation: z.string().describe('The explanation of the UPSC question, formatted in Markdown with LaTeX for math, including points, bold, italics, and headings.'),
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

  Your explanation should be well-structured and easy to read. Use the following formatting guidelines:
  - **Headings**: Use Markdown headings (e.g., \`# Main Topic\`, \`## Sub-topic\`) to structure the explanation. Start with H2 or H3 for main sections within the explanation.
  - **Emphasis**: Use bold (\`**text**\`) for key terms or important points, and italics (\`*text*\`) for emphasis or foreign words.
  - **Lists**: Structure detailed points using bullet points (\`- point\`) or numbered lists (\`1. point\`).
  - **Mathematical Expressions**: For any mathematical formulas, equations, or symbols, use LaTeX.
    - For **inline** LaTeX, enclose it in single dollar signs: \`$...$\`. For example: The equation is $E = mc^2$.
    - For **block-level** LaTeX equations (displayed on their own line), enclose them in double dollar signs: \`$$...$$\`. For example:
      $$
      \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
      $$
  - **Clarity**: Ensure the language is easy for a student to understand.

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
