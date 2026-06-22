import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Configure pdfjs worker dynamically from standard CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface DocumentViewerProps {
  documentId: string
  documentName: string
  initialPage?: number | string
  onClose: () => void
}

export function DocumentViewer({
  documentId,
  documentName,
  initialPage = 1,
  onClose,
}: DocumentViewerProps) {
  // Ensure page number is a valid integer
  const startPage = typeof initialPage === 'string' ? parseInt(initialPage, 10) : initialPage
  const parsedStartPage = isNaN(startPage) ? 1 : startPage

  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState<number>(parsedStartPage)
  const [zoom, setZoom] = useState<number>(1.0)
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Construct PDF URL and fetch PDF binary
  useEffect(() => {
    setPdfUrl(`/api/documents/${documentId}/download`)
    setPageNumber(parsedStartPage)
    setLoading(true)
    setError(null)
  }, [documentId, parsedStartPage])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    // Validate if the startPage exceeds the total pages
    if (parsedStartPage > numPages) {
      setPageNumber(1)
    }
  }

  const onDocumentLoadError = (err: Error) => {
    console.error('Failed to load PDF:', err)
    setError(err.message || 'Failed to load PDF document')
    setLoading(false)
  }

  const changePage = (offset: number) => {
    if (!numPages) return
    setPageNumber((prev) => {
      const next = prev + offset
      return Math.min(Math.max(next, 1), numPages)
    })
  }

  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(Math.max(prev + factor, 0.5), 2.5))
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 md:p-6'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className='relative flex flex-col w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl'
      >
        {/* Header Controls */}
        <div className='flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-950 border-b border-slate-800'>
          <div className='min-w-0 flex-1'>
            <h3 className='text-sm font-semibold text-slate-200 truncate'>{documentName}</h3>
            <p className='text-xs text-slate-500 mt-0.5 font-mono'>Document ID: {documentId}</p>
          </div>

          {/* Navigation Controls */}
          {numPages && (
            <div className='flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800'>
              <button
                disabled={pageNumber <= 1}
                onClick={() => changePage(-1)}
                className='p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors'
                title='Previous Page'
              >
                <ChevronLeft size={16} />
              </button>
              <span className='text-xs text-slate-300 font-medium font-mono min-w-[70px] text-center'>
                Page {pageNumber} / {numPages}
              </span>
              <button
                disabled={pageNumber >= numPages}
                onClick={() => changePage(1)}
                className='p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors'
                title='Next Page'
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Zoom & Action Controls */}
          <div className='flex items-center gap-2'>
            <div className='flex items-center bg-slate-900 px-2 py-1 rounded-lg border border-slate-800'>
              <button
                onClick={() => handleZoom(-0.1)}
                className='p-1 text-slate-400 hover:text-slate-100 transition-colors'
                title='Zoom Out'
              >
                <ZoomOut size={16} />
              </button>
              <span className='text-xs text-slate-300 font-mono font-medium px-2 min-w-[48px] text-center'>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                className='p-1 text-slate-400 hover:text-slate-100 transition-colors'
                title='Zoom In'
              >
                <ZoomIn size={16} />
              </button>
            </div>

            <a
              href={pdfUrl}
              download={documentName}
              className='p-2 text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 transition-all'
              title='Download Document'
            >
              <Download size={16} />
            </a>

            <button
              onClick={onClose}
              className='p-2 text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-500/10 rounded-lg border border-slate-800 hover:border-red-500/30 transition-all ml-2'
              title='Close Viewer'
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PDF Body Container */}
        <div className='flex-1 overflow-auto bg-slate-950 p-6 flex justify-center items-start'>
          {loading && (
            <div className='flex flex-col items-center justify-center h-full w-full py-12 text-slate-500'>
              <Loader2 className='w-8 h-8 text-industrial-500 animate-spin mb-3' />
              <p className='text-sm'>Rendering document pages...</p>
            </div>
          )}

          {error && (
            <div className='flex flex-col items-center justify-center h-full w-full py-12 text-center text-red-400 max-w-md mx-auto'>
              <div className='bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4'>
                <p className='text-sm font-semibold mb-1'>Error loading document</p>
                <p className='text-xs text-red-300'>{error}</p>
              </div>
              <button
                onClick={onClose}
                className='text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 transition-colors'
              >
                Go Back
              </button>
            </div>
          )}

          <div className='shadow-2xl border border-slate-800/80 rounded-lg overflow-hidden bg-white'>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null} // Suppress default loaders
            >
              {!loading && !error && (
                <Page
                  pageNumber={pageNumber}
                  scale={zoom}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              )}
            </Document>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
