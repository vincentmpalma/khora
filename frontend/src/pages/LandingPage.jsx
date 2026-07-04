import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactFlow, useNodesState, useEdgesState, Background, Controls } from '@xyflow/react'
import * as Icons from 'lucide-react'
import ComponentNode from '../components/nodes/ComponentNode'
import Sidebar from '../components/Sidebar'
import AttributePanel from '../components/AttributePanel'
import EdgePanel from '../components/EdgePanel'
import { nodeConfig } from '../components/nodes/nodeConfig'
import './LandingPage.css'

const nodeTypes = { component: ComponentNode }

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 1.5 },
  labelBgPadding: [4, 7],
  labelBgBorderRadius: 4,
  labelBgStyle: { fill: '#0d0d11', fillOpacity: 0.95 },
  labelStyle: { fill: '#56565e', fontSize: 10, fontFamily: "'Hanken Grotesk', -apple-system, sans-serif", fontWeight: 500, letterSpacing: '0.3px' },
}

const initialNodes = [
  { id: '1', type: 'component', position: { x: 175, y: 20  }, data: { nodeType: 'Client',         attrs: { kind: 'Web',               protocol: 'HTTPS'             } } },
  { id: '2', type: 'component', position: { x: 175, y: 190 }, data: { nodeType: 'API Gateway',    attrs: { authMethod: 'JWT',          rateLimiting: 'Per-User'      } } },
  { id: '3', type: 'component', position: { x: 20,  y: 360 }, data: { nodeType: 'Service',        attrs: { role: 'API Server',        scaling: 'Stateless / Horizontal' } } },
  { id: '4', type: 'component', position: { x: 340, y: 360 }, data: { nodeType: 'Message Broker', attrs: { model: 'Queue',            engine: 'Kafka', delivery: 'At-least-once' } } },
  { id: '5', type: 'component', position: { x: 20,  y: 510 }, data: { nodeType: 'SQL Database',   attrs: { engine: 'PostgreSQL',      replication: 'Primary-Replica' } } },
  { id: '6', type: 'component', position: { x: 340, y: 510 }, data: { nodeType: 'Worker',         attrs: { role: 'Background Worker', concurrency: '4'              } } },
]

const initialEdges = [
  { id: 'e1', source: '1', target: '2', type: 'smoothstep', data: { protocol: 'HTTPS',         mode: 'sync',  label: '' }, label: 'HTTPS',         style: { strokeWidth: 1.5 } },
  { id: 'e2', source: '2', target: '3', type: 'smoothstep', data: { protocol: 'gRPC',          mode: 'sync',  label: '' }, label: 'gRPC',          style: { strokeWidth: 1.5 } },
  { id: 'e3', source: '2', target: '4', type: 'smoothstep', data: { protocol: 'Queue Message', mode: 'async', label: '' }, label: 'Queue Message', style: { strokeWidth: 1.5, strokeDasharray: '6 3' } },
  { id: 'e4', source: '3', target: '5', type: 'smoothstep', data: { protocol: 'SQL Query',     mode: 'sync',  label: '' }, label: 'SQL Query',     style: { strokeWidth: 1.5 } },
  { id: 'e5', source: '4', target: '6', type: 'smoothstep', data: { protocol: 'Queue Message', mode: 'async', label: '' }, label: 'Queue Message', style: { strokeWidth: 1.5, strokeDasharray: '6 3' } },
]

const features = [
  {
    icon: 'Layers',
    title: 'Build system diagrams on a canvas',
    desc: 'Drag services, databases, queues, APIs, and external systems onto an infinite canvas, then connect them with labeled protocol-aware edges.',
  },
  {
    icon: 'Users',
    title: 'Collaborate in shared rooms',
    desc: 'Invite others into the same architecture canvas, design together in real time, and see everyone\'s cursor as they edit.',
  },
  {
    icon: 'Download',
    title: 'Export for docs and interviews',
    desc: 'Export architecture diagrams as PNG or PDF, ready for docs, presentations, and system design interviews.',
  },
]

function DemoCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [rfInstance, setRfInstance] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null

  function onAttrChange(nodeId, key, value) {
    setNodes(prev => prev.map(n =>
      n.id !== nodeId ? n : { ...n, data: { ...n.data, attrs: { ...n.data.attrs, [key]: value } } }
    ))
  }

  function onEdgeChange(edgeId, key, value) {
    setEdges(prev => prev.map(e => {
      if (e.id !== edgeId) return e
      const newData = { ...e.data, [key]: value }
      return {
        ...e,
        data: newData,
        label: newData.label || newData.protocol || '',
        style: { ...e.style, strokeDasharray: newData.mode === 'async' ? '6 3' : undefined },
      }
    }))
  }

  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      id: `edge-${crypto.randomUUID()}`,
      type: 'smoothstep',
      data: { protocol: '', mode: 'sync', label: '' },
    }
    setEdges(eds => [...eds, newEdge])
  }, [])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/reactflow')
    if (!raw || !rfInstance) return
    const { nodeType, primaryAttr, primaryValue } = JSON.parse(raw)
    const position = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const config = nodeConfig[nodeType] || nodeConfig['Custom']
    const attrs = { ...config.defaults }
    if (primaryAttr && primaryValue) attrs[primaryAttr] = primaryValue
    setNodes(prev => [...prev, {
      id: `${nodeType}-${crypto.randomUUID()}`,
      type: 'component',
      position,
      data: { nodeType, attrs },
    }])
  }, [rfInstance])

  const rightPanel = selectedEdge
    ? <EdgePanel edge={selectedEdge} onChange={onEdgeChange} />
    : <AttributePanel node={selectedNode} onChange={onAttrChange} />

  return (
    <div className="demo-canvas-body">
      <Sidebar />
      <div
        className="demo-canvas-area"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          colorMode="dark"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null) }}
          onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null) }}
          onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null) }}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant="dots" color="#222228" gap={22} size={1} />
          <Controls />
        </ReactFlow>
      </div>
      {rightPanel}
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        navigate('/dashboard', { replace: true })
      } else {
        localStorage.removeItem('token')
      }
    } catch {
      localStorage.removeItem('token')
    }
  }, [])

  function handleLogoClick() {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="landing">
      <nav className="land-nav">
        <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img src="/logos/khora-solar-coil-white.png" alt="" className="nav-logo-img" />
          <span className="nav-logo-text">Khora</span>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get started</button>
        </div>
      </nav>

      <section className="hero">
        <p className="hero-eyebrow">System design canvas</p>
        <h1 className="hero-title">Design software systems on a canvas.</h1>
        <p className="hero-subtitle">
          Drag in services, databases, queues, and APIs. Map the connections, share the room, and export the final diagram.
        </p>
        <div className="hero-actions">
          <button className="btn-primary btn-large" onClick={() => navigate('/register')}>Start designing</button>
          <button className="btn-ghost btn-large" onClick={() => navigate('/login')}>Sign in</button>
        </div>
        <button className="hero-demo-link" onClick={() => { const el = document.getElementById('demo-frame'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }) }}>
          Try the interactive demo
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5V11.5M7 11.5L3 7.5M7 11.5L11 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      <section className="demo-section" id="demo">
        <div className="demo-label-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="demo-interactive-hint" style={{ cursor: 'pointer' }} onClick={() => { const el = document.getElementById('demo-frame'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }) }}>Interactive demo</span>
          </div>
          <button className="demo-save-hint" onClick={() => navigate('/register')}>
            Sign in to save your work →
          </button>
        </div>
        <div className="demo-frame" id="demo-frame">
          <DemoCanvas />
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          {features.map(f => {
            const Icon = Icons[f.icon]
            return (
              <div key={f.title} className="feature-card">
                <span className="feature-icon">
                  {Icon && <Icon size={16} strokeWidth={1.6} />}
                </span>
                <p className="feature-title">{f.title}</p>
                <p className="feature-desc">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="cta-section">
        <p className="cta-title">Start your next system design.</p>
        <p className="cta-sub">Sign in to save and share your work.</p>
        <div className="cta-actions">
          <button className="btn-primary btn-large" onClick={() => navigate('/register')}>Start designing</button>
          <button className="btn-ghost btn-large" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
