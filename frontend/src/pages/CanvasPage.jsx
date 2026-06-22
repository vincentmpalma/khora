import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge } from '@xyflow/react'
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

function getSmartProtocol(sourceType, targetType) {
  if (targetType === 'Message Queue') return 'Pub/Sub'
  if (sourceType === 'Service' && targetType === 'Service') return 'gRPC'
  if (sourceType === 'Client') return 'HTTPS'
  return ''
}

function getSmartMode(targetType) {
  if (targetType === 'Message Queue') return 'async'
  return 'sync'
}

let nodeId = 1

function CanvasPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  // react flow manages its own internal state for drag, selection, etc.
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [rfInstance, setRfInstance] = useState(null)
  const [roomName, setRoomName] = useState(slug)
  const [saveStatus, setSaveStatus] = useState('saved')

  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null

  // refs to yjs objects so mutation handlers can access them without stale closures
  const ydocRef = useRef(null)
  const yNodesRef = useRef(null)
  const yEdgesRef = useRef(null)
  const saveTimer = useRef(null)

  // debounced save — waits 1.5s after last change before writing to the database
  function saveCanvas(updatedNodes, updatedEdges) {
    setSaveStatus('saving...')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const token = localStorage.getItem('token')
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/rooms/${slug}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
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

    const token = localStorage.getItem('token')

    async function init() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms/${slug}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()

        if (!response.ok) {
          navigate('/dashboard')
          return
        }

        setRoomName(data.room.name)

        // load initial canvas state directly into react state so the canvas renders immediately
        // yjs handles changes after this — this is just the initial paint
        const { nodes: savedNodes, edges: savedEdges } = data.room.canvas_state
        if (savedNodes.length) setNodes(savedNodes)
        if (savedEdges.length) setEdges(savedEdges)

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

        // observe yNodes — fires whenever nodes change (local or remote)
        // this is how react state stays in sync with the yjs doc after the initial load
        yNodes.observe(() => {
          const arr = yNodes.toArray()
          setNodes(arr)
          saveCanvas(arr, yEdges.toArray())
        })

        // same for edges
        yEdges.observe(() => {
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
    const mode = getSmartMode(targetType)

    const newEdge = {
      ...params,
      id: `edge-${crypto.randomUUID()}`,
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
      id: `${nodeType}-${nodeId++}`,
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

  return (
    <div className="canvas-page">
      <div className="canvas-topbar">
        <button className="btn-ghost" onClick={() => navigate('/dashboard')}>← Back</button>
        <span className="canvas-room-name">{roomName}</span>
        <span className="canvas-save-status">{saveStatus}</span>
      </div>

      <div className="canvas-body">
        <Sidebar />
        <div className="canvas-area">
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
          >
            <Background variant="dots" color="#1e1e22" gap={20} size={1.2} />
            <Controls />
          </ReactFlow>
        </div>
        {rightPanel}
      </div>
    </div>
  )
}

export default CanvasPage
