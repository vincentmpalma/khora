import { useState } from 'react'
import * as Icons from 'lucide-react'
import { nodeConfig, sidebarGroups } from './nodes/nodeConfig'
import './Sidebar.css'

const categoryIcons = {
  'Network':   'Network',
  'Compute':   'Cpu',
  'Storage':   'Database',
  'Messaging': 'MessageSquare',
  'Other':     'Box',
}

function makeDragData(nodeType, primaryAttr, primaryValue) {
  return JSON.stringify({ nodeType, primaryAttr, primaryValue })
}

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

function NodeTypeRow({ nodeType }) {
  const config = nodeConfig[nodeType]
  const Icon = Icons[config.icon] || Icons.Box
  const primaryAttr = config.primaryAttr
  const subItems = primaryAttr ? config.attrOptions[primaryAttr].options : []

  function onDragStart(event) {
    event.dataTransfer.setData('application/reactflow', makeDragData(nodeType, null, null))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="node-type-block">
      <div className="sidebar-item" draggable onDragStart={onDragStart}>
        <span className="sidebar-item-icon" style={{ color: config.color }}>
          <Icon size={13} strokeWidth={1.7} />
        </span>
        <span className="sidebar-item-label">{nodeType}</span>
      </div>
      {subItems.map(opt => (
        <SubItem key={opt} nodeType={nodeType} label={opt} primaryAttr={primaryAttr} />
      ))}
    </div>
  )
}

function Sidebar() {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(
    () => Object.fromEntries(sidebarGroups.map(g => [g.label, true]))
  )

  function toggleGroup(label) {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const q = query.trim().toLowerCase()
  const isSearching = q.length > 0
  const searchResults = isSearching
    ? Object.keys(nodeConfig).filter(name => {
        if (name.toLowerCase().includes(q)) return true
        const config = nodeConfig[name]
        if (!config.primaryAttr) return false
        return config.attrOptions[config.primaryAttr].options.some(opt => opt.toLowerCase().includes(q))
      })
    : []

  return (
    <div className="sidebar">
      <div className="sidebar-search">
        <div className="sidebar-search-wrap">
          <svg className="sidebar-search-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className="sidebar-search-input"
            placeholder="Search components…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {isSearching ? (
        <div className="sidebar-results">
          {searchResults.length === 0 ? (
            <span className="sidebar-empty">No results for "{query}"</span>
          ) : (
            searchResults.map(nodeType => <NodeTypeRow key={nodeType} nodeType={nodeType} />)
          )}
        </div>
      ) : (
        sidebarGroups.map(group => (
          <div key={group.label} className="sidebar-group">
            <button className="sidebar-group-label" onClick={() => toggleGroup(group.label)}>
              <span className="sidebar-group-label-left">
                {(() => { const I = Icons[categoryIcons[group.label]]; return I ? <I size={12} strokeWidth={1.7} /> : null })()}
                {group.label}
              </span>
              <svg
                className={`sidebar-chevron${collapsed[group.label] ? '' : ' sidebar-chevron--open'}`}
                width="10" height="10" viewBox="0 0 10 10" fill="none"
              >
                <path d="M3 2.5L6 5L3 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {!collapsed[group.label] && group.items.map(nodeType => (
              <NodeTypeRow key={nodeType} nodeType={nodeType} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

export default Sidebar
