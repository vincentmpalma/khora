import { nodeConfig, sidebarGroups } from './nodes/nodeConfig'
import './Sidebar.css'

// builds the drag payload — parsed in CanvasPage onDrop
function makeDragData(nodeType, primaryAttr, primaryValue) {
  return JSON.stringify({ nodeType, primaryAttr, primaryValue })
}

// a sub-item under a node type e.g. "Web" under "Client"
function SubItem({ nodeType, label, primaryAttr }) {
  function onDragStart(event) {
    event.dataTransfer.setData('application/reactflow', makeDragData(nodeType, primaryAttr, label))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="sidebar-subitem" draggable onDragStart={onDragStart}>
      {label}
    </div>
  )
}

// a top-level node type row e.g. "Client" — draggable itself, with sub-items below
function NodeTypeRow({ nodeType }) {
  const config = nodeConfig[nodeType]
  const primaryAttr = config.primaryAttr
  const subItems = primaryAttr ? config.attrOptions[primaryAttr].options : []

  function onDragStart(event) {
    // dragging the type itself drops with default attribute values
    event.dataTransfer.setData('application/reactflow', makeDragData(nodeType, null, null))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="node-type-block">
      {/* the main type label — draggable */}
      <div
        className="sidebar-item"
        draggable
        onDragStart={onDragStart}
      >
        <span className="sidebar-item-dot" style={{ background: config.color }} />
        {nodeType}
      </div>

      {/* sub-items listed below — each is also draggable */}
      {subItems.map(opt => (
        <SubItem key={opt} nodeType={nodeType} label={opt} primaryAttr={primaryAttr} />
      ))}
    </div>
  )
}

function Sidebar() {
  return (
    <div className="sidebar">
      {sidebarGroups.map(group => (
        <div key={group.label} className="sidebar-group">
          <div className="sidebar-group-label">{group.label}</div>
          {group.items.map(nodeType => (
            <NodeTypeRow key={nodeType} nodeType={nodeType} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Sidebar
