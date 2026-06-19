import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge } from '@xyflow/react'
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

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesState] = useEdgesState([])
  const [rfInstance, setRfInstance] = useState(null)
  const [roomName, setRoomName] = useState(slug)
  const [saveStatus, setSaveStatus] = useState('saved')

  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null

  // ref to hold the debounce timer so we can clear it between changes
  const saveTimer = useRef(null)

  // load canvas state on mount
  useEffect(() => {
    const token = localStorage.getItem('token')

    async function loadRoom() {
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
        const { nodes: savedNodes, edges: savedEdges } = data.room.canvas_state
        if (savedNodes.length) setNodes(savedNodes)
        if (savedEdges.length) setEdges(savedEdges)
      } catch (err) {
        console.error(err)
      }
    }

    loadRoom()
  }, [slug])

  // debounced save — waits 1.5s after last change before saving
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

  function onAttrChange(nodeId, key, value) {
    setNodes(nds => {
      const updated = nds.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, attrs: { ...n.data.attrs, [key]: value } } }
          : n
      )
      saveCanvas(updated, edges)
      return updated
    })
  }

  function onEdgeChange(edgeId, key, value) {
    setEdges(eds => {
      const updated = eds.map(e => {
        if (e.id !== edgeId) return e
        const newData = { ...e.data, [key]: value }
        return {
          ...e,
          data: newData,
          label: newData.label || newData.protocol || '',
          style: { ...e.style, strokeDasharray: newData.mode === 'async' ? '6 3' : undefined },
        }
      })
      saveCanvas(nodes, updated)
      return updated
    })
  }

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source)
    const targetNode = nodes.find(n => n.id === params.target)
    const sourceType = sourceNode?.data?.nodeType
    const targetType = targetNode?.data?.nodeType

    const protocol = getSmartProtocol(sourceType, targetType)
    const mode = getSmartMode(targetType)

    setEdges(eds => {
      const updated = addEdge({
        ...params,
        data: { protocol, mode, label: '' },
        label: protocol,
        style: { strokeDasharray: mode === 'async' ? '6 3' : undefined },
      }, eds)
      saveCanvas(nodes, updated)
      return updated
    })
  }, [nodes, setEdges])

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

    setNodes(nds => {
      const updated = nds.concat({
        id: `${nodeType}-${nodeId++}`,
        type: 'component',
        position,
        data: { nodeType, attrs },
      })
      saveCanvas(updated, edges)
      return updated
    })
  }, [rfInstance, setNodes, edges])

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
            onEdgesChange={onEdgesState}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
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
