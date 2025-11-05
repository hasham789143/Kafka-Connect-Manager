'use server';

import { analyzeError } from '@/ai/flows/error-analysis';
import { getConnectors, KafkaConnectConfig, testConnection } from '@/lib/data';

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

export async function getConnectorsAction(config: KafkaConnectConfig) {
    return getConnectors(config);
}

export async function validateConnection(config: KafkaConnectConfig) {
    const { error } = await testConnection(config);
    if (error) {
        return { success: false, error };
    }
    return { success: true };
}
