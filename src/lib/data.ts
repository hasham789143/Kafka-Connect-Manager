import type { Connector, ConnectorStatus, Task } from './types';

async function fetchFromConnect(endpoint: string) {
  const url = process.env.KAFKA_CONNECT_URL;
  const username = process.env.KAFKA_CONNECT_USERNAME;
  const password = process.env.KAFKA_CONNECT_PASSWORD;

  if (!url) {
    console.error('KAFKA_CONNECT_URL is not defined in the environment variables.');
    return { error: 'Kafka Connect URL is not configured.' };
  }

  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (username && password) {
    headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`);
  }

  try {
    const response = await fetch(`${url}${endpoint}`, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch from ${endpoint}: ${response.status} ${response.statusText}`, errorText);
       if (response.status === 403) {
        return { error: `Connection to Kafka Connect API at ${url} was forbidden. Please check network access and credentials.` };
      }
      return { error: `Failed to fetch from Kafka Connect API at ${endpoint}. Status: ${response.status}.` };
    }
    
    try {
      return { data: await response.json() };
    } catch(e) {
      // The GIST of this is that the kafka connect API sometimes returns non-json on success
      return { data: await response.text() };
    }
  } catch (e: any) {
    console.error(`Network error when fetching from ${endpoint}:`, e);
    return { error: `Could not connect to Kafka Connect API at ${url}. Please check if the service is running and accessible.` };
  }
}

export async function getConnectors(): Promise<{ connectors?: Connector[], error?: string }> {
  const connectorsResponse = await fetchFromConnect('/connectors');

  if (connectorsResponse.error) {
    return { error: connectorsResponse.error };
  }
  const connectorNames = connectorsResponse.data;

  const connectorDetailsPromises = Object.keys(connectorNames).map(async (name: string) => {
    const statusResponse = await fetchFromConnect(`/connectors/${name}/status`);
    if (statusResponse.error) return { id: name, name, error: statusResponse.error };
    const configResponse = await fetchFromConnect(`/connectors/${name}/config`);
    if (configResponse.error) return { id: name, name, error: configResponse.error };

    const status = statusResponse.data;
    const config = configResponse.data;

    const tasks: Task[] = status.tasks.map((task: any) => ({
      id: task.id,
      state: task.state,
      worker_id: task.worker_id,
      trace: task.trace,
    }));
    
    const failedTasks = tasks.filter(t => t.state === 'FAILED');

    return {
      id: name,
      name: status.name,
      status: status.connector.state as ConnectorStatus,
      type: status.type,
      plugin: config['connector.class'],
      tasks: tasks,
      config: config,
      errorMessage: failedTasks.length > 0 ? failedTasks.map(t => t.trace).join('\n') : undefined,
      topics: status.tasks.flatMap((t: any) => t.topics || []),
    };
  });

  const connectors = await Promise.all(connectorDetailsPromises);
  const firstError = connectors.find(c => (c as any).error);
  if (firstError) {
      return { error: (firstError as any).error };
  }

  return { connectors: connectors as Connector[] };
}
