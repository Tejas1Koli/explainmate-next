
'use server';
/**
 * @fileOverview Explains a STEM concept or question in a clear, concise, and student-friendly manner, using Markdown and LaTeX for formatting, all in a Gen Z tone.
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
  explanation: z.string().describe('The explanation of the STEM concept or question, formatted in Markdown with LaTeX for math, including points, bold, italics, headings, and a Gen Z voice. Keep it real and engaging!'),
});
export type ExplainSTEMConceptOutput = z.infer<typeof ExplainSTEMConceptOutputSchema>;

export async function explainSTEMConcept(input: ExplainSTEMConceptInput): Promise<ExplainSTEMConceptOutput> {
  return explainSTEMConceptFlow(input);
}

const explainSTEMConceptPrompt = ai.definePrompt({
  name: 'explainSTEMConceptPrompt',
  input: {schema: ExplainSTEMConceptInputSchema},
  output: {schema: ExplainSTEMConceptOutputSchema},
  prompt: `Yo! You're like, the coolest STEM tutor ever, kinda like a super smart TikTokker or YouTuber who knows how to make complex stuff make sense. 🧠✨
  Break down this STEM concept or question for a Gen Z learner. Keep it 💯, make it easy to get, and low-key fun.

  Here's the vibe for your explanation:
  - **Keep it Real**: Use relatable examples. If it's about physics, maybe compare it to a viral challenge or a game.
  - **Headings**: Use Markdown headings (like \`## Sub-topic\`) to structure the tea. Spill it section by section. Start with H2 or H3.
  - **Make it Pop**: Use bold (\`**text**\`) for the main character terms or important deets. Use italics (\`*text*\`) if you're emphasizing something or it's a bit niche.
  - **Bullet Points FTW**: If there's a list of things, use bullet points (\`- point\`) or numbered lists (\`1. point\`). Easy to scan, you know?
  - **Math Stuff (LaTeX)**: If there's math, make it look legit with LaTeX.
    - Inline math? Wrap it in single $: \`$E=mc^2$\`.
    - Big equations that need their own moment? Use double $$:
      $$
      \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
      $$
  - **Emojis (Use Sparingly)**: A well-placed emoji can add some spice, but don't overdo it. 💅🧪🔬
  - **Slang (If it Fits)**: If you can naturally drop in some Gen Z slang (like "no cap", "bet", "rizz", "iykyk", "the gag is", "periodt") and it makes sense, go for it. But if it feels forced, just skip it. Authenticity is key.
  - **Tone**: Casual, friendly, enthusiastic, and super clear. Imagine you're explaining it to a friend over boba.

  Alright, here's the question they need help with. Let's make this explanation iconic!
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

