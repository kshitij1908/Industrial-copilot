import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  FileSpreadsheet,
  File,
  Image,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Tag,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface DocumentCardData {
  id: string
  name: string
  mimeType: string
  status: DocumentStatus
  equipmentTags?: string[]
  pageCount?: number
  chunkCount?: number
  uploadedAt: string | Date
  errorMessage?: string
}

interface Props {
  document: DocumentCardData
  index?: number
  onDelete?: (id: string) => void
  onDownload?: (id: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FileIcon({ mimeType, size = 18 }: { mimeType: string; size?: number }) {
  if (mimeType === 'application/pdf')
    return <FileText size={size} className="text-red-400" />
  if (mimeType.includes('word'))
    return <FileText size={size} className="text-blue-400" />
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <FileSpreadsheet size={size} className="text-emerald-400" />
  if (mimeType.startsWith('image/'))
    return <Image size={size} className="text-violet-400" />
  return <File size={size} className="text-slate-400" />
}

function mimeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word')) return 'DOCX'
  if (mimeType.includes('sheet')) return 'XLSX'
  if (mimeType.startsWith('image/')) return mimeType.split('/')[1].toUpperCase()
  return 'TXT'
}

function mimeLabelColor(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'text-red-400 bg-red-500/10 border-red-500/30'
  if (mimeType.includes('word')) return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  if (mimeType.includes('sheet')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  if (mimeType.startsWith('image/')) return 'text-violet-400 bg-violet-500/10 border-violet-500/30'
  return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
}

function tagColor(tag: string): string {
  const prefix = tag.charAt(0).toUpperCase()
  const map: Record<string, string> = {
    P: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    V: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    C: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
    B: 'bg-red-500/15 border-red-500/30 text-red-400',
    E: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
  }
  return map[prefix] ?? 'bg-slate-500/15 border-slate-500/30 text-slate-400'
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg: Record<DocumentStatus, { icon: React.ReactNode; label: string; classes: string }> = {
    pending: {
      icon: <Clock size={11} className="text-amber-400" />,
      label: 'Pending',
      classes: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    },
    processing: {
      icon: (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={11} className="text-blue-400" />
        </motion.div>
      ),
      label: 'Processing',
      classes: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    },
    ready: {
      icon: <CheckCircle size={11} className="text-emerald-400" />,
      label: 'Ready',
      classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    },
    failed: {
      icon: <XCircle size={11} className="text-red-400" />,
      label: 'Failed',
      classes: 'bg-red-500/10 border-red-500/30 text-red-400',
    },
  }

  const { icon, label, classes } = cfg[status]

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold', classes)}>
      {icon}
      {label}
    </span>
  )
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 rounded-xl flex items-center justify-center backdrop-blur-sm bg-slate-900/80"
    >
      <div className="text-center px-4">
        <XCircle size={24} className="text-red-400 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-200 mb-0.5">Delete document?</p>
        <p className="text-[10px] text-slate-500 mb-3 truncate max-w-[160px] mx-auto">{name}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const MAX_VISIBLE_TAGS = 3

export function DocumentCard({ document, index = 0, onDelete, onDownload }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const visibleTags = document.equipmentTags?.slice(0, MAX_VISIBLE_TAGS) ?? []
  const extraTags = (document.equipmentTags?.length ?? 0) - MAX_VISIBLE_TAGS

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'relative rounded-xl border bg-slate-800/60 backdrop-blur-sm overflow-hidden',
        'transition-all duration-200',
        document.status === 'ready'
          ? 'border-slate-700/50 hover:border-industrial-500/40 hover:shadow-[0_0_20px_rgba(14,165,233,0.08)]'
          : document.status === 'failed'
            ? 'border-red-500/30 hover:border-red-500/50'
            : 'border-slate-700/50'
      )}
    >
      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <DeleteConfirm
          name={document.name}
          onConfirm={() => { setConfirmDelete(false); onDelete?.(document.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* File type icon */}
          <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-700/50 border border-slate-600/40 flex items-center justify-center">
            <FileIcon mimeType={document.mimeType} size={20} />
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">{document.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold', mimeLabelColor(document.mimeType))}>
                {mimeLabel(document.mimeType)}
              </span>
              <StatusBadge status={document.status} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onDownload?.(document.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-industrial-400 hover:bg-industrial-500/10 transition-all"
              title="Download"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {document.status === 'failed' && document.errorMessage && (
          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 text-[11px] text-red-400 leading-snug">
            {document.errorMessage}
          </div>
        )}

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
          {document.pageCount != null && (
            <span>{document.pageCount} pages</span>
          )}
          {document.chunkCount != null && (
            <>
              <span className="text-slate-700">·</span>
              <span>{document.chunkCount} chunks</span>
            </>
          )}
          <span className="text-slate-700">·</span>
          <span>{formatDate(document.uploadedAt)}</span>
        </div>

        {/* Equipment tags */}
        {visibleTags.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <Tag size={11} className="text-slate-600 shrink-0" />
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-semibold', tagColor(tag))}
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-slate-600/40 bg-slate-700/40 text-[10px] text-slate-400">
                <MoreHorizontal size={9} />+{extraTags}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
