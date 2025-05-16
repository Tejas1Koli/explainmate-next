
'use server';
/**
 * @fileOverview Explains a STEM concept or question in a clear, concise, and student-friendly manner, using Markdown and LaTeX for formatting.
 *
 * - explainSTEMConcept - A function that handles the STEM concept explanation process.
 * - ExplainSTEMConceptInput - The input type for the explainSTEMConcept function.
 * - ExplainSTEMConceptOutput - The return type for the explainSTEMConcept function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainSTEMConceptInputSchema = z.object({
  question: z.string().describe('The STEM concept or question to explain.'),
});
export type ExplainSTEMConceptInput = z.infer<typeof ExplainSTEMConceptInputSchema>;

const ExplainSTEMConceptOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the STEM concept or question, formatted in Markdown with LaTeX for math, including points, bold, italics, and headings.'),
});
export type ExplainSTEMConceptOutput = z.infer<typeof ExplainSTEMConceptOutputSchema>;

export async function explainSTEMConcept(input: ExplainSTEMConceptInput): Promise<ExplainSTEMConceptOutput> {
  return explainSTEMConceptFlow(input);
}

const explainSTEMConceptPrompt = ai.definePrompt({
  name: 'explainSTEMConceptPrompt',
  input: {schema: ExplainSTEMConceptInputSchema},
  output: {schema: ExplainSTEMConceptOutputSchema},
  prompt: `You are an expert STEM educator specializing in explaining complex Science, Technology, Engineering, and Mathematics (STEM) concepts in a clear, concise, and student-friendly manner.
  Please explain the following STEM concept or question.

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

const explainSTEMConceptFlow = ai.defineFlow(
  {
    name: 'explainSTEMConceptFlow',
    inputSchema: ExplainSTEMConceptInputSchema,
    outputSchema: ExplainSTEMConceptOutputSchema,
  },
  async input => {
    const {output} = await explainSTEMConceptPrompt(input);
    return output!;
  }
);
