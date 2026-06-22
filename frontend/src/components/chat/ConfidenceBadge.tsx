import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Shield } from 'lucide-react'

interface Props {
  score: number
  label?: string
  showBar?: boolean
}

function getConfidenceBg(score: number): string {
  if (score >= 80) {
    return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
  }
  if (score >= 60) {
    return 'bg-amber-500/15 border-amber-500/40 text-amber-400'
  }
  return 'bg-red-500/15 border-red-500/40 text-red-400'
}

function getConfidenceBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

export function ConfidenceBadge({ score, label, showBar = false }: Props) {
  const colorClass = getConfidenceBg(score)
  const barColor = getConfidenceBarColor(score)

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
          colorClass
        )}
      >
        <Shield size={11} />
        <span>{label ?? `Confidence: ${score}%`}</span>
      </motion.div>

      {showBar && (
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden min-w-[80px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            className={cn('h-full rounded-full', barColor)}
          />
        </div>
      )}
    </div>
  )
}
