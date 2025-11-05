
import type { Connector, ConnectorStatus, Task } from './types';

export type KafkaConnectConfig = {
  url: string;
  username?: string;
  password?: string;
};

const CLUSTER_PATH = '/clusters/local';

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
      if (response.status === 406) {
        return { error: `Failed to fetch from Kafka Connect API at ${endpoint}. Status: ${response.status} (Not Acceptable). The server cannot provide a response in the requested format.` };
      }
      return { error: `Failed to fetch from Kafka Connect API at ${endpoint}. Status: ${response.status}.` };
    }
    
    if (response.headers.get('content-type')?.includes('application/json')) {
        return { data: await response.json() };
    }
    return { data: await response.text() };

  } catch (e: any) {
    console.error(`Network error when fetching from ${endpoint}:`, e);
    
    const cause = e.cause as any;
    if (cause?.code === 'ECONNRESET') {
        return { error: `The connection to the Kafka Connect API at ${url} was reset. This can happen if the server is under heavy load or has a connection limit. Error: ${cause.code}` };
    }
    if (cause?.code === 'ENOTFOUND') {
        return { error: `Could not resolve the address for the Kafka Connect API at ${url}. Please check the URL and your network connection.` };
    }
    if (e instanceof TypeError && e.message.includes('fetch failed')) {
       return { error: `Network error when fetching from ${url}. The host may be down, or a firewall may be blocking the connection.`};
    }
    return { error: `Could not connect to Kafka Connect API at ${url}. Please check if the service is running and accessible.` };
  }
}

export async function getConnectors(config: KafkaConnectConfig): Promise<{ connectors?: Connector[], error?: string }> {
  const response = await fetchFromConnect(`${CLUSTER_PATH}/connectors?expand=status&expand=info`, config);

  if (response.error || !response.data) {
    return { error: response.error || 'Failed to fetch connectors.' };
  }

  const data = response.data;
  const connectorNames = Object.keys(data);
  const connectors: Connector[] = [];

  for (const name of connectorNames) {
    const connectorData = data[name];
    const status = connectorData.status;
    const info = connectorData.info;

    // A connector might not have status or info if it's in a strange state.
    if (!status || !info || !status.connector) {
        console.warn(`Skipping connector ${name} due to missing status or info`);
        continue;
    }

    const tasks: Task[] = (status.tasks || []).map((task: any) => ({
      id: task.id,
      state: task.state,
      worker_id: task.worker_id,
      trace: task.trace,
    }));

    const failedTasks = tasks.filter(t => t.state === 'FAILED');
    const errorMessage = failedTasks.length > 0 ? failedTasks.map(t => t.trace).join('\n') : undefined;

    connectors.push({
      id: name,
      name: name,
      status: status.connector.state as ConnectorStatus,
      type: status.type,
      plugin: info.config['connector.class'],
      tasks: tasks,
      config: info.config,
      errorMessage: errorMessage,
      topics: info.config['topics']?.split(',') || [],
    });
  }

  return { connectors };
}
