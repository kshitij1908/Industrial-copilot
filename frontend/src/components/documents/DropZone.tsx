import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  File,
  Image,
  X,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  className?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACCEPT_MAP = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType === 'application/pdf')
    return <FileText className={cn('text-red-400', className)} />
  if (mimeType.includes('word'))
    return <FileText className={cn('text-blue-400', className)} />
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <FileSpreadsheet className={cn('text-emerald-400', className)} />
  if (mimeType.startsWith('image/'))
    return <Image className={cn('text-violet-400', className)} />
  return <File className={cn('text-slate-400', className)} />
}

function mimeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word')) return 'DOCX'
  if (mimeType.includes('sheet')) return 'XLSX'
  if (mimeType.startsWith('image/')) return mimeType.split('/')[1].toUpperCase()
  return 'TXT'
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DropZone({ onFilesSelected, disabled = false, maxFiles = 20, className }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [rejections, setRejections] = useState<FileRejection[]>([])

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setRejections(rejected)
      const merged = [...files, ...accepted].slice(0, maxFiles)
      setFiles(merged)
      onFilesSelected(merged)
    },
    [files, maxFiles, onFilesSelected]
  )

  const removeFile = useCallback(
    (index: number) => {
      const next = files.filter((_, i) => i !== index)
      setFiles(next)
      onFilesSelected(next)
    },
    [files, onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT_MAP,
    maxFiles,
    disabled,
    multiple: true,
  })

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Drop zone area */}
      <div {...getRootProps()} className="outline-none">
        <motion.div
          animate={isDragActive ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.18 }}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4',
            'rounded-xl border-2 border-dashed px-6 py-12 text-center cursor-pointer',
            'transition-all duration-200 select-none outline-none',
            isDragActive
              ? 'border-industrial-400 bg-industrial-500/8 shadow-[0_0_30px_rgba(14,165,233,0.15)]'
              : disabled
                ? 'border-slate-700/40 bg-slate-800/20 cursor-not-allowed opacity-50'
                : 'border-slate-600/50 bg-slate-800/30 hover:border-industrial-500/60 hover:bg-industrial-600/8 hover:shadow-[0_0_20px_rgba(14,165,233,0.08)]'
          )}
        >
          <input {...getInputProps()} />

        {/* Upload icon */}
        <motion.div
          animate={isDragActive ? { y: -4 } : { y: 0 }}
          transition={{ duration: 0.3, repeat: isDragActive ? Infinity : 0, repeatType: 'reverse' }}
        >
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center border',
              isDragActive
                ? 'bg-industrial-500/20 border-industrial-500/50 shadow-[0_0_20px_rgba(14,165,233,0.25)]'
                : 'bg-slate-700/40 border-slate-600/40'
            )}
          >
            <UploadCloud
              size={32}
              className={cn(
                'transition-colors duration-200',
                isDragActive ? 'text-industrial-400' : 'text-slate-400'
              )}
            />
          </div>
        </motion.div>

        <div>
          <p className={cn('text-sm font-semibold', isDragActive ? 'text-industrial-300' : 'text-slate-200')}>
            {isDragActive ? 'Release to drop files' : 'Drop files here or click to browse'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Supports PDF, DOCX, XLSX, TXT, PNG, JPG
          </p>
          {maxFiles && (
            <p className="mt-0.5 text-xs text-slate-600">
              Up to {maxFiles} files at a time
            </p>
          )}
        </div>

        {/* Drag overlay glow */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-xl pointer-events-none ring-2 ring-industrial-400/50 ring-offset-0"
            />
          )}
        </AnimatePresence>
      </motion.div>
      </div>

      {/* Rejection errors */}
      <AnimatePresence>
        {rejections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <div>
              {rejections.slice(0, 3).map((rej, i) => (
                <p key={i}>
                  <span className="font-semibold">{rej.file.name}</span> —{' '}
                  {rej.errors.map((e) => e.message).join(', ')}
                </p>
              ))}
              {rejections.length > 3 && (
                <p className="text-red-500">…and {rejections.length - 3} more</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected file list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-2"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            {files.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, height: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/60 transition-colors"
              >
                {/* Icon */}
                <div className="shrink-0 w-8 h-8 rounded-md bg-slate-700/60 border border-slate-600/40 flex items-center justify-center">
                  <FileTypeIcon mimeType={file.type} className="w-4 h-4" />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">{formatBytes(file.size)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/40 text-slate-400 font-medium">
                      {mimeLabel(file.type)}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="shrink-0 p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove file"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
