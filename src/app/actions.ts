'use server';

import { analyzeError } from '@/ai/flows/error-analysis';

export async function getErrorAnalysis(errorMessage: string) {
  if (!errorMessage) {
    return { error: 'Error message is required.' };
  }

  try {
    const result = await analyzeError({ errorMessage });
    return { data: result };
  } catch (e) {
    console.error(e);
    return {
      error: 'An unexpected error occurred during analysis. Please try again later.',
    };
  }
}
