import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, MessageSquare, FileText, Cpu, Network } from 'lucide-react'

const mobileNavItems = [
  { label: 'Home', path: '/dashboard', icon: Home },
  { label: 'Chat', path: '/chat', icon: MessageSquare },
  { label: 'Docs', path: '/documents', icon: FileText },
  { label: 'Equipment', path: '/equipment', icon: Cpu },
  { label: 'Graph', path: '/graph', icon: Network },
]

export function MobileNav() {
  return (
    <nav className='md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 safe-area-pb'>
      <div className='flex items-center justify-around px-2 py-2'>
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.path} to={item.path} className='flex-1'>
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
                    isActive
                      ? 'text-sky-400 bg-sky-500/10'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={20} />
                  <span className='text-[10px] font-medium'>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId='mobile-nav-indicator'
                      className='absolute bottom-0 w-6 h-0.5 bg-sky-400 rounded-full'
                    />
                  )}
                </motion.div>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
