
'use server';
/**
 * @fileOverview Generates a multiple-choice quiz from a given explanation text.
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
  questionText: z.string().describe('The text of the multiple-choice question.'),
  options: z.array(z.string()).length(4).describe('An array of exactly four string options for the question.'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer in the options array.'),
  explanationForCorrectAnswer: z.string().optional().describe('A brief explanation for why the correct answer is correct, shown after the quiz is submitted.'),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// Schema for the input to the quiz generation flow
const GenerateQuizInputSchema = z.object({
  explanation: z.string().describe('The text content of the explanation from which to generate the quiz.'),
  numQuestions: z.number().min(1).max(10).default(5).describe('The number of questions to generate for the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Schema for the output of the quiz generation flow
const GenerateQuizOutputSchema = z.object({
  quizTitle: z.string().describe('A suitable title for the generated quiz, based on the explanation content.'),
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
  prompt: `You are an AI assistant tasked with creating an engaging multiple-choice quiz based on the provided explanation text.
The quiz should help users test their understanding of the key concepts presented in the explanation.

Explanation Text:
-------------------
{{{explanation}}}
-------------------

Please generate a quiz with the following specifications:
1.  Generate exactly {{{numQuestions}}} multiple-choice questions.
2.  Each question must have exactly four options.
3.  For each question, clearly indicate the correct answer by specifying its 0-based index.
4.  Generate a suitable short title for the quiz based on the explanation's content.
5.  For each question, provide a unique 'id' (e.g., "q1", "q2", ... "q{{{numQuestions}}}").
6.  For each question, optionally provide a brief 'explanationForCorrectAnswer' that clarifies why the chosen answer is correct. This will be shown to the user after they attempt the quiz.

Focus on creating questions that test understanding of the core concepts, definitions, and implications discussed in the explanation.
The questions should be clear, unambiguous, and relevant to the provided text.
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
      throw new Error("Failed to generate quiz. The AI model did not return an output.");
    }
    // Ensure each question has a unique ID if the model didn't provide one consistently
    // Although the prompt asks for it, this is a fallback.
    output.questions.forEach((q, index) => {
      if (!q.id) {
        q.id = `q${index + 1}`;
      }
    });
    return output;
  }
);

