import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEquipmentList, useEquipmentSearch, useEquipmentDetail } from '../hooks/useEquipment'
import { formatDate } from '../lib/utils'
import { Search, Server, Cpu, Database, Droplet, Flame, Wind, Maximize2, FileText, ArrowRight, X, Activity, Loader2 } from 'lucide-react'
import { api } from '../services/api'

// Map equipment types to specific icons and colors
const getEquipmentIcon = (type: string) => {
  const t = type.toLowerCase()
  if (t.includes('pump')) return { icon: Droplet, color: 'text-blue-400', bg: 'bg-blue-500/10' }
  if (t.includes('valve')) return { icon: Server, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  if (t.includes('compressor')) return { icon: Wind, color: 'text-amber-400', bg: 'bg-amber-500/10' }
  if (t.includes('boiler') || t.includes('heat')) return { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' }
  if (t.includes('tank')) return { icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
  return { icon: Cpu, color: 'text-slate-400', bg: 'bg-slate-500/10' }
}

export default function EquipmentPage() {
  const { tag } = useParams()
  const navigate = useNavigate()
  const [selectedTag, setSelectedTag] = useState<string | null>(tag || null)
  
  const { data: equipmentList = [], isLoading: isLoadingList } = useEquipmentList()
  const { query, setQuery, results: searchResults, isLoading: isSearching } = useEquipmentSearch()
  
  // Use the selected tag for detail view, or the first item if no specific tag is selected
  const activeTag = selectedTag || (equipmentList.length > 0 ? equipmentList[0].tag : undefined)
  const { data: detailData, isLoading: isLoadingDetail } = useEquipmentDetail(activeTag)

  const [rcaData, setRcaData] = useState<{ analysis: string; chunks_used: number } | null>(null)
  const [isLoadingRca, setIsLoadingRca] = useState(false)
  const [rcaError, setRcaError] = useState<string | null>(null)

  // Clear RCA context when selected tag changes
  useEffect(() => {
    setRcaData(null)
    setRcaError(null)
  }, [activeTag])

  // Determine what list to show
  const displayList = query.length >= 2 ? searchResults : equipmentList

  // Update URL and state when selecting
  const handleSelect = (t: string) => {
    setSelectedTag(t)
    setRcaData(null)
    setRcaError(null)
    window.history.replaceState(null, '', `/equipment/${t}`)
  }

  const handleGenerateRca = async () => {
    if (!activeTag) return
    setIsLoadingRca(true)
    setRcaError(null)
    setRcaData(null)
    try {
      const response = await api.post('/chat/root-cause', { equipment_tag: activeTag })
      if (response.data.error) {
        setRcaError(response.data.error)
      } else {
        setRcaData(response.data)
      }
    } catch (err: any) {
      console.error(err)
      setRcaError(err.message || 'Failed to generate root cause analysis')
    } finally {
      setIsLoadingRca(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left Column - List/Search */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search tags (e.g. P-101)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-industrial-500 transition-colors"
            />
            {query.length > 0 && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            {displayList.length} EQUIPMENT FOUND
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingList || isSearching ? (
            <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
          ) : displayList.length === 0 ? (
            <div className="p-8 text-center">
              <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <div className="text-sm text-slate-400">No equipment found</div>
            </div>
          ) : (
            displayList.map((eq: any, i: number) => {
              const { icon: Icon, color, bg } = getEquipmentIcon(eq.equipment_type)
              const isActive = activeTag === eq.tag
              
              return (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={eq.tag}
                  onClick={() => handleSelect(eq.tag)}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${
                    isActive 
                      ? 'bg-industrial-500/20 border border-industrial-500/50' 
                      : 'bg-transparent border border-transparent hover:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-md ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${isActive ? 'text-industrial-400' : 'text-slate-200'}`}>
                      {eq.tag}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{eq.equipment_type}</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {eq.access_count || (eq as any).document_count || 0} docs
                  </div>
                </motion.button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Column - Details */}
      <div className="w-full md:w-2/3 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative">
        {!activeTag ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <Maximize2 className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-slate-300">No Equipment Selected</h3>
            <p className="mt-1">Select an equipment tag from the list to view its details and related documentation.</p>
          </div>
        ) : isLoadingDetail ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-industrial-500 border-t-transparent rounded-full animate-spin mb-4" />
              Loading details for {activeTag}...
            </div>
          </div>
        ) : detailData ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTag}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${getEquipmentIcon(detailData.equipment_type).bg}`}>
                      {(() => {
                        const Icon = getEquipmentIcon(detailData.equipment_type).icon
                        return <Icon className={`w-8 h-8 ${getEquipmentIcon(detailData.equipment_type).color}`} />
                      })()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{detailData.tag}</h2>
                      <p className="text-industrial-400 font-medium">{detailData.equipment_type}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/graph', { state: { tag: detailData.tag } })}
                    className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
                  >
                    View in Graph <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                {detailData.description && (
                  <p className="mt-4 text-slate-400 text-sm max-w-2xl">
                    {detailData.description}
                  </p>
                )}
                
                <div className="flex gap-4 mt-6 text-sm">
                  <div className="bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800 text-slate-400">
                    <span className="font-medium text-slate-300">{detailData.documents?.length || 0}</span> Related Documents
                  </div>
                  <div className="bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800 text-slate-400">
                    <span className="font-medium text-slate-300">{detailData.access_count}</span> Queries
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Referenced Documentation</h3>
                
                {(!detailData.documents || detailData.documents.length === 0) ? (
                  <div className="text-center p-8 border border-dashed border-slate-700 rounded-lg bg-slate-950/50">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No documents found referencing this equipment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {detailData.documents.map((doc: any, i: number) => (
                      <div key={doc.id || i} className="bg-slate-800/40 hover:bg-slate-800 p-4 rounded-lg border border-slate-700/50 transition-colors group cursor-pointer">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-industrial-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <h4 className="text-slate-200 font-medium truncate group-hover:text-industrial-400 transition-colors">
                              {doc.original_name || doc.document_name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800">
                                {doc.document_type || 'Document'}
                              </span>
                              {doc.upload_date && <span>{formatDate(doc.upload_date).split(',')[0]}</span>}
                              {doc.page_count !== undefined && <span>{doc.page_count} pages</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Simulated Recent Queries Section */}
                <div className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => navigate('/chat', { state: { initialQuery: `What is the startup procedure for ${detailData.tag}?` } })}
                      className="text-sm bg-industrial-600/20 text-industrial-300 hover:bg-industrial-600/30 px-4 py-2 rounded-lg border border-industrial-500/30 transition-colors"
                    >
                      Ask about startup procedure
                    </button>
                    <button 
                      onClick={() => navigate('/chat', { state: { initialQuery: `Show me the maintenance history for ${detailData.tag}` } })}
                      className="text-sm bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 px-4 py-2 rounded-lg border border-emerald-500/30 transition-colors"
                    >
                      View maintenance history
                    </button>
                    <button 
                      onClick={() => navigate('/chat', { state: { initialQuery: `Perform a root cause analysis on failures for ${detailData.tag}` } })}
                      className="text-sm bg-red-600/20 text-red-300 hover:bg-red-600/30 px-4 py-2 rounded-lg border border-red-500/30 transition-colors"
                    >
                      Analyze root causes
                    </button>
                  </div>
                </div>

                {/* Reliability Root Cause Analysis Panel */}
                <div className="mt-8 border-t border-slate-800 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Reliability Root Cause Analysis (RCA)</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Synthesize historical maintenance failures to diagnose root causes</p>
                    </div>
                    <button 
                      onClick={handleGenerateRca}
                      disabled={isLoadingRca}
                      className="text-sm bg-red-600/80 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors border border-red-500/30 shadow-md shadow-red-500/10 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoadingRca ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing Logs...
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4" />
                          Perform RCA
                        </>
                      )}
                    </button>
                  </div>

                  {isLoadingRca && (
                    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                      <p className="text-sm text-slate-400 font-medium">Performing reliability RCA for {detailData.tag}...</p>
                      <p className="text-xs text-slate-500 max-w-md">Scanning uploaded inspection sheets, maintenance records, and engineering logs...</p>
                    </div>
                  )}

                  {rcaError && (
                    <div className="bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg p-4 text-sm mt-3">
                      Error performing analysis: {rcaError}
                    </div>
                  )}

                  {rcaData && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-950/80 border border-red-500/20 rounded-xl p-6 shadow-xl relative overflow-hidden mt-4"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
                        <Activity className="w-4.5 h-4.5 text-red-400" />
                        <h4 className="font-bold text-slate-200">AI Reliability Diagnosis</h4>
                        <span className="ml-auto text-[10px] bg-red-950 text-red-400 border border-red-900/50 px-2 py-0.5 rounded font-mono">
                          {rcaData.chunks_used} Documents Referenced
                        </span>
                      </div>
                      <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                        {rcaData.analysis}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Error loading equipment details.
          </div>
        )}
      </div>
    </div>
  )
}
