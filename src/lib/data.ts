import type { Connector } from './types';

export const connectors: Connector[] = [
  {
    id: 'jdbc-source-postgres-01',
    name: 'jdbc-source-postgres-01',
    status: 'RUNNING',
    type: 'source',
    plugin: 'io.confluent.connect.jdbc.JdbcSourceConnector',
    topics: ['orders', 'customers'],
    tasks: [
      { id: 0, state: 'RUNNING', worker_id: 'connect-worker-1' },
      { id: 1, state: 'RUNNING', worker_id: 'connect-worker-2' },
    ],
    config: {
      'connector.class': 'io.confluent.connect.jdbc.JdbcSourceConnector',
      'connection.url': 'jdbc:postgresql://postgres:5432/kafka_connect_db',
      'mode': 'incrementing',
      'incrementing.column.name': 'id',
      'topic.prefix': 'postgres-',
    },
  },
  {
    id: 's3-sink-connector-01',
    name: 's3-sink-connector-01',
    status: 'RUNNING',
    type: 'sink',
    plugin: 'io.confluent.connect.s3.S3SinkConnector',
    topics: ['user-activity'],
    tasks: [
      { id:0, state: 'RUNNING', worker_id: 'connect-worker-3' },
    ],
    config: {
      'connector.class': 'io.confluent.connect.s3.S3SinkConnector',
      's3.bucket.name': 'my-kafka-bucket',
      'topics': 'user-activity',
      'format.class': 'io.confluent.connect.s3.format.json.JsonFormat',
    },
  },
  {
    id: 'elasticsearch-sink-02',
    name: 'elasticsearch-sink-02',
    status: 'FAILED',
    type: 'sink',
    plugin: 'io.confluent.connect.elasticsearch.ElasticsearchSinkConnector',
    topics: ['product-reviews'],
    tasks: [
      { id: 0, state: 'FAILED', worker_id: 'connect-worker-1', trace: 'org.apache.kafka.connect.errors.ConnectException: Exiting ElasticsearchSinkTask due to fatal error' }
    ],
    config: {
      'connector.class': 'io.confluent.connect.elasticsearch.ElasticsearchSinkConnector',
      'connection.url': 'http://elasticsearch:9200',
      'type.name': '_doc',
      'topics': 'product-reviews'
    },
    errorMessage: "org.apache.kafka.connect.errors.ConnectException: Couldn't connect to server. Check connection.url. Caused by: java.net.ConnectException: Connection refused",
  },
  {
    id: 'datagen-source-customers',
    name: 'datagen-source-customers',
    status: 'PAUSED',
    type: 'source',
    plugin: 'io.confluent.kafka.connect.datagen.DatagenConnector',
    topics: ['generated-customers'],
    tasks: [
       { id: 0, state: 'PAUSED', worker_id: 'connect-worker-2' },
    ],
    config: {
        'connector.class': 'io.confluent.kafka.connect.datagen.DatagenConnector',
        'kafka.topic': 'generated-customers',
        'quickstart': 'customers',
        'max.interval': '1000'
    }
  },
  {
    id: 'another-jdbc-source',
    name: 'another-jdbc-source',
    status: 'RUNNING',
    type: 'source',
    plugin: 'io.confluent.connect.jdbc.JdbcSourceConnector',
    topics: ['inventory'],
    tasks: [
      { id: 0, state: 'RUNNING', worker_id: 'connect-worker-3' },
    ],
    config: {
      'connector.class': 'io.confluent.connect.jdbc.JdbcSourceConnector',
      'connection.url': 'jdbc:mysql://mysql:3306/inventory_db',
      'mode': 'timestamp',
      'timestamp.column.name': 'updated_at',
      'topic.prefix': 'mysql-',
    },
  },
];

export async function getConnectors(): Promise<Connector[]> {
  // In a real app, you'd fetch this from your Cloud SQL database
  return new Promise(resolve => setTimeout(() => resolve(connectors), 500));
}
