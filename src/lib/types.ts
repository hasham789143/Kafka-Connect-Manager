export type Task = {
  id: number;
  state: 'RUNNING' | 'PAUSED' | 'FAILED';
  worker_id: string;
  trace?: string;
};

export type ConnectorStatus = 'RUNNING' | 'PAUSED' | 'FAILED' | 'UNASSIGNED';

export type ConnectorType = 'source' | 'sink';

export type Connector = {
  id: string;
  name: string;
  status: ConnectorStatus;
  type: ConnectorType;
  plugin: string;
  topics: string[];
  tasks: Task[];
  config: Record<string, string>;
  errorMessage?: string;
};
