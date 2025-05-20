
'use server';
/**
 * @fileOverview Generates a multiple-choice quiz from a given explanation text, with a Gen Z flavor.
 *
 * - generateQuizFromExplanation - A function that handles the quiz generation process.
 * - GenerateQuizInput - The input type for the generateQuizFromExplanation function.
 * - GenerateQuizOutput - The return type for the generateQuizFromExplanation function.
 * - QuizQuestion - The structure for a single quiz question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for a single quiz question
const QuizQuestionSchema = z.object({
  id: z.string().describe('A unique identifier for the question (e.g., "q1", "q2").'),
  questionText: z.string().describe('The text of the multiple-choice question, make it sound engaging for Gen Z!'),
  options: z.array(z.string()).length(4).describe('An array of exactly four string options for the question. Maybe throw in a slightly silly but plausible distractor?'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer in the options array.'),
  explanationForCorrectAnswer: z.string().optional().describe('A brief explanation for why the correct answer is correct, shown after the quiz is submitted. Keep it short and snappy!'),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// Schema for the input to the quiz generation flow
const GenerateQuizInputSchema = z.object({
  explanation: z.string().describe('The text content of the explanation (already in Gen Z tone) from which to generate the quiz.'),
  numQuestions: z.number().min(1).max(10).default(5).describe('The number of questions to generate for the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Schema for the output of the quiz generation flow
const GenerateQuizOutputSchema = z.object({
  quizTitle: z.string().describe('A catchy and fun title for the generated quiz, Gen Z style! (e.g., "STEM Glow Up Check ✨", "Big Brain Energy Quiz 🧠").'),
  questions: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

// Exported function to be called by the frontend
export async function generateQuizFromExplanation(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `Alright bestie, it's quiz time! 💅 You're tasked with creating a super engaging multiple-choice quiz based on the provided explanation text.
The vibe is fun, a little cheeky, and definitely Gen Z. This quiz should help users check their understanding, not make them feel like they're failing a pop quiz. 😅

Explanation Text (already in Gen Z tone):
-------------------
{{{explanation}}}
-------------------

Your mission, should you choose to accept it (you kinda have to, lol):
1.  Whip up exactly {{{numQuestions}}} multiple-choice questions.
2.  Each question needs 4 options. Make 'em good! Maybe one option is a bit of a troll, but still plausible? 🤔
3.  Clearly mark the correct answer with its 0-based index. No cap.
4.  Come up with a quiz title that's fire. Something like "Are You a STEM Main Character?" or "Physics Rizs Check". ✨
5.  Give each question a unique 'id' (like "q1", "q2", ... "q{{{numQuestions}}}").
6.  For each question, if you can, add a short and sweet 'explanationForCorrectAnswer'. This pops up after they take the quiz, so make it clear why the right answer is the right answer. Periodt.

Focus on the main points, the big ideas, and anything that was highlighted in the explanation.
Keep the questions clear, not sus. Make them relevant to the text provided. Let's gooo! 🚀
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const {output} = await generateQuizPrompt(input);
    if (!output) {
      throw new Error("Failed to generate quiz. The AI model did not return an output. Big L.");
    }
    output.questions.forEach((q, index) => {
      if (!q.id) {
        q.id = `q${index + 1}`;
      }
    });
    return output;
  }
);

