import { useState, useCallback } from 'react'
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

// smart default protocol based on what's being connected
function getSmartProtocol(sourceType, targetType) {
  if (targetType === 'Message Queue') return 'Pub/Sub'
  if (sourceType === 'Service' && targetType === 'Service') return 'gRPC'
  if (sourceType === 'Client') return 'HTTPS'
  return ''
}

// smart default mode — async if target is a message queue
function getSmartMode(targetType) {
  if (targetType === 'Message Queue') return 'async'
  return 'sync'
}

let nodeId = 1

function CanvasPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [rfInstance, setRfInstance] = useState(null)

  // track which node or edge is selected — only one at a time
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null

  function onAttrChange(nodeId, key, value) {
    setNodes(nds => nds.map(n =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, attrs: { ...n.data.attrs, [key]: value } } }
        : n
    ))
  }

  // called by EdgePanel when the user changes protocol, mode, or label
  function onEdgeChange(edgeId, key, value) {
    setEdges(eds => eds.map(e => {
      if (e.id !== edgeId) return e
      const newData = { ...e.data, [key]: value }
      return {
        ...e,
        data: newData,
        label: newData.label || newData.protocol || '',
        // async mode = dashed line
        style: { ...e.style, strokeDasharray: newData.mode === 'async' ? '6 3' : undefined },
      }
    }))
  }

  const onConnect = useCallback((params) => {
    // find the source and target node types for smart defaults
    const sourceNode = nodes.find(n => n.id === params.source)
    const targetNode = nodes.find(n => n.id === params.target)
    const sourceType = sourceNode?.data?.nodeType
    const targetType = targetNode?.data?.nodeType

    const protocol = getSmartProtocol(sourceType, targetType)
    const mode = getSmartMode(targetType)

    setEdges(eds => addEdge({
      ...params,
      data: { protocol, mode, label: '' },
      label: protocol,
      style: { strokeDasharray: mode === 'async' ? '6 3' : undefined },
    }, eds))
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

    setNodes(nds => nds.concat({
      id: `${nodeType}-${nodeId++}`,
      type: 'component',
      position,
      data: { nodeType, attrs },
    }))
  }, [rfInstance, setNodes])

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

  // show the right panel depending on what's selected
  const rightPanel = selectedEdge
    ? <EdgePanel edge={selectedEdge} onChange={onEdgeChange} />
    : <AttributePanel node={selectedNode} onChange={onAttrChange} />

  return (
    <div className="canvas-page">
      <div className="canvas-topbar">
        <button className="btn-ghost" onClick={() => navigate('/dashboard')}>← Back</button>
        <span className="canvas-room-name">{slug}</span>
        <div />
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
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        {rightPanel}
      </div>
    </div>
  )
}

export default CanvasPage
