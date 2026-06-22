import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /** Called with the recognised transcript when speech ends */
  onTranscript?: (text: string) => void
  /** Large variant for mobile FAB usage */
  size?: 'normal' | 'large'
  disabled?: boolean
  className?: string
}

// ─── Browser support check ────────────────────────────────────────────────────

function isSpeechRecognitionSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition)
  )
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 shadow-xl pointer-events-none"
          >
            {label}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VoiceButton({ onTranscript, size = 'normal', disabled = false, className }: Props) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(isSpeechRecognitionSupported)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Build recognition instance once
  useEffect(() => {
    if (!isSupported) return
    const SRConstructor =
      window.SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    const recognition = new SRConstructor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .trim()
      onTranscript?.(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [isSupported, onTranscript])

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  const sizeClasses =
    size === 'large'
      ? 'w-14 h-14 rounded-full text-base'
      : 'w-9 h-9 rounded-lg text-sm'

  const tooltipLabel = !isSupported
    ? 'Voice not supported in this browser'
    : isListening
      ? 'Click to stop recording'
      : 'Click to speak'

  return (
    <Tooltip label={tooltipLabel}>
      <div className="relative">
        {/* Pulsing ring when listening */}
        <AnimatePresence>
          {isListening && (
            <motion.span
              key="pulse-ring"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.55, 1] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-red-500 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <motion.button
          onClick={isSupported ? toggle : undefined}
          disabled={disabled || !isSupported}
          whileTap={isSupported ? { scale: 0.92 } : {}}
          whileHover={isSupported ? { scale: 1.06 } : {}}
          transition={{ duration: 0.15 }}
          className={cn(
            'relative flex items-center justify-center border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-industrial-400',
            sizeClasses,
            isListening
              ? 'bg-red-600/20 border-red-500/60 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
              : isSupported
                ? 'bg-slate-800/70 border-slate-600/50 text-slate-300 hover:bg-industrial-600/20 hover:border-industrial-500/50 hover:text-industrial-300'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-600 cursor-not-allowed',
            className
          )}
          title={tooltipLabel}
          aria-label={tooltipLabel}
        >
          {!isSupported ? (
            <AlertCircle size={size === 'large' ? 22 : 16} />
          ) : isListening ? (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MicOff size={size === 'large' ? 22 : 16} />
            </motion.div>
          ) : (
            <Mic size={size === 'large' ? 22 : 16} />
          )}
        </motion.button>
      </div>
    </Tooltip>
  )
}
