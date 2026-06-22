import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Tag,
  MessageSquare,
  TrendingUp,
  Clock,
  Upload,
  Bot,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAnalytics } from '../hooks/useAnalytics'

// Count-up hook
function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

// Animated stat card
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  color,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: number
  unit?: string
  trend?: 'up' | 'down'
  trendValue?: string
  color: string
  delay: number
}) {
  const animatedValue = useCountUp(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className='relative bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-hidden group hover:border-slate-700 transition-colors'
    >
      {/* Glow */}
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity ${color}`}
      />

      <div className='flex items-start justify-between mb-3'>
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 border border-opacity-20 ${color.replace('bg-', 'border-')}`}>
          <Icon size={18} className={color.replace('bg-', 'text-')} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}
          </div>
        )}
      </div>

      <div className='text-2xl font-bold text-slate-100 font-mono'>
        {animatedValue.toLocaleString()}
        {unit && <span className='text-sm text-slate-500 font-normal ml-1'>{unit}</span>}
      </div>
      <div className='text-xs text-slate-500 mt-1'>{label}</div>
    </motion.div>
  )
}

// Confidence badge
function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value)
  const color =
    pct >= 80 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
    pct >= 60 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
    'text-red-400 bg-red-400/10 border-red-400/20'

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${color}`}>
      {pct}%
    </span>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// Skeleton
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded ${className}`} />
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { analytics, recentQueries, equipmentAccess, isLoading } = useAnalytics()

  const statCards = [
    {
      icon: FileText,
      label: 'Total Documents',
      value: analytics?.totalDocuments ?? 0,
      trend: 'up' as const,
      trendValue: '+3 today',
      color: 'bg-sky-500',
      delay: 0.1,
    },
    {
      icon: Tag,
      label: 'Equipment Tags',
      value: analytics?.totalEquipmentTags ?? 0,
      trend: 'up' as const,
      trendValue: '+12 this week',
      color: 'bg-violet-500',
      delay: 0.15,
    },
    {
      icon: MessageSquare,
      label: 'Total Queries',
      value: analytics?.totalQueries ?? 0,
      trend: 'up' as const,
      trendValue: '+24 today',
      color: 'bg-emerald-500',
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      label: 'Avg Confidence',
      value: analytics?.avgConfidence ? Math.round(analytics.avgConfidence) : 0,
      unit: '%',
      color: 'bg-amber-500',
      delay: 0.25,
    },
    {
      icon: Clock,
      label: 'Processing Queue',
      value: analytics?.processingQueue ?? 0,
      color: 'bg-rose-500',
      delay: 0.3,
    },
  ]

  return (
    <div className='space-y-6 max-w-7xl mx-auto'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className='flex items-center justify-between'
      >
        <div>
          <h1 className='text-xl font-bold text-slate-100'>Operations Dashboard</h1>
          <p className='text-sm text-slate-500 mt-0.5'>
            Real-time overview of your industrial knowledge base
          </p>
        </div>
        <div className='hidden md:flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-emerald-400'>
            <motion.div
              className='w-2 h-2 rounded-full bg-emerald-400'
              animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <span className='text-xs text-slate-500'>Live</span>
        </div>
      </motion.div>

      {/* Stats grid */}
      {isLoading ? (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-28 rounded-xl' />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Charts + Recent Queries row */}
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
        {/* Equipment bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className='lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5'
        >
          <div className='flex items-center gap-2 mb-5'>
            <BarChart2 size={16} className='text-sky-400' />
            <h2 className='text-sm font-semibold text-slate-200'>Most Accessed Equipment</h2>
          </div>
          {isLoading ? (
            <Skeleton className='h-48' />
          ) : (
            <ResponsiveContainer width='100%' height={200}>
              <BarChart data={equipmentAccess ?? []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' />
                <XAxis
                  dataKey='tag'
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    color: '#e2e8f0',
                    fontSize: 12,
                  }}
                  cursor={{ fill: 'rgba(14,165,233,0.05)' }}
                />
                <Bar dataKey='count' fill='#0ea5e9' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Recent queries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col'
        >
          <div className='flex items-center gap-2 mb-4'>
            <MessageSquare size={16} className='text-violet-400' />
            <h2 className='text-sm font-semibold text-slate-200'>Recent Queries</h2>
          </div>

          {isLoading ? (
            <div className='space-y-3'>
              {[...Array(4)].map((_, i) => <Skeleton key={i} className='h-12 rounded-lg' />)}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              className='flex-1 space-y-2 overflow-hidden'
            >
              {(recentQueries ?? []).slice(0, 5).map((q: any, i: number) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className='flex items-start gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer'
                  onClick={() => navigate('/chat')}
                >
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs text-slate-300 truncate'>{q.query}</p>
                    <p className='text-[10px] text-slate-600 mt-0.5'>{q.timestamp}</p>
                  </div>
                  <ConfidenceBadge value={q.confidence} />
                </motion.div>
              ))}
              {(!recentQueries || recentQueries.length === 0) && (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <MessageSquare size={32} className='text-slate-700 mb-2' />
                  <p className='text-xs text-slate-500'>No queries yet.</p>
                  <button
                    onClick={() => navigate('/chat')}
                    className='text-xs text-sky-400 hover:text-sky-300 mt-1'
                  >
                    Ask something →
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className='flex flex-wrap gap-3'
      >
        <p className='w-full text-xs font-semibold text-slate-500 uppercase tracking-widest'>
          Quick Actions
        </p>
        {[
          { label: 'Upload Document', icon: Upload, path: '/documents', color: 'sky' },
          { label: 'Ask Copilot', icon: Bot, path: '/chat', color: 'violet' },
          { label: 'Browse Equipment', icon: Cpu, path: '/equipment', color: 'emerald' },
        ].map((action) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all
                ${action.color === 'sky'
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                  : action.color === 'violet'
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                }`}
            >
              <Icon size={16} />
              {action.label}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
