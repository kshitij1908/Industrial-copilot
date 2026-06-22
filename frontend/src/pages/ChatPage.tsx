import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '../hooks/useChat'
import { useVoice } from '../hooks/useVoice'
import { useDocuments } from '../hooks/useDocuments'
import { cn, getConfidenceColor } from '../lib/utils'
import { Send, Mic, FileText, ChevronDown, ChevronRight, Activity, Plus, History } from 'lucide-react'
import { DocumentViewer } from '../components/documents/DocumentViewer'

export default function ChatPage() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat()
  const { documents } = useDocuments()
  const [input, setInput] = useState('')
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({})
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; name: string; page: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { isListening, isSupported, startListening, stopListening } = useVoice((text) => {
    setInput(prev => prev ? `${prev} ${text}` : text)
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const toggleSource = (msgId: string) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }))
  }

  // Pre-defined suggestions based on docs
  const suggestions = documents?.length ? [
    "What is the standard startup procedure?",
    "Show me the latest maintenance records.",
    "Are there any safety warnings for the pumps?",
    "What are the inspection requirements?"
  ] : []

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      
      {/* Left Sidebar - History & Suggestions (Hidden on Mobile) */}
      <div className="hidden md:flex w-72 bg-slate-950 border-r border-slate-800 flex-col">
        <div className="p-4 border-b border-slate-800">
          <button 
            onClick={clearMessages}
            className="w-full flex items-center justify-center gap-2 bg-industrial-600 hover:bg-industrial-500 text-white rounded-lg py-2 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Suggested Questions</h3>
              <div className="space-y-2">
                {suggestions.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => { setInput(q); document.querySelector('textarea')?.focus(); }}
                    className="w-full text-left p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-industrial-500 hover:bg-slate-800 transition-colors text-sm text-slate-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Recent Sessions
            </h3>
            <div className="text-sm text-slate-500 italic px-2">History is automatically saved.</div>
            {/* Real history would map here */}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-900">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-industrial-400" />
              </div>
              <h2 className="text-xl font-medium text-slate-200">FactoryMind</h2>
              <p className="text-slate-400 mt-2 max-w-sm">
                Ask me anything about your uploaded technical documents, SOPs, maintenance records, and equipment.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4",
                  msg.role === 'user' 
                    ? "bg-industrial-600 text-white rounded-br-none" 
                    : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none shadow-sm"
                )}>
                  {msg.isLoading ? (
                    <div className="flex items-center gap-1.5 h-6">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-industrial max-w-none">
                      {/* Simple markdown parsing for the response */}
                      {msg.content.split('\n').map((line, j) => (
                        <p key={j} className="mb-2 last:mb-0">{line}</p>
                      ))}
                    </div>
                  )}

                  {/* Sources Accordion */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <button 
                          onClick={() => toggleSource(msg.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {expandedSources[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          {msg.sources.length} Source{msg.sources.length !== 1 ? 's' : ''}
                        </button>
                        
                        {msg.confidence !== undefined && (
                          <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-900 px-2 py-1 rounded">
                            <span className="text-slate-500">Confidence:</span>
                            <span className={getConfidenceColor(msg.confidence)}>{msg.confidence}%</span>
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {expandedSources[msg.id] && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-2 mt-2"
                          >
                            {msg.sources.map((src, k) => (
                              <div 
                                key={k} 
                                onClick={() => setSelectedDoc({
                                  id: src.document_id,
                                  name: src.document_name,
                                  page: src.page_number
                                })}
                                className="bg-slate-900 hover:bg-slate-800 rounded p-2 text-xs flex items-start gap-2 border border-slate-700 cursor-pointer transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-industrial-400 mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-medium text-slate-300 group-hover:text-industrial-400">{src.document_name}</div>
                                  <div className="text-slate-500 mt-0.5">Page {src.page_number} • Match: {Math.round(src.similarity * 100)}%</div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-4xl mx-auto">
            <div className="relative flex-1 bg-slate-950 border border-slate-700 focus-within:border-industrial-500 rounded-xl shadow-sm transition-colors overflow-hidden">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a technical question..."
                className="w-full max-h-48 min-h-[56px] py-4 pl-4 pr-12 bg-transparent text-slate-200 resize-none outline-none focus:ring-0 placeholder-slate-500"
                rows={1}
                disabled={isLoading}
              />
              {isSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    "absolute right-3 bottom-3 p-1.5 rounded-lg transition-colors",
                    isListening ? "text-red-400 bg-red-400/10" : "text-slate-400 hover:text-slate-200"
                  )}
                  disabled={isLoading}
                >
                  {isListening ? (
                    <span className="relative flex h-5 w-5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <Mic className="relative w-4 h-4" />
                    </span>
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-[56px] px-5 rounded-xl bg-industrial-600 hover:bg-industrial-500 text-white font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-2 text-[10px] text-slate-500">
            AI can make mistakes. Always verify critical procedures against official documents.
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDoc && (
          <DocumentViewer
            documentId={selectedDoc.id}
            documentName={selectedDoc.name}
            initialPage={selectedDoc.page}
            onClose={() => setSelectedDoc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
