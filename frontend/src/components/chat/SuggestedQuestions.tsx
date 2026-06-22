import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Lightbulb, Wrench, Shield, BookOpen, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuggestionCategory = 'Maintenance' | 'Safety' | 'SOP' | 'Troubleshooting' | 'General'

export interface SuggestedQuestion {
  id: string
  question: string
  category: SuggestionCategory
}

interface Props {
  onSelect: (question: string) => void
  className?: string
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  SuggestionCategory,
  { color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  Maintenance: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <Wrench size={10} />,
  },
  Safety: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: <Shield size={10} />,
  },
  SOP: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: <BookOpen size={10} />,
  },
  Troubleshooting: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: <Zap size={10} />,
  },
  General: {
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    icon: <Lightbulb size={10} />,
  },
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ width }: { width: string }) {
  return (
    <div
      className="h-10 rounded-lg bg-slate-800/60 animate-pulse"
      style={{ width }}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SuggestedQuestions({ onSelect, className }: Props) {
  const { data, isLoading, isError } = useQuery<SuggestedQuestion[]>({
    queryKey: ['chat-suggestions'],
    queryFn: async () => {
      const res = await axios.get<SuggestedQuestion[]>('/api/chat/suggestions')
      return res.data
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 2,
  })

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Title */}
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-industrial-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
          Suggested Questions
        </span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          <SkeletonRow width="90%" />
          <SkeletonRow width="75%" />
          <SkeletonRow width="85%" />
          <SkeletonRow width="65%" />
          <SkeletonRow width="80%" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <p className="text-xs text-slate-500 italic">Unable to load suggestions.</p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="flex flex-col items-center gap-2 py-6 text-slate-600">
          <Lightbulb size={24} />
          <span className="text-xs">No suggestions yet.</span>
        </div>
      )}

      {/* Question list */}
      <AnimatePresence>
        {!isLoading && data && data.length > 0 && (
          <motion.div
            className="flex flex-col gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {data.map((item, i) => {
              const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.General
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  onClick={() => onSelect(item.question)}
                  className={cn(
                    'group w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left',
                    'border border-transparent',
                    'bg-slate-800/40 hover:bg-industrial-600/15 hover:border-industrial-500/30',
                    'transition-all duration-200 text-xs text-slate-300 hover:text-slate-100'
                  )}
                >
                  {/* Category badge */}
                  <span
                    className={cn(
                      'shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold',
                      cfg.bg,
                      cfg.border,
                      cfg.color
                    )}
                  >
                    {cfg.icon}
                    <span className="hidden sm:inline">{item.category}</span>
                  </span>

                  {/* Question text */}
                  <span className="flex-1 leading-snug line-clamp-2">{item.question}</span>

                  {/* Arrow */}
                  <ChevronRight
                    size={13}
                    className="shrink-0 text-slate-600 group-hover:text-industrial-400 group-hover:translate-x-0.5 transition-all"
                  />
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
