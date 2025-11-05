import type { Connector, ConnectorStatus, Task } from './types';

export type KafkaConnectConfig = {
  url: string;
  username?: string;
  password?: string;
};

async function fetchFromConnect(endpoint: string, config: KafkaConnectConfig) {
  const { url, username, password } = config;

  if (!url) {
    console.error('KAFKA_CONNECT_URL is not defined.');
    return { error: 'Kafka Connect URL is not configured.' };
  }

  const headers: HeadersInit = {
    'Accept': 'application/json, text/plain, */*',
  };

  if (username && password) {
    headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`);
  }

  try {
    const response = await fetch(`${url}${endpoint}`, { headers, cache: 'no-store' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch from ${endpoint}: ${response.status} ${response.statusText}`, errorText);
       if (response.status === 401 || response.status === 403) {
        return { error: `Connection to Kafka Connect API at ${url} was forbidden/unauthorized. Please check credentials.` };
      }
      return { error: `Failed to fetch from Kafka Connect API at ${endpoint}. Status: ${response.status}.` };
    }
    
    if (response.headers.get('content-type')?.includes('application/json')) {
        return { data: await response.json() };
    }
    return { data: await response.text() };

  } catch (e: any) {
    console.error(`Network error when fetching from ${endpoint}:`, e);
    // Check for common fetch errors
    if (e.cause?.code === 'ENOTFOUND') {
        return { error: `Could not resolve the address for the Kafka Connect API at ${url}. Please check the URL and your network connection.` };
    }
    if (e instanceof TypeError && e.message.includes('fetch failed')) {
       return { error: `Network error when fetching from ${url}. The host may be down or a firewall may be blocking the connection.`};
    }
    return { error: `Could not connect to Kafka Connect API at ${url}. Please check if the service is running and accessible.` };
  }
}

export async function getConnectors(config: KafkaConnectConfig): Promise<{ connectors?: Connector[], error?: string }> {
  const connectorsResponse = await fetchFromConnect('/connectors', config);

  if (connectorsResponse.error || !connectorsResponse.data) {
    return { error: connectorsResponse.error || 'Failed to fetch connectors.' };
  }

  // Kafka Connect returns an empty object {} if there are no connectors.
  // It returns an array of names if there are connectors. Handle both cases.
  const connectorData = connectorsResponse.data;
  const connectorNames = Array.isArray(connectorData) ? connectorData : Object.keys(connectorData);


  const connectorDetailsPromises = connectorNames.map(async (name: string) => {
    const statusResponse = await fetchFromConnect(`/connectors/${name}/status`, config);
    if (statusResponse.error) return { id: name, name, error: statusResponse.error };
    const configResponse = await fetchFromConnect(`/connectors/${name}/config`, config);
    if (configResponse.error) return { id: name, name, error: configResponse.error };

    const status = statusResponse.data;
    const connectorConfig = configResponse.data;

    const tasks: Task[] = Array.isArray(status.tasks) ? status.tasks.map((task: any) => ({
      id: task.id,
      state: task.state,
      worker_id: task.worker_id,
      trace: task.trace,
    })) : [];
    
    const failedTasks = tasks ? tasks.filter(t => t.state === 'FAILED') : [];

    return {
      id: name,
      name: status.name,
      status: status.connector?.state as ConnectorStatus,
      type: status.type,
      plugin: connectorConfig['connector.class'],
      tasks: tasks,
      config: connectorConfig,
      errorMessage: failedTasks && failedTasks.length > 0 ? failedTasks.map(t => t.trace).join('\n') : undefined,
      topics: Array.isArray(status.tasks) ? status.tasks.flatMap((t: any) => t.topics || []) : [],
    };
  });

  const connectors = await Promise.all(connectorDetailsPromises);
  const firstError = connectors.find(c => (c as any).error);
  if (firstError) {
      return { error: (firstError as any).error };
  }

  return { connectors: connectors as Connector[] };
}
