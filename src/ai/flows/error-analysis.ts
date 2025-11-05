// ErrorAnalysis flow implementation.
'use server';

/**
 * @fileOverview An AI agent that analyzes Kafka connector errors and provides potential solutions.
 *
 * - analyzeError - a function that takes an error message and returns potential solutions.
 * - ErrorAnalysisInput - The input type for the analyzeError function.
 * - ErrorAnalysisOutput - The return type for the analyzeError function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ErrorAnalysisInputSchema = z.object({
  errorMessage: z.string().describe('The error message from the Kafka connector.'),
});
export type ErrorAnalysisInput = z.infer<typeof ErrorAnalysisInputSchema>;

const ErrorAnalysisOutputSchema = z.object({
  solutions: z.string().describe('Potential solutions for the Kafka connector error.'),
});
export type ErrorAnalysisOutput = z.infer<typeof ErrorAnalysisOutputSchema>;

export async function analyzeError(input: ErrorAnalysisInput): Promise<ErrorAnalysisOutput> {
  return errorAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'errorAnalysisPrompt',
  input: {schema: ErrorAnalysisInputSchema},
  output: {schema: ErrorAnalysisOutputSchema},
  prompt: `You are an expert Kafka Connect administrator. A user has provided the following error message from a Kafka connector. Analyze the error message and provide potential solutions in natural language.\n\nError Message: {{{errorMessage}}}`,
});

const errorAnalysisFlow = ai.defineFlow(
  {
    name: 'errorAnalysisFlow',
    inputSchema: ErrorAnalysisInputSchema,
    outputSchema: ErrorAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
