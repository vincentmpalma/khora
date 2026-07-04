import './EdgePanel.css'

const connectionTypes = ['HTTPS', 'HTTP', 'REST over HTTP', 'GraphQL over HTTP', 'gRPC', 'WebSocket', 'SSE', 'TCP', 'UDP', 'SQL Query', 'Database Connection', 'Cache Operation', 'Pub/Sub', 'Queue Message', 'Event Stream', 'File / Object Transfer', 'Webhook', 'Custom']

function EdgePanel({ edge, onChange }) {
  if (!edge) return null

  return (
    <div className="edge-panel">
      <div className="edge-panel-header">
        <span className="edge-panel-title">Connection</span>
      </div>

      <div className="edge-panel-body">
        <div className="attr-row">
          <label className="attr-label">Connection Type</label>
          <select
            className="attr-select"
            value={edge.data?.protocol ?? ''}
            onChange={e => onChange(edge.id, 'protocol', e.target.value)}
          >
            <option value="">None</option>
            {connectionTypes.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="attr-row">
          <label className="attr-label">Mode</label>
          <select
            className="attr-select"
            value={edge.data?.mode ?? 'sync'}
            onChange={e => onChange(edge.id, 'mode', e.target.value)}
          >
            <option value="sync">Sync — solid line</option>
            <option value="async">Async — dashed line</option>
          </select>
        </div>

        <div className="attr-row">
          <label className="attr-label">Label</label>
          <input
            className="attr-input"
            type="text"
            placeholder="e.g. POST /tweet"
            value={edge.data?.label ?? ''}
            onChange={e => onChange(edge.id, 'label', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default EdgePanel
