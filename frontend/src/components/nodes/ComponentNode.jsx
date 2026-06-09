import { Handle, Position } from '@xyflow/react'
import * as Icons from 'lucide-react'
import { nodeConfig } from './nodeConfig'
import './ComponentNode.css'

function ComponentNode({ data }) {
  const config = nodeConfig[data.nodeType] || nodeConfig['Custom']
  const Icon = Icons[config.icon] || Icons.Box
  const subtitle = Object.values(data.attrs)[0]

  return (
    <div className="cn-wrapper">
      <Handle type="target" position={Position.Top} className="cn-handle" />

      <div className="cn-icon" style={{ color: config.color }}>
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <div className="cn-label">{data.nodeType}</div>
      {subtitle && <div className="cn-subtitle">{subtitle}</div>}

      <Handle type="source" position={Position.Bottom} className="cn-handle" />
    </div>
  )
}

export default ComponentNode
