import * as Icons from 'lucide-react'
import { nodeConfig } from './nodes/nodeConfig'
import './AttributePanel.css'

function AttributePanel({ node, onChange }) {
  if (!node) return null

  const config = nodeConfig[node.data.nodeType] || nodeConfig['Custom']
  const Icon = Icons[config.icon] || Icons.Box
  const attrOptions = config.attrOptions || {}

  function handleChange(key, value) {
    onChange(node.id, key, value)
  }

  // camelCase → "Title Case" for attr labels
  function toLabel(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
  }

  return (
    <div className="attr-panel">
      <div className="attr-panel-header">
        <span className="attr-panel-icon" style={{ color: config.color }}>
          <Icon size={14} strokeWidth={1.7} />
        </span>
        <span className="attr-panel-title">{node.data.nodeType}</span>
      </div>

      <div className="attr-panel-body">
        {Object.entries(attrOptions).map(([key, def]) => (
          <div key={key} className="attr-row">
            <label className="attr-label">{toLabel(key)}</label>

            {def.type === 'select' ? (
              <select
                className="attr-select"
                value={node.data.attrs[key] ?? def.options[0]}
                onChange={e => handleChange(key, e.target.value)}
              >
                {def.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : def.type === 'textarea' ? (
              <textarea
                className="attr-textarea"
                value={node.data.attrs[key] ?? ''}
                onChange={e => handleChange(key, e.target.value)}
                placeholder="Add notes…"
                rows={3}
              />
            ) : (
              <input
                className="attr-input"
                type="text"
                value={node.data.attrs[key] ?? ''}
                onChange={e => handleChange(key, e.target.value)}
                placeholder={def.placeholder || ''}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttributePanel
