import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cog, Brain, Zap, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const stats = [
  { label: '14 Document Types', icon: '📄' },
  { label: '100+ Equipment Tags', icon: '⚙️' },
  { label: 'Real-time AI Search', icon: '🔍' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localLoading, setLocalLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username and password.')
      return
    }
    setLocalLoading(true)
    try {
      const success = await login(username.trim(), password)
      if (success) {
        navigate('/dashboard')
      } else {
        setLocalError('Invalid credentials. Try admin / admin.')
      }
    } catch {
      setLocalError('Authentication failed. Please try again.')
    } finally {
      setLocalLoading(false)
    }
  }

  const displayError = localError

  return (
    <div className='w-full'>
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden'
      >
        {/* Top glow bar */}
        <div className='h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent' />

        {/* Inner glow */}
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none' />

        <div className='p-8'>
          {/* Logo */}
          <div className='flex flex-col items-center mb-8'>
            <div className='relative mb-4'>
              <div className='flex items-center gap-1'>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className='w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center'
                >
                  <Cog className='w-5 h-5 text-sky-400' />
                </motion.div>
                <div className='w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center'>
                  <Brain className='w-5 h-5 text-violet-400' />
                </div>
              </div>
              {/* Connecting line */}
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-gradient-to-r from-sky-500 to-violet-500' />
            </div>

            <h1 className='text-xl font-bold text-slate-100 text-center leading-tight'>
              Industrial Knowledge Copilot
            </h1>
            <p className='text-sm text-slate-400 mt-1 text-center'>
              AI-Powered Asset &amp; Operations Brain
            </p>

            {/* Gemini badge */}
            <div className='flex items-center gap-1.5 mt-3 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full'>
              <Zap size={12} className='text-violet-400' />
              <span className='text-xs text-violet-300 font-medium'>
                Powered by Gemini 2.5 Flash + RAG
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Username */}
            <div>
              <label className='block text-xs font-medium text-slate-400 mb-1.5'>
                Username
              </label>
              <input
                type='text'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='Enter username'
                autoComplete='username'
                className='w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all'
              />
            </div>

            {/* Password */}
            <div>
              <label className='block text-xs font-medium text-slate-400 mb-1.5'>
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter password'
                  autoComplete='current-password'
                  className='w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors'
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Hint */}
            <div className='flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg'>
              <span className='text-[10px] text-slate-500'>
                Default credentials:
              </span>
              <code className='text-[10px] text-sky-400 font-mono'>admin / admin</code>
            </div>

            {/* Error */}
            <AnimatePresence>
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg'
                >
                  <AlertCircle size={14} className='text-red-400 shrink-0' />
                  <span className='text-xs text-red-300'>{displayError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type='submit'
              disabled={localLoading}
              whileHover={{ scale: localLoading ? 1 : 1.01 }}
              whileTap={{ scale: localLoading ? 1 : 0.99 }}
              className='w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:from-sky-600/50 disabled:to-blue-700/50 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-sky-500/20 disabled:cursor-not-allowed'
            >
              {localLoading ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In to Copilot'
              )}
            </motion.button>
          </form>

          {/* Stats */}
          <div className='mt-8 pt-6 border-t border-slate-800'>
            <div className='grid grid-cols-3 gap-3'>
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className='flex flex-col items-center gap-1 text-center'
                >
                  <span className='text-lg'>{stat.icon}</span>
                  <span className='text-[10px] text-slate-500 leading-tight'>{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom glow bar */}
        <div className='h-0.5 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent' />
      </motion.div>
    </div>
  )
}
