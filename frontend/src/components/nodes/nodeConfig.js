// config for every node type — defines category, accent color, icon, default attr values, and inspector fields
// primaryAttr = the attribute whose options appear as draggable sub-items in the sidebar
export const nodeConfig = {

  // ─── Network ───────────────────────────────────────────────────────────────

  'Client': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Monitor',
    primaryAttr: 'kind',
    defaults: { kind: 'Web', protocol: 'HTTPS' },
    attrOptions: {
      kind:     { type: 'select', options: ['Web', 'Mobile', 'Desktop', 'IoT'] },
      protocol: { type: 'select', options: ['HTTPS', 'WebSocket', 'gRPC', 'HTTP'] },
    },
  },

  'External Service': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Plug',
    primaryAttr: 'type',
    defaults: { type: 'Payment', auth: 'API Key', notes: '' },
    attrOptions: {
      type:  { type: 'select', options: ['Payment', 'Auth', 'Email', 'Storage', 'AI API', 'Webhook Provider', 'Partner API', 'Other'] },
      auth:  { type: 'select', options: ['API Key', 'OAuth 2.0', 'mTLS', 'None'] },
      notes: { type: 'textarea' },
    },
  },

  'Load Balancer': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Shuffle',
    primaryAttr: 'strategy',
    defaults: { strategy: 'Round Robin', layer: 'L7', stickySessions: 'off', healthCheck: 'HTTP' },
    attrOptions: {
      strategy:       { type: 'select', options: ['Round Robin', 'Weighted Round Robin', 'Least Connections', 'IP Hash'] },
      layer:          { type: 'select', options: ['L4', 'L7'] },
      stickySessions: { type: 'select', options: ['off', 'on'] },
      healthCheck:    { type: 'select', options: ['HTTP', 'TCP', 'None'] },
    },
  },

  'API Gateway': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Globe',
    defaults: { responsibilities: 'Routing, Auth', authMethod: 'JWT', rateLimiting: 'None' },
    attrOptions: {
      responsibilities: { type: 'text', placeholder: 'e.g. Routing, Auth, Rate Limiting' },
      authMethod:       { type: 'select', options: ['JWT', 'OAuth 2.0', 'API Key', 'mTLS', 'None'] },
      rateLimiting:     { type: 'select', options: ['None', 'Per-IP', 'Per-User', 'Global'] },
    },
  },

  'CDN': {
    category: 'Network',
    color: '#3b82f6',
    icon: 'Wifi',
    primaryAttr: 'mode',
    defaults: { mode: 'Pull', cacheStrategy: 'TTL-based', ttl: '1h', origin: '' },
    attrOptions: {
      mode:          { type: 'select', options: ['Pull', 'Push'] },
      cacheStrategy: { type: 'select', options: ['TTL-based', 'Cache-aside', 'Write-through'] },
      ttl:           { type: 'text', placeholder: 'e.g. 1h, 24h, 7d' },
      origin:        { type: 'text', placeholder: 'e.g. api.example.com' },
    },
  },

  // ─── Compute ───────────────────────────────────────────────────────────────

  'Service': {
    category: 'Compute',
    color: '#22c55e',
    icon: 'Server',
    primaryAttr: 'role',
    defaults: { role: 'API Server', scaling: 'Stateless', protocol: 'HTTP', replicas: '2', healthCheck: 'HTTP', notes: '' },
    attrOptions: {
      role:        { type: 'select', options: ['API Server', 'Microservice', 'BFF', 'Monolith', 'Realtime Service'] },
      scaling:     { type: 'select', options: ['Stateless / Horizontal', 'Stateful / Vertical'] },
      protocol:    { type: 'select', options: ['HTTP', 'gRPC', 'WebSocket', 'TCP'] },
      replicas:    { type: 'text', placeholder: 'e.g. 3' },
      healthCheck: { type: 'select', options: ['HTTP', 'TCP', 'None'] },
      notes:       { type: 'textarea' },
    },
  },

  'Worker': {
    category: 'Compute',
    color: '#22c55e',
    icon: 'Cpu',
    primaryAttr: 'role',
    defaults: { role: 'Background Worker', concurrency: '4', notes: '' },
    attrOptions: {
      role:        { type: 'select', options: ['Background Worker', 'Cron Job', 'Batch Job', 'Queue Consumer'] },
      concurrency: { type: 'text', placeholder: 'e.g. 4' },
      notes:       { type: 'textarea' },
    },
  },

  // ─── Storage ───────────────────────────────────────────────────────────────

  'SQL Database': {
    category: 'Storage',
    color: '#f97316',
    icon: 'Database',
    primaryAttr: 'engine',
    defaults: { engine: 'PostgreSQL', replication: 'Primary-Replica', sharding: 'None', consistency: 'Strong', backup: 'Daily' },
    attrOptions: {
      engine:      { type: 'select', options: ['PostgreSQL', 'MySQL', 'SQLite', 'MSSQL', 'Oracle'] },
      replication: { type: 'select', options: ['None', 'Primary-Replica', 'Multi-Primary'] },
      sharding:    { type: 'select', options: ['None', 'Range', 'Hash', 'Consistent Hashing'] },
      consistency: { type: 'select', options: ['Strong', 'Eventual', 'Read-your-writes'] },
      backup:      { type: 'select', options: ['None', 'Hourly', 'Daily', 'Continuous'] },
    },
  },

  'NoSQL Database': {
    category: 'Storage',
    color: '#f97316',
    icon: 'DatabaseZap',
    primaryAttr: 'type',
    defaults: { type: 'Document', engine: 'MongoDB', replication: 'Primary-Replica', sharding: 'None' },
    attrOptions: {
      type:        { type: 'select', options: ['Document', 'Wide-Column', 'Key-Value', 'Graph', 'Time-Series'] },
      engine:      { type: 'select', options: ['MongoDB', 'Cassandra', 'DynamoDB', 'Redis', 'Neo4j', 'InfluxDB'] },
      replication: { type: 'select', options: ['None', 'Primary-Replica', 'Quorum'] },
      sharding:    { type: 'select', options: ['None', 'Range', 'Hash', 'Consistent Hashing'] },
    },
  },

  'Cache': {
    category: 'Storage',
    color: '#f97316',
    icon: 'Zap',
    primaryAttr: 'type',
    defaults: { type: 'Redis', eviction: 'LRU', pattern: 'Cache-aside', ttl: '1h', maxMemory: '512mb' },
    attrOptions: {
      type:      { type: 'select', options: ['Redis', 'Memcached'] },
      eviction:  { type: 'select', options: ['LRU', 'LFU', 'TTL', 'FIFO', 'No-eviction'] },
      pattern:   { type: 'select', options: ['Cache-aside', 'Write-through', 'Write-back', 'Read-through'] },
      ttl:       { type: 'text', placeholder: 'e.g. 1h, 30m' },
      maxMemory: { type: 'text', placeholder: 'e.g. 512mb, 2gb' },
    },
  },

  'Object Storage': {
    category: 'Storage',
    color: '#f97316',
    icon: 'HardDrive',
    primaryAttr: 'tier',
    defaults: { tier: 'Standard', versioning: 'Enabled', region: '' },
    attrOptions: {
      tier:       { type: 'select', options: ['Standard', 'Infrequent Access', 'Archive'] },
      versioning: { type: 'select', options: ['Enabled', 'Disabled'] },
      region:     { type: 'text', placeholder: 'e.g. us-east-1' },
    },
  },

  'Search Index': {
    category: 'Storage',
    color: '#f97316',
    icon: 'Search',
    primaryAttr: 'type',
    defaults: { type: 'Elasticsearch', indexing: 'Near-real-time' },
    attrOptions: {
      type:     { type: 'select', options: ['Elasticsearch', 'OpenSearch', 'Solr', 'Typesense', 'Algolia'] },
      indexing: { type: 'select', options: ['Real-time', 'Near-real-time', 'Batch'] },
    },
  },

  // ─── Messaging ─────────────────────────────────────────────────────────────

  'Message Broker': {
    category: 'Messaging',
    color: '#a855f7',
    icon: 'Layers',
    primaryAttr: 'model',
    defaults: { model: 'Queue', engine: 'Kafka', delivery: 'At-least-once', ordering: 'Per-partition', retryPolicy: 'Exponential Backoff' },
    attrOptions: {
      model:       { type: 'select', options: ['Queue', 'Pub/Sub', 'Stream'] },
      engine:      { type: 'select', options: ['Kafka', 'RabbitMQ', 'SQS', 'Redis Streams', 'Google Pub/Sub'] },
      delivery:    { type: 'select', options: ['At-most-once', 'At-least-once', 'Exactly-once'] },
      ordering:    { type: 'select', options: ['None', 'Per-partition', 'FIFO', 'Global'] },
      retryPolicy: { type: 'select', options: ['None', 'Exponential Backoff', 'Fixed Interval', 'Dead Letter Queue'] },
    },
  },

  // ─── Other ─────────────────────────────────────────────────────────────────

  'Custom': {
    category: 'Other',
    color: '#6b7280',
    icon: 'Box',
    defaults: { name: 'Custom', notes: '' },
    attrOptions: {
      name:  { type: 'text', placeholder: 'Component name' },
      notes: { type: 'textarea' },
    },
  },
}

// sidebar groups — defines display order and category membership
export const sidebarGroups = [
  { label: 'Network',   items: ['Client', 'Load Balancer', 'API Gateway', 'CDN', 'External Service'] },
  { label: 'Compute',   items: ['Service', 'Worker'] },
  { label: 'Storage',   items: ['SQL Database', 'NoSQL Database', 'Cache', 'Object Storage', 'Search Index'] },
  { label: 'Messaging', items: ['Message Broker'] },
  { label: 'Other',     items: ['Custom'] },
]
