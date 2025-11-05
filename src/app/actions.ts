'use server';

import { analyzeError } from '@/ai/flows/error-analysis';
import { getConnectors, KafkaConnectConfig, testConnection, createConnector, exportConnectors } from '@/lib/data';
import { Connector } from './lib/types';

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

export async function createConnectorAction(config: KafkaConnectConfig, name: string, connectorConfig: any) {
    const { error } = await createConnector(config, name, connectorConfig);
    if (error) {
        return { success: false, error };
    }
    return { success: true };
}

export async function exportConnectorsAction(config: KafkaConnectConfig): Promise<{ data?: string, error?: string }> {
    const { connectors, error } = await getConnectors(config);
    if (error) {
        return { error };
    }
    const exportData = await exportConnectors(config, connectors?.map(c => c.name) || []);
    if (exportData.error) {
        return { error: exportData.error };
    }
    return { data: JSON.stringify(exportData.configs, null, 2) };
}

export async function importConnectorsAction(config: KafkaConnectConfig, connectorsToImport: { name: string, config: any }[]) {
  const results = [];
  for (const connector of connectorsToImport) {
    const { error } = await createConnector(config, connector.name, connector.config);
    results.push({ name: connector.name, success: !error, error });
  }
  return results;
}
