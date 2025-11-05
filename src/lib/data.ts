
import type { Connector, ConnectorStatus, ConnectorType, Task, DashboardStats } from './types';

export type KafkaConnectConfig = {
  url: string;
  username?: string;
  password?: string;
};

const CLUSTER_PATH = '/clusters/local';

async function fetchFromConnect(endpoint: string, config: KafkaConnectConfig, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
  const { url, username, password } = config;

  if (!url) {
    console.error('KAFKA_CONNECT_URL is not defined.');
    return { error: 'Kafka Connect URL is not configured.' };
  }

  const headers: HeadersInit = {
    'Accept': 'application/json, text/plain, */*',
  };
   if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  if (username && password) {
    headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`);
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}${endpoint}`, { 
        method,
        headers, 
        cache: 'no-store',
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch from ${endpoint}: ${response.status} ${response.statusText}`, errorText);
       if (response.status === 401) {
        return { error: `Authentication failed. Please check your username and password.` };
      }
      if (response.status === 403) {
        return { error: `Connection forbidden. You do not have permission to access the Kafka Connect API.` };
      }
      if (response.status === 406) {
        return { error: `Failed to fetch from Kafka Connect API at ${endpoint}. Status: ${response.status} (Not Acceptable). The server cannot provide a response in the requested format.` };
      }
      try {
        const errorJson = JSON.parse(errorText);
        return { error: errorJson.message || `Failed to fetch from Kafka Connect API at ${endpoint}. Status: ${response.status}.` };
      } catch (e) {
        return { error: `Failed to fetch from Kafka Connect API at ${endpoint}. Status: ${response.status}.` };
      }
    }
    
    if (endpoint === '/' || endpoint === '') {
        return { data: {} };
    }
    
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { data: {} };
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

export async function testConnection(config: KafkaConnectConfig): Promise<{ error?: string }> {
    const response = await fetchFromConnect('', config);
    return { error: response.error };
}


export async function getConnectors(config: KafkaConnectConfig): Promise<{ connectors?: Connector[], stats?: DashboardStats, error?: string }> {
  const response = await fetchFromConnect(`${CLUSTER_PATH}/connectors?expand=status&expand=info`, config);

  if (response.error || !response.data) {
    return { error: response.error || 'Failed to fetch connectors.' };
  }

  const data = response.data;
  const connectorNames = Object.keys(data);
  const connectors: Connector[] = [];
  let failedConnectors = 0;
  let failedTasks = 0;

  for (const name of connectorNames) {
    const connectorData = data[name];
    const status = connectorData.status;
    const info = connectorData.info;

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
    
    const connectorStatus = status.connector.state as ConnectorStatus;
    if (connectorStatus === 'FAILED') {
      failedConnectors++;
    }

    tasks.forEach(task => {
        if (task.state === 'FAILED') {
            failedTasks++;
        }
    });

    const hasFailedTasks = tasks.some(t => t.state === 'FAILED');
    const errorMessage = hasFailedTasks ? tasks.filter(t => t.state === 'FAILED').map(t => t.trace).join('\n') : undefined;

    connectors.push({
      id: name,
      name: name,
      status: connectorStatus,
      type: info.type as ConnectorType,
      plugin: info.config['connector.class'],
      tasks: tasks,
      config: info.config,
      errorMessage: errorMessage,
      topics: info.config['topics']?.split(',') || [],
    });
  }

  const stats: DashboardStats = {
    totalConnectors: connectors.length,
    failedConnectors: failedConnectors,
    failedTasks: failedTasks,
  };

  return { connectors, stats };
}

export async function createConnector(config: KafkaConnectConfig, name: string, connectorConfig: any) {
    return fetchFromConnect(`${CLUSTER_PATH}/connectors`, config, 'POST', {
        name,
        config: connectorConfig
    });
}

export async function exportConnectors(config: KafkaConnectConfig, connectorNames: string[]): Promise<{ configs?: Record<string, any>, error?: string }> {
    const configs: Record<string, any> = {};
    for (const name of connectorNames) {
        const response = await fetchFromConnect(`${CLUSTER_PATH}/connectors/${name}/config`, config);
        if (response.error) {
            return { error: `Failed to fetch config for ${name}: ${response.error}` };
        }
        configs[name] = response.data;
    }
    return { configs };
}
