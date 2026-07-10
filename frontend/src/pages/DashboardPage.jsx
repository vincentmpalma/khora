import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import './DashboardPage.css'

const nodeColorMap = {
  'Client': '#3b82f6', 'Load Balancer': '#3b82f6', 'API Gateway': '#3b82f6', 'CDN': '#3b82f6',
  'External Service': '#14b8a6',
  'Service': '#22c55e', 'Worker': '#22c55e',
  'SQL Database': '#f97316', 'NoSQL Database': '#f97316', 'Cache': '#f97316',
  'Object Storage': '#f97316', 'Search Index': '#f97316',
  'Message Broker': '#a855f7',
}

function NodeIcon({ type, cx, cy, s, color }) {
  const sw = Math.max(0.6, s * 0.18)
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

  switch (type) {
    case 'SQL Database':
    case 'NoSQL Database':
      return (
        <g {...p}>
          <ellipse cx={cx} cy={cy - s * 0.42} rx={s * 0.88} ry={s * 0.28}/>
          <line x1={cx - s * 0.88} y1={cy - s * 0.42} x2={cx - s * 0.88} y2={cy + s * 0.52}/>
          <line x1={cx + s * 0.88} y1={cy - s * 0.42} x2={cx + s * 0.88} y2={cy + s * 0.52}/>
          <ellipse cx={cx} cy={cy + s * 0.52} rx={s * 0.88} ry={s * 0.28}/>
        </g>
      )
    case 'Service':
    case 'Worker':
      return (
        <g {...p}>
          <rect x={cx - s * 0.88} y={cy - s * 0.72} width={s * 1.76} height={s * 0.42} rx={s * 0.08}/>
          <rect x={cx - s * 0.88} y={cy - s * 0.15} width={s * 1.76} height={s * 0.42} rx={s * 0.08}/>
          <rect x={cx - s * 0.88} y={cy + s * 0.42} width={s * 1.76} height={s * 0.42} rx={s * 0.08}/>
        </g>
      )
    case 'Client':
      return (
        <g {...p}>
          <rect x={cx - s * 0.88} y={cy - s * 0.78} width={s * 1.76} height={s * 1.1} rx={s * 0.1}/>
          <line x1={cx} y1={cy + s * 0.32} x2={cx} y2={cy + s * 0.72}/>
          <line x1={cx - s * 0.44} y1={cy + s * 0.72} x2={cx + s * 0.44} y2={cy + s * 0.72}/>
        </g>
      )
    case 'Load Balancer':
      return (
        <g {...p}>
          <line x1={cx} y1={cy - s * 0.8} x2={cx} y2={cy - s * 0.1}/>
          <line x1={cx} y1={cy - s * 0.1} x2={cx - s * 0.8} y2={cy + s * 0.8}/>
          <line x1={cx} y1={cy - s * 0.1} x2={cx + s * 0.8} y2={cy + s * 0.8}/>
        </g>
      )
    case 'API Gateway':
      return (
        <g {...p}>
          <circle cx={cx} cy={cy} r={s * 0.85}/>
          <line x1={cx - s * 0.85} y1={cy} x2={cx + s * 0.85} y2={cy}/>
          <ellipse cx={cx} cy={cy} rx={s * 0.38} ry={s * 0.85}/>
        </g>
      )
    case 'CDN':
      return (
        <g {...p}>
          <path d={`M${cx-s*.85},${cy-s*.5} A${s*1.2},${s*1.2} 0 0,1 ${cx+s*.85},${cy-s*.5}`}/>
          <path d={`M${cx-s*.52},${cy} A${s*.68},${s*.68} 0 0,1 ${cx+s*.52},${cy}`}/>
          <circle cx={cx} cy={cy + s * 0.55} r={s * 0.14} fill={color} stroke="none"/>
        </g>
      )
    case 'Cache':
      return (
        <path
          d={`M${cx+s*.28},${cy-s*.88} L${cx-s*.22},${cy-s*.05} L${cx+s*.08},${cy-s*.05} L${cx-s*.28},${cy+s*.88}`}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        />
      )
    case 'Message Broker':
      return (
        <g stroke={color} strokeWidth={sw} strokeLinecap="round">
          <line x1={cx - s * 0.8} y1={cy - s * 0.5} x2={cx + s * 0.8} y2={cy - s * 0.5}/>
          <line x1={cx - s * 0.8} y1={cy} x2={cx + s * 0.8} y2={cy}/>
          <line x1={cx - s * 0.8} y1={cy + s * 0.5} x2={cx + s * 0.8} y2={cy + s * 0.5}/>
        </g>
      )
    case 'External Service':
      return (
        <g {...p}>
          <rect x={cx - s * 0.5} y={cy - s * 0.22} width={s * 1.0} height={s * 0.78} rx={s * 0.12}/>
          <line x1={cx - s * 0.25} y1={cy - s * 0.22} x2={cx - s * 0.25} y2={cy - s * 0.65}/>
          <line x1={cx + s * 0.25} y1={cy - s * 0.22} x2={cx + s * 0.25} y2={cy - s * 0.65}/>
          <line x1={cx} y1={cy + s * 0.56} x2={cx} y2={cy + s * 0.88}/>
        </g>
      )
    case 'Object Storage':
      return (
        <g {...p}>
          <rect x={cx - s * 0.88} y={cy - s * 0.62} width={s * 1.76} height={s * 1.24} rx={s * 0.18}/>
          <line x1={cx - s * 0.48} y1={cy + s * 0.22} x2={cx + s * 0.14} y2={cy + s * 0.22}/>
          <circle cx={cx + s * 0.5} cy={cy + s * 0.22} r={s * 0.15} fill={color} stroke="none"/>
        </g>
      )
    case 'Search Index':
      return (
        <g {...p}>
          <circle cx={cx - s * 0.12} cy={cy - s * 0.08} r={s * 0.65}/>
          <line x1={cx + s * 0.38} y1={cy + s * 0.48} x2={cx + s * 0.82} y2={cy + s * 0.88}/>
        </g>
      )
    default:
      return <rect x={cx - s * 0.7} y={cy - s * 0.7} width={s * 1.4} height={s * 1.4} rx={s * 0.15} fill="none" stroke={color} strokeWidth={sw}/>
  }
}

