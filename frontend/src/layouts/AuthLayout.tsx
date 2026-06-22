import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export function AuthLayout() {
  return (
    <div className='relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-hidden'>
      {/* Animated background grid */}
      <div
        className='absolute inset-0 opacity-20'
        style={{
          backgroundImage:
            'linear-gradient(rgba(14,165,233,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.15) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Radial glow */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <div className='w-[600px] h-[600px] rounded-full bg-sky-500/5 blur-3xl' />
      </div>

      {/* Corner decorations */}
      <div className='absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-sky-500/20' />
      <div className='absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-sky-500/20' />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className='absolute w-1 h-1 rounded-full bg-sky-400/40'
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='relative z-10 w-full max-w-md'
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
