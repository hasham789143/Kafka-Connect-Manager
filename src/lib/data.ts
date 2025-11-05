import type { Connector, ConnectorStatus, Task } from './types';

export type KafkaConnectConfig = {
  url: string;
  username?: string;
  password?: string;
};

const CLUSTER_PATH = '/api/clusters/local';

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
  const connectorsResponse = await fetchFromConnect(`${CLUSTER_PATH}/connectors`, config);

  if (connectorsResponse.error || !connectorsResponse.data) {
    return { error: connectorsResponse.error || 'Failed to fetch connectors.' };
  }
  
  const connectorData = connectorsResponse.data;
  const connectorNames = Array.isArray(connectorData) ? connectorData : Object.keys(connectorData);
  
  const connectors: Connector[] = [];

  for (const name of connectorNames) {
    const statusResponse = await fetchFromConnect(`${CLUSTER_PATH}/connectors/${name}/status`, config);
    if (statusResponse.error) {
      // If one connector fails, we can choose to return what we have or fail all.
      // For now, we fail all to be safe, but we could make this more resilient.
      return { error: `Failed to get status for connector ${name}: ${statusResponse.error}` };
    }
    const configResponse = await fetchFromConnect(`${CLUSTER_PATH}/connectors/${name}/config`, config);
     if (configResponse.error) {
      return { error: `Failed to get config for connector ${name}: ${configResponse.error}` };
    }

    const status = statusResponse.data;
    const connectorConfig = configResponse.data;

    const tasks: Task[] = (status.tasks && Array.isArray(status.tasks)) ? status.tasks.map((task: any) => ({
      id: task.id,
      state: task.state,
      worker_id: task.worker_id,
      trace: task.trace,
    })) : [];
    
    const failedTasks = tasks ? tasks.filter(t => t.state === 'FAILED') : [];
    const errorMessage = (failedTasks && failedTasks.length > 0) ? failedTasks.map(t => t.trace).join('\n') : undefined;

    connectors.push({
      id: name,
      name: status.name,
      status: (status.connector?.state as ConnectorStatus) || 'UNASSIGNED',
      type: status.type,
      plugin: connectorConfig['connector.class'],
      tasks: tasks,
      config: connectorConfig,
      errorMessage: errorMessage,
      topics: status.topics || [],
    });
  }

  return { connectors };
}
