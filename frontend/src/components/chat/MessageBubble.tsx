import { motion } from 'framer-motion'
import { Settings, User, Copy, Check } from 'lucide-react'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ConfidenceBadge } from './ConfidenceBadge'
import { SourceCard, type Source } from './SourceCard'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  isLoading?: boolean
  confidence?: number
  sources?: Source[]
  equipmentTags?: string[]
}

interface Props {
  message: ChatMessage
  index?: number
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-industrial-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── Code block renderer ─────────────────────────────────────────────────────

function renderContent(text: string) {
  // Split on fenced code blocks: ```lang\n...\n```
  const parts = text.split(/(```[\s\S]*?```)/g)

  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.split('\n')
      const lang = lines[0].replace('```', '').trim() || 'text'
      const code = lines.slice(1, -1).join('\n')
      return (
        <div key={i} className="my-3 rounded-lg overflow-hidden border border-slate-700/60">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{lang}</span>
          </div>
          <pre className="overflow-x-auto p-3 bg-slate-900/80 text-sm">
            <code className="font-mono text-slate-200 text-[12.5px] leading-relaxed">{code}</code>
          </pre>
        </div>
      )
    }

    // Render line breaks for normal text
    return (
      <span key={i}>
        {part.split('\n').map((line, li, arr) => (
          <span key={li}>
            {line}
            {li < arr.length - 1 && <br />}
          </span>
        ))}
      </span>
    )
  })
}

// ─── Equipment tag chip ───────────────────────────────────────────────────────

function tagColor(tag: string) {
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

// ─── Main component ───────────────────────────────────────────────────────────

export function MessageBubble({ message, index = 0 }: Props) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold mt-1',
          isUser
            ? 'bg-industrial-600/30 border-industrial-500/40 text-industrial-300'
            : 'bg-slate-800/80 border-slate-600/50 text-slate-400'
        )}
      >
        {isUser ? (
          <User size={15} className="text-industrial-400" />
        ) : (
          <motion.div
            animate={message.isLoading ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: message.isLoading ? Infinity : 0, ease: 'linear' }}
          >
            <Settings size={15} className="text-industrial-400" />
          </motion.div>
        )}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1 max-w-[78%]', isUser ? 'items-end' : 'items-start')}>
        <motion.div
          className={cn(
            'relative rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-industrial-600/30 border border-industrial-500/30 text-slate-100 rounded-tr-sm'
              : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-sm'
          )}
          whileHover={{ scale: 1.003 }}
          transition={{ duration: 0.15 }}
        >
          {message.isLoading ? (
            <TypingDots />
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words">{renderContent(message.content)}</div>

              {/* Copy button (assistant only) */}
              {!isUser && (
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                  title="Copy message"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              )}
            </>
          )}
        </motion.div>

        {/* Assistant extras: confidence + sources + equipment tags */}
        {!isUser && !message.isLoading && (
          <>
            {message.confidence != null && (
              <div className="px-1">
                <ConfidenceBadge score={message.confidence} showBar />
              </div>
            )}

            {message.equipmentTags && message.equipmentTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {message.equipmentTags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      tagColor(tag)
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {message.sources && message.sources.length > 0 && (
              <div className="w-full px-1">
                <SourceCard sources={message.sources} />
              </div>
            )}
          </>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-600 px-1">{formattedTime}</span>
      </div>
    </motion.div>
  )
}
