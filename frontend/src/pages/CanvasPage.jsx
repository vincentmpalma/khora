import { useState, useCallback, useEffect, useRef } from 'react'
import { apiFetch } from '../utils/api'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { useParams, useNavigate } from 'react-router-dom'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, getNodesBounds, getViewportForBounds } from '@xyflow/react'
import * as Y from 'yjs'
import { SocketIOProvider } from 'y-socket.io'
import '@xyflow/react/dist/style.css'
import Sidebar from '../components/Sidebar'
import ComponentNode from '../components/nodes/ComponentNode'
import AttributePanel from '../components/AttributePanel'
import EdgePanel from '../components/EdgePanel'
import { nodeConfig } from '../components/nodes/nodeConfig'
import './CanvasPage.css'

const nodeTypes = { component: ComponentNode }

const CURSOR_COLORS = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6']
function cursorColor(clientId) {
  return CURSOR_COLORS[Number(clientId) % CURSOR_COLORS.length]
}

function getSmartProtocol(sourceType, targetType) {
  if (targetType === 'Message Broker') return 'Queue Message'
  if (sourceType === 'Message Broker') return 'Queue Message'
  if (sourceType === 'Service' && targetType === 'Service') return 'gRPC'
  if (sourceType === 'Client') return 'HTTPS'
  if (targetType === 'SQL Database') return 'SQL Query'
  if (targetType === 'NoSQL Database' || targetType === 'Cache') return 'Database Connection'
  if (targetType === 'External Service') return 'HTTPS'
  return ''
}

function getSmartMode(sourceType, targetType) {
  if (targetType === 'Message Broker') return 'async'
  if (sourceType === 'Message Broker') return 'async'
  return 'sync'
}


function CanvasPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  // react flow manages its own internal state for drag, selection, etc.
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [rfInstance, setRfInstance] = useState(null)
  const [roomName, setRoomName] = useState(slug)
  const [saveStatus, setSaveStatus] = useState('saved')

  // isOwner controls whether the share button is visible — only the owner can generate invite links
  const [isOwner, setIsOwner] = useState(false)
  // shareStatus drives the share button label: null = 'Share', 'copied!' or 'error' after click
  const [shareStatus, setShareStatus] = useState(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null

  const [remoteCursors, setRemoteCursors] = useState(new Map())

  // refs to yjs objects so mutation handlers can access them without stale closures
  const ydocRef = useRef(null)
  const yNodesRef = useRef(null)
  const yEdgesRef = useRef(null)
  const providerRef = useRef(null)
  const canvasAreaRef = useRef(null)
  const lastCursorSend = useRef(0)
  const saveTimer = useRef(null)

  // debounced save — waits 1.5s after last change before writing to the database
  function saveCanvas(updatedNodes, updatedEdges) {
    if (!localStorage.getItem('token')) return  // guests don't save
    setSaveStatus('saving...')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await apiFetch(`${import.meta.env.VITE_API_URL}/rooms/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canvas_state: { nodes: updatedNodes, edges: updatedEdges } })
        })
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error saving')
        console.error(err)
      }
    }, 1500)
  }

  useEffect(() => {
    // declared outside the async fn so the cleanup function can reference them
    let provider = null
    let ydoc = null

    async function init() {
      try {
        const authToken = localStorage.getItem('token')
        const guestSession = sessionStorage.getItem('guestSession')
        const guest = guestSession ? JSON.parse(guestSession) : null
        const isGuest = !authToken

        if (isGuest) {
          // guests must have arrived via an invite link — no direct room access
          if (!guest || guest.roomSlug !== slug) {
            navigate('/')
            return
          }
          setRoomName(guest.roomName)
          setIsOwner(false)
          // canvas state arrives via yjs sync — no http fetch needed
        } else {
          const response = await apiFetch(`${import.meta.env.VITE_API_URL}/rooms/${slug}`)
          const data = await response.json()

          if (!response || !response.ok) {
            navigate('/dashboard')
            return
          }

          setRoomName(data.room.name)

          // decode the jwt payload (no verification needed — just for display logic)
          // compare with room owner_id to decide whether to show the share button
          const payload = JSON.parse(atob(authToken.split('.')[1]))
          setIsOwner(data.room.owner_id === payload.id)

          // load initial canvas state directly into react state so the canvas renders immediately
          // yjs handles changes after this — this is just the initial paint
          const savedNodes = data.room.canvas_state?.nodes || []
          const savedEdges = data.room.canvas_state?.edges || []
          if (savedNodes.length) setNodes(savedNodes)
          if (savedEdges.length) setEdges(savedEdges)
        }

        // create the local yjs document
        ydoc = new Y.Doc()

        // provider connects ydoc to the backend via socket.io
        // any change to ydoc is automatically sent to the server and broadcast to all other clients in this room
        provider = new SocketIOProvider(import.meta.env.VITE_API_URL, slug, ydoc, { autoConnect: true })

        // get the shared arrays — every client in this room shares these exact same arrays
        const yNodes = ydoc.getArray('nodes')
        const yEdges = ydoc.getArray('edges')

        // store in refs so mutation handlers (drop, connect, etc.) can access them
        ydocRef.current = ydoc
        yNodesRef.current = yNodes
        yEdgesRef.current = yEdges
        providerRef.current = provider

        // publish this user's display name into awareness so other clients can show it on their cursor
        try {
          let name
          if (isGuest) {
            name = guest.guestName
          } else {
            const payload = JSON.parse(atob(authToken.split('.')[1]))
            name = payload.username || payload.email?.split('@')[0] || 'User'
          }
          provider.awareness.setLocalStateField('user', { name, isGuest })
        } catch {}

        // update remote cursors whenever any client's awareness state changes
        provider.awareness.on('change', () => {
          const states = provider.awareness.getStates()
          const next = new Map()
          states.forEach((state, clientId) => {
            if (clientId !== provider.awareness.clientID && state.cursor) {
              next.set(clientId, { ...state.cursor, username: state.user?.name })
            }
          })
          setRemoteCursors(next)
        })

        // yReady gates the observers — we don't let them drive react state until the
        // provider has finished its initial sync with the server. without this, a node
        // dropped before sync completes would overwrite the http-loaded state with a
        // single-element array, making all existing nodes disappear.
        let yReady = false

        provider.on('sync', (isSynced) => {
          if (isSynced) yReady = true
        })

        yNodes.observe(() => {
          if (!yReady) return
          const arr = yNodes.toArray()
          setNodes(arr)
          saveCanvas(arr, yEdges.toArray())
        })

        yEdges.observe(() => {
          if (!yReady) return
          const arr = yEdges.toArray()
          setEdges(arr)
          saveCanvas(yNodes.toArray(), arr)
        })

      } catch (err) {
        console.error(err)
      }
    }

    init()

    // clean up when the component unmounts (user navigates away)
    return () => {
      if (provider) provider.destroy()
      if (ydoc) ydoc.destroy()
    }
  }, [slug])

  function onAttrChange(nodeId, key, value) {
    const yNodes = yNodesRef.current
    const ydoc = ydocRef.current
    if (!yNodes || !ydoc) return

    const arr = yNodes.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx === -1) return

    const updatedNode = {
      ...arr[idx],
      data: { ...arr[idx].data, attrs: { ...arr[idx].data.attrs, [key]: value } }
    }

    // delete the old node and insert the updated one at the same index
    // yjs broadcasts this change to all other clients automatically
    ydoc.transact(() => {
      yNodes.delete(idx, 1)
      yNodes.insert(idx, [updatedNode])
    })
  }

  function onEdgeChange(edgeId, key, value) {
    const yEdges = yEdgesRef.current
    const ydoc = ydocRef.current
    if (!yEdges || !ydoc) return

    const arr = yEdges.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx === -1) return

    const newData = { ...arr[idx].data, [key]: value }
    const updatedEdge = {
      ...arr[idx],
      data: newData,
      label: newData.label || newData.protocol || '',
      style: { ...arr[idx].style, strokeDasharray: newData.mode === 'async' ? '6 3' : undefined }
    }

    ydoc.transact(() => {
      yEdges.delete(idx, 1)
      yEdges.insert(idx, [updatedEdge])
    })
  }

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source)
    const targetNode = nodes.find(n => n.id === params.target)
    const sourceType = sourceNode?.data?.nodeType
    const targetType = targetNode?.data?.nodeType

    const protocol = getSmartProtocol(sourceType, targetType)
    const mode = getSmartMode(sourceType, targetType)

    const newEdge = {
      ...params,
      id: `edge-${crypto.randomUUID()}`,
      type: 'smoothstep',
      data: { protocol, mode, label: '' },
      label: protocol,
      style: { strokeDasharray: mode === 'async' ? '6 3' : undefined },
    }

    // push to yjs — observer fires and updates react state for all clients
    if (yEdgesRef.current) {
      yEdgesRef.current.push([newEdge])
    }
  }, [nodes])

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData('application/reactflow')
    if (!raw || !rfInstance) return

    const { nodeType, primaryAttr, primaryValue } = JSON.parse(raw)
    const position = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const config = nodeConfig[nodeType] || nodeConfig['Custom']
    const attrs = { ...config.defaults }
    if (primaryAttr && primaryValue) attrs[primaryAttr] = primaryValue

    const newNode = {
      id: `${nodeType}-${crypto.randomUUID()}`,
      type: 'component',
      position,
      data: { nodeType, attrs },
    }

    // push to yjs — observer fires and updates react state for all clients
    if (yNodesRef.current) {
      yNodesRef.current.push([newNode])
    }
  }, [rfInstance])

  // sync node position to yjs when drag ends so other clients see the new position
  // we don't sync during drag because that would be hundreds of updates per second
  const onNodeDragStop = useCallback((_, node) => {
    const yNodes = yNodesRef.current
    const ydoc = ydocRef.current
    if (!yNodes || !ydoc) return

    const arr = yNodes.toArray()
    const idx = arr.findIndex(n => n.id === node.id)
    if (idx === -1) return

    const updatedNode = { ...arr[idx], position: node.position }
    ydoc.transact(() => {
      yNodes.delete(idx, 1)
      yNodes.insert(idx, [updatedNode])
    })
  }, [])

  const onMouseMoveCanvas = useCallback((e) => {
    const now = Date.now()
    if (now - lastCursorSend.current < 50) return
    lastCursorSend.current = now
    const provider = providerRef.current
    if (!provider || !rfInstance) return
    const pos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    provider.awareness.setLocalStateField('cursor', { x: pos.x, y: pos.y })
  }, [rfInstance])

  const onMouseLeaveCanvas = useCallback(() => {
    const provider = providerRef.current
    if (!provider) return
    provider.awareness.setLocalStateField('cursor', null)
  }, [])

  // fetches the room's invite token from the backend, builds the /join/<token> url,
  // and copies it to clipboard — only the owner can call this route
  async function handleTitleSave() {
    setIsEditingTitle(false)
    const trimmed = roomName.trim()
    if (!trimmed) return
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/rooms/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      })
    } catch (err) {
      console.error(err)
    }
  }

  async function handleShare() {
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/rooms/${slug}/invite`, {
        method: 'POST',
      })
      const data = await res.json()
      // construct the full invite url using the current origin so it works on any host
      const link = `${window.location.origin}/join/${data.invite_token}`
      await navigator.clipboard.writeText(link)
      setShareStatus('copied!')
      setTimeout(() => setShareStatus(null), 2000)
    } catch (err) {
      setShareStatus('error')
      setTimeout(() => setShareStatus(null), 2000)
    }
  }

  // html-to-image clones the dom and serializes it, but css custom properties
  // (like --xy-edge-stroke-default) don't resolve inside the cloned svg context,
  // so all edge paths render with no stroke (invisible) and label rects render black.
  // fix: read the browser-resolved computed values and set them as inline styles
  // before capture, then restore afterward so the live canvas is unchanged.
  async function getExportDataUrl() {
    if (!rfInstance) return null
    const nodes = rfInstance.getNodes()
    if (!nodes.length) return null

    const W = 1920
    const H = 1080
    const bounds = getNodesBounds(nodes)
    const { x, y, zoom } = getViewportForBounds(bounds, W, H, 0.5, 2, 0.1)
    const viewport = document.querySelector('.react-flow__viewport')

    // collect all svg primitives that need style inlining
    const svgEls = viewport.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse, text, tspan')
    const saved = []
    svgEls.forEach(el => {
      saved.push({ el, prev: el.getAttribute('style') || '' })
      const c = window.getComputedStyle(el)
      el.style.stroke = c.stroke
      el.style.strokeWidth = c.strokeWidth
      el.style.strokeDasharray = c.strokeDasharray
      el.style.fill = c.fill
      el.style.opacity = c.opacity
      el.style.fontSize = c.fontSize
      el.style.fontFamily = c.fontFamily
    })

    const dataUrl = await toPng(viewport, {
      backgroundColor: '#13131a',
      width: W,
      height: H,
      style: {
        width: `${W}px`,
        height: `${H}px`,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: 'top left',
      },
    })

    // restore live dom to original state
    saved.forEach(({ el, prev }) => el.setAttribute('style', prev))
    return dataUrl
  }

  async function handleExportPng() {
    const dataUrl = await getExportDataUrl()
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${roomName}.png`
    a.click()
  }

  // same capture, but fit into an a4 landscape page
  // using mm units avoids jspdf's internal px scaling which causes white strips
  async function handleExportPdf() {
    const dataUrl = await getExportDataUrl()
    if (!dataUrl) return

    const imgW = 1920
    const imgH = 1080
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [imgW, imgH] })
    pdf.addImage(dataUrl, 'PNG', 0, 0, imgW, imgH)
    pdf.save(`${roomName}.pdf`)
  }

  function handleNodeClick(_, node) {
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }

  function handleEdgeClick(_, edge) {
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
  }

  function handlePaneClick() {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }

  const rightPanel = selectedEdge
    ? <EdgePanel edge={selectedEdge} onChange={onEdgeChange} />
    : <AttributePanel node={selectedNode} onChange={onAttrChange} />

  const saveState = saveStatus === 'saving...' ? 'saving'
    : saveStatus === 'error saving' ? 'error'
    : 'saved'

  return (
    <div className="canvas-page">
      <div className="canvas-topbar">
        <div className="topbar-left">
          <button className="topbar-back" onClick={() => navigate('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <div className="topbar-center">
          <div className={`save-indicator save-indicator--${saveState}`}>
            <span className="save-dot" />
          </div>
          {isOwner && isEditingTitle ? (
            <input
              className="canvas-title-input"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') setIsEditingTitle(false)
              }}
              autoFocus
            />
          ) : (
            <span
              className={`canvas-room-name${isOwner ? ' canvas-room-name--editable' : ''}`}
              onClick={() => isOwner && setIsEditingTitle(true)}
            >
              {roomName}
            </span>
          )}
        </div>
        <div className="topbar-right">
          <div className="topbar-btn-group">
            <button className="topbar-btn" onClick={handleExportPng}>PNG</button>
            <button className="topbar-btn topbar-btn--sep" onClick={handleExportPdf}>PDF</button>
          </div>
          {isOwner && (
            <button className="topbar-share" onClick={handleShare}>
              {shareStatus || 'Share'}
            </button>
          )}
        </div>
      </div>

      <div className="canvas-body">
        <Sidebar />
        <div
          className="canvas-area"
          ref={canvasAreaRef}
          onMouseMove={onMouseMoveCanvas}
          onMouseLeave={onMouseLeaveCanvas}
        >
          <ReactFlow
            colorMode="dark"
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            onNodeDragStop={onNodeDragStop}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { strokeWidth: 1.5 },
              labelBgPadding: [4, 7],
              labelBgBorderRadius: 4,
              labelBgStyle: { fill: '#0d0d11', fillOpacity: 0.95 },
              labelStyle: { fill: '#56565e', fontSize: 10, fontFamily: "'Hanken Grotesk', -apple-system, sans-serif", fontWeight: 500, letterSpacing: '0.3px' },
            }}
          >
            <Background variant="dots" color="#222228" gap={22} size={1} />
            <Controls />
          </ReactFlow>
          {rfInstance && [...remoteCursors.entries()].map(([clientId, cursor]) => {
            const screenPos = rfInstance.flowToScreenPosition(cursor)
            const rect = canvasAreaRef.current?.getBoundingClientRect()
            if (!rect) return null
            const color = cursorColor(clientId)
            return (
              <div key={clientId} className="remote-cursor" style={{ left: screenPos.x - rect.left, top: screenPos.y - rect.top }}>
                <svg width="16" height="20" viewBox="0 0 16 20" fill={color}>
                  <path d="M0 0 L0 16 L4 12 L7 19 L9 18 L6 11 L11 11 Z" />
                </svg>
                {cursor.username && (
                  <div className="remote-cursor-label" style={{ background: color }}>
                    {cursor.username}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {rightPanel}
      </div>
    </div>
  )
}

export default CanvasPage
