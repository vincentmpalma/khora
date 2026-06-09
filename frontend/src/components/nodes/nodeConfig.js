// config for every node type — defines its category, accent color, icon, default values, and editable attributes
// primaryAttr = the attribute whose options are shown as sub-items in the sidebar
export const nodeConfig = {
  'Client': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Monitor',
    primaryAttr: 'kind',
    defaults: { kind: 'Web' },
    attrOptions: {
      kind: { type: 'select', options: ['Web', 'Mobile', 'Desktop', 'IoT', 'Third-party'] },
    },
  },
  'Load Balancer': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Shuffle',
    primaryAttr: 'strategy',
    defaults: { strategy: 'Round Robin', layer: 'L7', stickySessions: 'off' },
    attrOptions: {
      strategy: { type: 'select', options: ['Round Robin', 'Weighted Round Robin', 'Least Connections', 'IP Hash'] },
      layer: { type: 'select', options: ['L4', 'L7'] },
      stickySessions: { type: 'select', options: ['on', 'off'] },
    },
  },
  'API Gateway': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Globe',
    defaults: { responsibilities: 'Routing, Auth' },
    attrOptions: {
      responsibilities: { type: 'text' },
    },
  },
  'CDN': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Wifi',
    primaryAttr: 'mode',
    defaults: { mode: 'Pull' },
    attrOptions: {
      mode: { type: 'select', options: ['Push', 'Pull'] },
    },
  },
  'Service': {
    category: 'Compute',
    color: '#22c55e',
    icon: 'Server',
    primaryAttr: 'role',
    defaults: { role: 'API Server', scaling: 'Stateless' },
    attrOptions: {
      role: { type: 'select', options: ['API Server', 'Microservice', 'Worker', 'BFF', 'Monolith'] },
      scaling: { type: 'select', options: ['Stateless / Horizontal', 'Stateful / Vertical'] },
    },
  },
  'Worker': {
    category: 'Compute',
    color: '#22c55e',
    icon: 'Cpu',
    primaryAttr: 'role',
    defaults: { role: 'Worker' },
    attrOptions: {
      role: { type: 'select', options: ['Worker', 'Cron Job', 'Background Processor'] },
    },
  },
  'SQL Database': {
    category: 'Storage',
    color: '#f97316',
    icon: 'Database',
    primaryAttr: 'replication',
    defaults: { replication: 'Primary-Replica', sharding: 'None', consistency: 'Strong' },
    attrOptions: {
      replication: { type: 'select', options: ['None', 'Primary-Replica', 'Multi-Primary'] },
      sharding: { type: 'select', options: ['None', 'Range', 'Hash', 'Consistent Hashing'] },
      consistency: { type: 'select', options: ['Strong', 'Eventual', 'Read-your-writes'] },
    },
  },
  'NoSQL Database': {
    category: 'Storage',
    color: '#f97316',
    icon: 'DatabaseZap',
    primaryAttr: 'type',
    defaults: { type: 'Document', replication: 'Primary-Replica', sharding: 'None' },
    attrOptions: {
      type: { type: 'select', options: ['Document', 'Wide-Column', 'Key-Value', 'Graph', 'Time-Series'] },
      replication: { type: 'select', options: ['None', 'Primary-Replica', 'Quorum'] },
      sharding: { type: 'select', options: ['None', 'Range', 'Hash', 'Consistent Hashing'] },
    },
  },
  'Cache': {
    category: 'Storage',
    color: '#f97316',
    icon: 'Zap',
    primaryAttr: 'type',
    defaults: { type: 'Redis', eviction: 'LRU', pattern: 'Cache-aside' },
    attrOptions: {
      type: { type: 'select', options: ['Redis', 'Memcached'] },
      eviction: { type: 'select', options: ['LRU', 'LFU', 'TTL', 'FIFO'] },
      pattern: { type: 'select', options: ['Cache-aside', 'Write-through', 'Write-back', 'Read-through'] },
    },
  },
  'Object Storage': {
    category: 'Storage',
    color: '#f97316',
    icon: 'HardDrive',
    primaryAttr: 'tier',
    defaults: { tier: 'Standard' },
    attrOptions: {
      tier: { type: 'select', options: ['Standard', 'Infrequent Access', 'Archive'] },
    },
  },
  'Search Index': {
    category: 'Storage',
    color: '#f97316',
    icon: 'Search',
    primaryAttr: 'type',
    defaults: { type: 'Elasticsearch' },
    attrOptions: {
      type: { type: 'select', options: ['Elasticsearch', 'Solr', 'OpenSearch'] },
    },
  },
  'Message Queue': {
    category: 'Messaging',
    color: '#a855f7',
    icon: 'Layers',
    primaryAttr: 'type',
    defaults: { type: 'Kafka', delivery: 'At-least-once', model: 'Pub/Sub', ordering: 'Per-partition' },
    attrOptions: {
      type: { type: 'select', options: ['Kafka', 'RabbitMQ', 'SQS', 'Redis Streams'] },
      delivery: { type: 'select', options: ['At-most-once', 'At-least-once', 'Exactly-once'] },
      model: { type: 'select', options: ['Queue', 'Pub/Sub', 'Stream'] },
      ordering: { type: 'select', options: ['None', 'Per-partition', 'FIFO', 'Global'] },
    },
  },
  'Custom': {
    category: 'Other',
    color: '#6b7280',
    icon: 'Box',
    defaults: { name: 'Custom' },
    attrOptions: {
      name: { type: 'text' },
    },
  },
}

// group node types by category for the sidebar
export const sidebarGroups = [
  { label: 'Network',   items: ['Client', 'Load Balancer', 'API Gateway', 'CDN'] },
  { label: 'Compute',   items: ['Service', 'Worker'] },
  { label: 'Storage',   items: ['SQL Database', 'NoSQL Database', 'Cache', 'Object Storage', 'Search Index'] },
  { label: 'Messaging', items: ['Message Queue'] },
  { label: 'Other',     items: ['Custom'] },
]
