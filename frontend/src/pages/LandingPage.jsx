import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactFlow, useNodesState, useEdgesState, addEdge, Background } from '@xyflow/react'
import * as Icons from 'lucide-react'
import ComponentNode from '../components/nodes/ComponentNode'
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
  { id: '1', type: 'component', position: { x: 40,  y: 160 }, data: { nodeType: 'Client',        attrs: { kind: 'Web',          protocol: 'HTTPS'       } } },
  { id: '2', type: 'component', position: { x: 290, y: 160 }, data: { nodeType: 'API Gateway',   attrs: { authMethod: 'JWT',     rateLimiting: 'Per-User' } } },
  { id: '3', type: 'component', position: { x: 560, y: 60  }, data: { nodeType: 'Service',       attrs: { role: 'API Server',   scaling: 'Stateless / Horizontal' } } },
  { id: '4', type: 'component', position: { x: 560, y: 280 }, data: { nodeType: 'Message Queue', attrs: { type: 'Kafka',        delivery: 'At-least-once' } } },
  { id: '5', type: 'component', position: { x: 830, y: 60  }, data: { nodeType: 'SQL Database',  attrs: { engine: 'PostgreSQL', replication: 'Primary-Replica' } } },
  { id: '6', type: 'component', position: { x: 830, y: 280 }, data: { nodeType: 'Worker',        attrs: { role: 'Worker',       concurrency: '4' } } },
]

const initialEdges = [
  { id: 'e1', source: '1', target: '2', label: 'HTTPS'   },
  { id: 'e2', source: '2', target: '3', label: 'gRPC'    },
  { id: 'e3', source: '2', target: '4', label: 'Pub/Sub' },
  { id: 'e4', source: '3', target: '5', label: 'SQL'     },
  { id: 'e5', source: '4', target: '6', label: 'Consume' },
]

const features = [
  {
    icon: 'Layers',
    title: 'Visual system design',
    desc: 'Drag services, databases, queues, and APIs onto an infinite canvas and arrange them into clear architecture diagrams.',
  },
  {
    icon: 'GitBranch',
    title: 'Protocol-aware connections',
    desc: 'Label every edge with a protocol — HTTPS, gRPC, SQL, Pub/Sub — so data flows are always explicit.',
  },
  {
    icon: 'Save',
    title: 'Save and share',
    desc: 'Sign in to persist canvases, reopen rooms, invite collaborators, and export diagrams as PNG or PDF.',
  },
]

function OfflineCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const onConnect = useCallback(
    params => setEdges(eds => addEdge({ ...params }, eds)),
    [setEdges]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      fitViewOptions={{ padding: 0.28 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant="dots" color="#222228" gap={22} size={1} />
    </ReactFlow>
  )
}

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <nav className="land-nav">
        <div className="nav-logo">
          <img src="/logos/khora-solar-coil-white.png" alt="" className="nav-logo-img" />
          <span className="nav-logo-text">Khora</span>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get started</button>
        </div>
      </nav>

      <section className="hero">
        <p className="hero-eyebrow">System architecture design tool</p>
        <h1 className="hero-title">A canvas for designing<br />software systems.</h1>
        <p className="hero-subtitle">
          Map services, databases, queues, and APIs on a fast visual workspace built for software engineers.
        </p>
        <div className="hero-actions">
          <button className="btn-primary btn-large" onClick={() => navigate('/register')}>Start designing</button>
          <button className="btn-ghost btn-large" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-label-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="demo-label">Try the canvas — no account required</span>
            <span className="demo-interactive-hint">Interactive demo</span>
          </div>
          <button className="demo-save-hint" onClick={() => navigate('/register')}>
            Sign in to save your work →
          </button>
        </div>
        <div className="demo-frame">
          <OfflineCanvas />
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
        <p className="cta-title">Start with a blank canvas.</p>
        <div className="cta-actions">
          <button className="btn-primary btn-large" onClick={() => navigate('/register')}>Start designing</button>
          <button className="btn-ghost btn-large" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
