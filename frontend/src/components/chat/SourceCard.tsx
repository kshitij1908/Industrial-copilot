import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Source {
  id: string
  documentName: string
  documentId: string
  pageNumber?: number
  chunkIndex?: number
  similarity: number
  excerpt?: string
}

interface Props {
  sources: Source[]
  className?: string
}

function getSimilarityColor(score: number): string {
  if (score >= 0.85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  if (score >= 0.7) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  return 'text-red-400 bg-red-500/10 border-red-500/30'
}

function getDownloadUrl(documentId: string): string {
  return `/api/documents/${documentId}/download`
}

export function SourceCard({ sources, className }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  return (
    <div className={cn('mt-3 rounded-lg border border-slate-700/60 bg-slate-900/50 overflow-hidden', className)}>
      {/* Header / Toggle */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-industrial-400 shrink-0" />
          <span className="font-semibold text-slate-300">
            {sources.length} Source{sources.length !== 1 ? 's' : ''} Referenced
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 group-hover:text-slate-400 transition-colors">
            {isExpanded ? 'Hide' : 'Show'}
          </span>
          {isExpanded ? (
            <ChevronUp size={13} className="text-slate-500" />
          ) : (
            <ChevronDown size={13} className="text-slate-500" />
          )}
        </div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="source-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-slate-800/80">
              {sources.map((src, idx) => {
                const simPercent = Math.round(src.similarity * 100)
                const simColor = getSimilarityColor(src.similarity)
                const downloadUrl = getDownloadUrl(src.documentId)

                return (
                  <motion.div
                    key={src.id ?? idx}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-slate-800/40 transition-colors group/item"
                  >
                    {/* Doc icon */}
                    <div className="mt-0.5 shrink-0 w-7 h-7 rounded-md bg-industrial-500/10 border border-industrial-500/20 flex items-center justify-center">
                      <FileText size={13} className="text-industrial-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-200 truncate max-w-[160px]">
                          {src.documentName}
                        </span>

                        {src.pageNumber != null && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/70 border border-slate-600/50 text-slate-400">
                            p.{src.pageNumber}
                          </span>
                        )}

                        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border', simColor)}>
                          {simPercent}% match
                        </span>
                      </div>

                      {src.excerpt && (
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                          {src.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Download link */}
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 mt-0.5 p-1 rounded text-slate-600 hover:text-industrial-400 hover:bg-industrial-500/10 opacity-0 group-hover/item:opacity-100 transition-all"
                      title="Open document"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
