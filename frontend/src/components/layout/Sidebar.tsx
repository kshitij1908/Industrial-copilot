import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Cpu,
  Network,
  Settings,
  Cog,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Chat', path: '/chat', icon: MessageSquare },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Equipment', path: '/equipment', icon: Cpu },
  { label: 'Knowledge Graph', path: '/graph', icon: Network },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Logo */}
      <div className='flex items-center gap-3 px-5 py-5 border-b border-slate-800'>
        <div className='relative flex items-center justify-center w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30'>
          <Cog className='w-5 h-5 text-sky-400' />
          <motion.div
            className='absolute inset-0 rounded-lg border border-sky-400/20'
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </div>
        <div>
          <p className='text-sm font-bold text-slate-100 leading-none'>IK Copilot</p>
          <p className='text-xs text-slate-500 mt-0.5'>Industrial Knowledge</p>
        </div>
      </div>

      {/* Nav section label */}
      <div className='px-5 pt-5 pb-2'>
        <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-600'>Navigation</p>
      </div>

      {/* Nav items */}
      <nav className='flex-1 px-3 space-y-1 overflow-y-auto'>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/15 border-l-2 border-sky-400 text-sky-400 pl-[10px]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                      isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                    size={18}
                  />
                  <span className='flex-1'>{item.label}</span>
                  {isActive && (
                    <ChevronRight size={14} className='text-sky-500/60' />
                  )}
                </motion.div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* System status */}
      <div className='px-4 py-3'>
        <div className='rounded-lg bg-slate-800/50 border border-slate-700/50 p-3'>
          <div className='flex items-center gap-2 mb-2'>
            <div className='w-1.5 h-1.5 rounded-full bg-emerald-400'>
              <motion.div
                className='w-1.5 h-1.5 rounded-full bg-emerald-400'
                animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className='text-xs text-emerald-400 font-medium'>System Online</span>
          </div>
          <p className='text-[10px] text-slate-500'>Gemini 2.5 Flash • Active</p>
        </div>
      </div>

      {/* User section */}
      <div className='px-3 py-3 border-t border-slate-800'>
        <div className='flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/50 transition-colors'>
          {/* Avatar */}
          <div className='relative w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0'>
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-xs font-semibold text-slate-200 truncate'>
              {user?.username ?? 'User'}
            </p>
            <p className='text-[10px] text-slate-500 truncate capitalize'>
              {user?.role ?? 'Operator'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className='p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors'
            title='Logout'
          >
            <LogOut size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
