import { nodeConfig } from './nodes/nodeConfig'
import './AttributePanel.css'

// shown on the right when a node is selected — lets you edit that node's attributes
function AttributePanel({ node, onChange }) {
  if (!node) return null

  const config = nodeConfig[node.data.nodeType] || nodeConfig['Custom']
  const attrOptions = config.attrOptions || {}

  function handleChange(key, value) {
    // tell CanvasPage to update this node's attrs with the new value
    onChange(node.id, key, value)
  }

  return (
    <div className="attr-panel">
      <div className="attr-panel-header">
        <span className="attr-panel-title">{node.data.nodeType}</span>
      </div>

      <div className="attr-panel-body">
        {Object.entries(attrOptions).map(([key, def]) => (
          <div key={key} className="attr-row">
            {/* capitalize the key for the label e.g. "stickySessions" → "Sticky Sessions" */}
            <label className="attr-label">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
            </label>

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
            ) : (
              <input
                className="attr-input"
                type="text"
                value={node.data.attrs[key] ?? ''}
                onChange={e => handleChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttributePanel
