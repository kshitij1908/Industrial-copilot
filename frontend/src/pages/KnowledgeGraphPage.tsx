import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Search, Network, Info } from 'lucide-react'
import { api } from '../services/api'

// Simple mock graph generator if backend endpoint isn't fully ready
const generateMockGraph = (tag: string) => {
  const nodes = [
    { id: '1', type: 'default', data: { label: tag }, position: { x: 250, y: 150 }, style: { background: 'hsl(199, 89%, 48%)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px' } },
    { id: '2', type: 'default', data: { label: 'Maintenance Record (2023)' }, position: { x: 100, y: 50 }, style: { background: 'hsl(217, 33%, 17%)', color: 'white', border: '1px solid hsl(217, 33%, 30%)', borderRadius: '8px' } },
    { id: '3', type: 'default', data: { label: 'SOP-402' }, position: { x: 400, y: 50 }, style: { background: 'hsl(217, 33%, 17%)', color: 'white', border: '1px solid hsl(217, 33%, 30%)', borderRadius: '8px' } },
    { id: '4', type: 'default', data: { label: 'Inspection Report' }, position: { x: 250, y: 300 }, style: { background: 'hsl(217, 33%, 17%)', color: 'white', border: '1px solid hsl(217, 33%, 30%)', borderRadius: '8px' } },
  ]
  const edges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'hsl(199, 89%, 48%)' } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: 'hsl(199, 89%, 48%)' } },
    { id: 'e1-4', source: '1', target: '4', animated: true, style: { stroke: 'hsl(199, 89%, 48%)' } },
  ]
  return { nodes, edges }
}

export default function KnowledgeGraphPage() {
  const location = useLocation()
  const initialTag = location.state?.tag || ''
  
  const [search, setSearch] = useState(initialTag)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)

  const loadGraph = useCallback(async (tag: string) => {
    if (!tag) return
    setIsLoading(true)
    try {
      // In a real app, this calls the backend
      const res = await api.get(`/graph/${encodeURIComponent(tag)}`).catch(() => null)
      
      if (res && res.data && res.data.nodes.length > 0) {
        setNodes(res.data.nodes)
        setEdges(res.data.edges)
      } else {
        // Fallback to mock data for presentation
        const mock = generateMockGraph(tag)
        setNodes(mock.nodes)
        setEdges(mock.edges)
      }
    } catch (err) {
      console.error("Graph load error", err)
    } finally {
      setIsLoading(false)
    }
  }, [setNodes, setEdges])

  // Load initial graph if provided
  useEffect(() => {
    if (initialTag) {
      loadGraph(initialTag)
    }
  }, [initialTag, loadGraph])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadGraph(search)
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative flex flex-col">
      
      {/* Top Bar for Search */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-4 pointer-events-none">
        <form onSubmit={handleSearch} className="flex-1 max-w-md pointer-events-auto shadow-lg shadow-black/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Enter equipment tag (e.g. P-101)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-industrial-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={isLoading || !search.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-industrial-600 hover:bg-industrial-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </form>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 w-full h-full">
        {nodes.length === 0 && !isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <Network className="w-16 h-16 mb-4 opacity-20 text-industrial-400" />
            <h3 className="text-xl font-medium text-slate-300">Knowledge Graph</h3>
            <p className="mt-2 text-center max-w-md">
              Enter an equipment tag above to visualize its relationships with documents, maintenance events, and other equipment.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#1e293b" gap={16} />
            <Controls className="bg-slate-900 border-slate-800 fill-slate-400" />
            <MiniMap 
              nodeColor={(n) => {
                if (n.style?.background) return n.style.background as string;
                return '#334155';
              }}
              maskColor="rgba(15, 23, 42, 0.7)"
            />
            
            <Panel position="bottom-left" className="bg-slate-900/90 backdrop-blur border border-slate-800 p-4 rounded-xl shadow-lg">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Legend</h4>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-industrial-500"></div> Equipment
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600"></div> Document
                </div>
              </div>
            </Panel>
          </ReactFlow>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-industrial-500 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-slate-200 font-medium tracking-wide animate-pulse">Building Knowledge Graph...</div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Node Info */}
      {selectedNode && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden transform transition-transform duration-300">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-start">
            <div>
              <div className="text-xs text-industrial-400 font-semibold uppercase tracking-wider mb-1">
                {selectedNode.data?.type || 'Node Details'}
              </div>
              <h3 className="text-lg font-bold text-slate-100">{selectedNode.data?.label}</h3>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
            >
              ×
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                {selectedNode.data?.description || `Information about ${selectedNode.data?.label} extracted from the knowledge base.`}
              </div>
            </div>
            
            {selectedNode.data?.metadata && Object.keys(selectedNode.data.metadata).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Metadata</h4>
                <div className="space-y-2">
                  {Object.entries(selectedNode.data.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-slate-300 text-right truncate pl-4">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