function CanvasPreview({ canvasState }) {
  const raw = canvasState?.nodes || []
  const nodes = raw.filter((n, i, a) => a.findIndex(x => x.id === n.id) === i)
  const rawEdges = canvasState?.edges || []
  const edges = rawEdges.filter((e, i, a) => a.findIndex(x => x.id === e.id) === i)
  const VW = 280
  const VH = 148
  const PAD = 18

  if (!nodes.length) {
    // plain dotted grid with a faint label — fake node shapes here read as a
    // failed render next to the "0 nodes" metadata
    return (
      <svg viewBox={`0 0 ${VW} ${VH}`} className="room-preview-svg" aria-hidden="true">
        <text
          x={VW / 2}
          y={VH / 2 + 4}
          textAnchor="middle"
          fill="rgba(255,255,255,0.22)"
          fontSize="11"
          fontFamily="'Hanken Grotesk', sans-serif"
          letterSpacing="0.3"
        >
          Empty canvas
        </text>
      </svg>
    )
  }

  const xs = nodes.map(n => n.position.x)
  const ys = nodes.map(n => n.position.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs) + 148
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys) + 88

  const contentW = maxX - minX || 148
  const contentH = maxY - minY || 88

  const availW = VW - PAD * 2
  const availH = VH - PAD * 2
  const scale = Math.min(availW / contentW, availH / contentH, 0.45)

  const scaledW = contentW * scale
  const scaledH = contentH * scale
  const offsetX = PAD + (availW - scaledW) / 2
  const offsetY = PAD + (availH - scaledH) / 2

  const toX = x => offsetX + (x - minX) * scale
  const toY = y => offsetY + (y - minY) * scale

  const nw = 148 * scale
  const nh = 88 * scale
  const rx = Math.max(2, 11 * scale)
  const s = Math.max(3, nh * 0.22)

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]))

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="room-preview-svg" aria-hidden="true">
      {edges.map(edge => {
        const src = nodeById[edge.source]
        const tgt = nodeById[edge.target]
        if (!src || !tgt) return null
        return (
          <line
            key={edge.id}
            x1={toX(src.position.x) + nw / 2}
            y1={toY(src.position.y) + nh / 2}
            x2={toX(tgt.position.x) + nw / 2}
            y2={toY(tgt.position.y) + nh / 2}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        )
      })}
      {nodes.map(node => {
        const color = nodeColorMap[node.data?.nodeType] || '#6b7280'
        const cx = toX(node.position.x) + nw / 2
        const cy = toY(node.position.y) + nh / 2
        return (
          <g key={node.id}>
            <rect
              x={toX(node.position.x)}
              y={toY(node.position.y)}
              width={nw}
              height={nh}
              rx={rx}
              fill={`${color}15`}
              stroke={`${color}50`}
              strokeWidth="0.8"
            />
            {nh >= 10 && (
              <NodeIcon type={node.data?.nodeType} cx={cx} cy={cy} s={s} color={`${color}cc`}/>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function DashboardPage() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [rooms, setRooms] = useState([])
  const [deletingSlug, setDeletingSlug] = useState(null)
  const [editingSlug, setEditingSlug] = useState(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    async function fetchRooms() {
      try {
        const response = await apiFetch(`${import.meta.env.VITE_API_URL}/rooms`)
        if (!response) return
        const data = await response.json()
        if (response.ok) setRooms(data.rooms)
      } catch (err) { console.error(err) }
    }

    fetchRooms()
  }, [])

  function handleSignOut() {
    localStorage.removeItem('token')
    navigate('/')
  }

  async function handleDeleteRoom(slug) {
    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/rooms/${slug}`, { method: 'DELETE' })
      if (!response || !response.ok) return
      setRooms(prev => prev.filter(r => r.slug !== slug))
      setDeletingSlug(null)
    } catch (err) { console.error(err) }
  }

  async function handleRenameRoom(slug) {
    const trimmed = editingName.trim()
    if (!trimmed) return
    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/rooms/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      })
      if (!response || !response.ok) return
      setRooms(prev => prev.map(r => r.slug === slug ? { ...r, name: trimmed } : r))
      setEditingSlug(null)
      setEditingName('')
    } catch (err) { console.error(err) }
  }

  async function handleCreateRoom() {
    if (!roomName.trim()) return
    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName })
      })
      if (!response) return
      const data = await response.json()
      if (!response.ok) return
      setShowModal(false)
      setRoomName('')
      navigate(`/room/${data.room.slug}`)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
          <img src="/logos/khora-solar-coil-white.png" alt="" className="nav-logo-img"/>
          <span className="nav-logo-text">Khora</span>
        </div>
        <button className="btn-ghost" onClick={handleSignOut}>Sign out</button>
      </nav>

      <div className="dash-content">
        <div className="dash-header">
          <div className="dash-header-text">
            <h1>Your canvases</h1>
            <p>Continue a saved architecture canvas or start a new system design.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New canvas</button>
        </div>

        {rooms.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-title">Start your first system design</p>
            <p className="dash-empty-sub">Map services, databases, queues, APIs, and the connections between them.</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ New canvas</button>
          </div>
        ) : (
          <>
            <div className="dash-section-row">
              <span className="dash-section-label">Recent</span>
            </div>
            <div className="rooms-grid">
              {rooms.map(room => {
                const nc = room.canvas_state?.nodes?.length || 0
                const ec = room.canvas_state?.edges?.length || 0
                return (
                  <div
                    key={room.id}
                    className="room-card"
                    onClick={() => deletingSlug !== room.slug && editingSlug !== room.slug && navigate(`/room/${room.slug}`)}
                  >
                    <div className="room-preview">
                      <CanvasPreview canvasState={room.canvas_state}/>
                    </div>
                    <div className="room-card-body">
                      <div className="room-card-top">
                        <span className="room-name">{room.name || 'Untitled Canvas'}</span>
                        <div className="room-card-actions">
                          <button
                            className="room-edit-btn"
                            onClick={e => { e.stopPropagation(); setEditingSlug(room.slug); setEditingName(room.name || ''); setDeletingSlug(null) }}
                          >
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            className="room-delete-btn"
                            onClick={e => { e.stopPropagation(); setDeletingSlug(room.slug); setEditingSlug(null) }}
                          >✕</button>
                        </div>
                      </div>
                      <span className="room-stats">{nc} {nc === 1 ? 'node' : 'nodes'} · {ec} {ec === 1 ? 'edge' : 'edges'}</span>
                      <div className="room-card-footer">
                        <span className="room-date">{room.updated_at ? `edited ${relativeTime(room.updated_at)}` : relativeTime(room.created_at)}</span>
                        <span className="room-open">Open →</span>
                      </div>

                      {editingSlug === room.slug && (
                        <div className="room-delete-overlay" onClick={e => e.stopPropagation()}>
                          <input
                            className="room-rename-input"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRenameRoom(room.slug); if (e.key === 'Escape') { setEditingSlug(null); setEditingName('') } }}
                            autoFocus
                          />
                          <div className="room-delete-btns">
                            <button className="btn-delete-cancel" onClick={() => { setEditingSlug(null); setEditingName('') }}>Cancel</button>
                            <button className="btn-primary" style={{ fontSize: '12.5px', padding: '5px 14px' }} onClick={() => handleRenameRoom(room.slug)}>Save</button>
                          </div>
                        </div>
                      )}

                      {deletingSlug === room.slug && (
                        <div className="room-delete-overlay" onClick={e => e.stopPropagation()}>
                          <span className="room-delete-warning">Delete "{room.name || 'Untitled Canvas'}"?</span>
                          <div className="room-delete-btns">
                            <button className="btn-delete-cancel" onClick={() => setDeletingSlug(null)}>Cancel</button>
                            <button className="btn-delete-confirm-action" onClick={() => handleDeleteRoom(room.slug)}>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title">New canvas</p>
            <div className="form-group">
              <label htmlFor="room-name">Canvas name</label>
              <input
                id="room-name"
                type="text"
                placeholder="e.g. Checkout System"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateRoom}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
