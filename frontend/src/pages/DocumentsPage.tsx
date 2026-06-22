import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  Tag,
  Layers,
  AlertTriangle,
  ChevronDown,
  FileUp,
  FolderOpen,
} from 'lucide-react'
import { useDocuments, useDocumentUpload } from '../hooks/useDocuments'

const DOC_TYPES = [
  'SOP', 'P&ID', 'Equipment Manual', 'Maintenance Log',
  'Safety Datasheet', 'Inspection Report', 'Technical Drawing',
  'Calibration Record', 'Incident Report', 'Permit to Work',
  'Process Flow Diagram', 'Vendor Documentation', 'Training Material', 'Other',
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; animate?: boolean }> = {
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
  processing: { label: 'Processing', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20', icon: Loader2, animate: true },
  ready: { label: 'Ready', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle },
}

const STATUS_FILTERS = ['all', 'pending', 'processing', 'ready', 'failed']

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.color}`}>
      <Icon size={11} className={config.animate ? 'animate-spin' : ''} />
      {config.label}
    </span>
  )
}

function DocumentCard({ doc, onDelete }: { doc: any; onDelete: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className='bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors'
    >
      <div className='flex items-start gap-3'>
        <div className='p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg shrink-0'>
          <FileText size={16} className='text-sky-400' />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <p className='text-sm font-medium text-slate-200 truncate'>{doc.name}</p>
            <button
              onClick={() => onDelete(doc.id)}
              className='p-1 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors shrink-0'
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className='flex flex-wrap items-center gap-2 mt-2'>
            <StatusBadge status={doc.status} />
            <span className='text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded'>
              {doc.docType}
            </span>
          </div>

          <div className='flex flex-wrap gap-3 mt-3 text-[10px] text-slate-500'>
            {doc.pageCount && (
              <span className='flex items-center gap-1'>
                <Layers size={10} />
                {doc.pageCount} pages
              </span>
            )}
            {doc.chunkCount && (
              <span className='flex items-center gap-1'>
                <Layers size={10} />
                {doc.chunkCount} chunks
              </span>
            )}
            {doc.equipmentTags?.length > 0 && (
              <span className='flex items-center gap-1'>
                <Tag size={10} />
                {doc.equipmentTags.slice(0, 2).join(', ')}
                {doc.equipmentTags.length > 2 && ` +${doc.equipmentTags.length - 2}`}
              </span>
            )}
            <span className='ml-auto'>{doc.uploadedAt}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function DocumentsPage() {
  const { documents, isLoading: docsLoading, deleteDocument } = useDocuments()
  const { upload, isUploading, progress } = useDocumentUpload()

  const [selectedType, setSelectedType] = useState(DOC_TYPES[0])
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeOpen, setTypeOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const onDrop = useCallback((accepted: File[]) => {
    setPendingFiles((prev) => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
    },
    multiple: true,
  })

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return
    for (const file of pendingFiles) {
      await upload({ files: [file], documentType: selectedType })
    }
    setPendingFiles([])
  }

  const filteredDocs = (documents ?? []).filter(
    (d: any) => statusFilter === 'all' || d.status === statusFilter,
  )

  return (
    <div className='space-y-6 max-w-5xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className='text-xl font-bold text-slate-100'>Documents</h1>
        <p className='text-sm text-slate-500 mt-0.5'>Upload and manage industrial documents</p>
      </motion.div>

      {/* Upload section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='bg-slate-900 border border-slate-800 rounded-xl p-5'
      >
        <h2 className='text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2'>
          <FileUp size={15} className='text-sky-400' />
          Upload New Document
        </h2>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive && !isDragReject
              ? 'border-sky-400 bg-sky-400/5'
              : isDragReject
              ? 'border-red-400 bg-red-400/5'
              : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
          }`}
        >
          <input {...getInputProps()} />

          <motion.div
            animate={{ y: isDragActive ? -4 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {isDragReject ? (
              <AlertTriangle size={32} className='text-red-400 mx-auto mb-3' />
            ) : (
              <Upload
                size={32}
                className={`mx-auto mb-3 ${isDragActive ? 'text-sky-400' : 'text-slate-600'}`}
              />
            )}
            <p className={`text-sm font-medium ${isDragActive ? 'text-sky-400' : 'text-slate-400'}`}>
              {isDragActive && !isDragReject
                ? 'Drop files here...'
                : isDragReject
                ? 'File type not accepted'
                : 'Drag & drop files here, or click to browse'}
            </p>
            <p className='text-xs text-slate-600 mt-1'>PDF, DOCX, TXT, PNG, JPG, TIFF supported</p>
          </motion.div>
        </div>

        {/* Pending files */}
        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='mt-3 space-y-2'
            >
              {pendingFiles.map((file, i) => (
                <div key={i} className='flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg'>
                  <FileText size={14} className='text-sky-400 shrink-0' />
                  <span className='text-xs text-slate-300 flex-1 truncate'>{file.name}</span>
                  <span className='text-[10px] text-slate-500'>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => setPendingFiles((p) => p.filter((_, idx) => idx !== i))}
                    className='text-slate-600 hover:text-red-400'
                  >
                    <XCircle size={13} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls row */}
        <div className='flex flex-wrap items-center gap-3 mt-4'>
          {/* Doc type selector */}
          <div className='relative'>
            <button
              onClick={() => setTypeOpen(!typeOpen)}
              className='flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-slate-600 transition-colors'
            >
              <span>{selectedType}</span>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {typeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className='absolute left-0 top-10 z-20 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden'
                >
                  <div className='max-h-56 overflow-y-auto py-1'>
                    {DOC_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setSelectedType(t); setTypeOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          selectedType === t
                            ? 'bg-sky-500/10 text-sky-400'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upload button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={pendingFiles.length === 0 || isUploading}
            className='flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors'
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className='animate-spin' />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={14} />
                Upload {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}
              </>
            )}
          </motion.button>
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='mt-3'
            >
              <div className='flex justify-between text-xs text-slate-500 mb-1'>
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className='h-1.5 bg-slate-800 rounded-full overflow-hidden'>
                <motion.div
                  className='h-full bg-sky-400 rounded-full'
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className='flex items-center gap-2 flex-wrap'
      >
        <span className='text-xs text-slate-500 mr-1'>Filter:</span>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              statusFilter === f
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            {f}
          </button>
        ))}
        <span className='ml-auto text-xs text-slate-600'>
          {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* Documents grid */}
      {docsLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='h-28 animate-pulse bg-slate-800 rounded-xl' />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='flex flex-col items-center justify-center py-16 text-center'
        >
          <FolderOpen size={48} className='text-slate-700 mb-4' />
          <p className='text-slate-400 font-medium'>No documents found</p>
          <p className='text-sm text-slate-600 mt-1'>
            {statusFilter !== 'all'
              ? `No documents with status "${statusFilter}"`
              : 'Upload your first industrial document above'}
          </p>
        </motion.div>
      ) : (
        <motion.div layout className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <AnimatePresence>
            {filteredDocs.map((doc: any) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={deleteDocument} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
