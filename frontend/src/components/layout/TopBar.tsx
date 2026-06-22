import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Home,
  X,
  BellDot,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'

const routeLabels: Record<string, string[]> = {
  '/dashboard': ['Home', 'Dashboard'],
  '/chat': ['Home', 'Chat'],
  '/documents': ['Home', 'Documents'],
  '/equipment': ['Home', 'Equipment'],
  '/graph': ['Home', 'Knowledge Graph'],
  '/settings': ['Home', 'Settings'],
}

const mockNotifications = [
  { id: 1, text: 'Document "Pump Manual P-101" processed successfully', time: '2m ago', unread: true },
  { id: 2, text: 'Equipment tag V-202 auto-discovered', time: '15m ago', unread: true },
  { id: 3, text: 'ChromaDB indexed 1,240 new chunks', time: '1h ago', unread: false },
]

export function TopBar() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)

  const breadcrumbs = routeLabels[location.pathname] ?? ['Home', 'Page']
  const unreadCount = mockNotifications.filter((n) => n.unread).length

  return (
    <div className='flex items-center gap-4 px-4 md:px-6 h-14 bg-[hsl(var(--card)/0.85)] backdrop-blur-md border-b border-[hsl(var(--border))] transition-colors duration-300'>
      {/* Breadcrumb */}
      <div className='hidden md:flex items-center gap-1.5 text-sm min-w-0 flex-1'>
        <Home size={14} className='text-[hsl(var(--muted-foreground))] shrink-0' />
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className='flex items-center gap-1.5'>
            {i > 0 && <ChevronRight size={13} className='text-[hsl(var(--muted-foreground))] shrink-0' />}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? 'text-[hsl(var(--foreground))] font-semibold truncate'
                  : 'text-[hsl(var(--muted-foreground))] truncate'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Mobile title */}
      <div className='md:hidden flex-1'>
        <span className='text-sm font-semibold text-[hsl(var(--foreground))]'>
          {breadcrumbs[breadcrumbs.length - 1]}
        </span>
      </div>

      {/* Global search */}
      <div className='relative flex-1 max-w-xs hidden md:block'>
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ opacity: 0, width: 160 }}
              animate={{ opacity: 1, width: '100%' }}
              exit={{ opacity: 0, width: 160 }}
              className='flex items-center gap-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-3 py-1.5'
            >
              <Search size={14} className='text-[hsl(var(--muted-foreground))] shrink-0' />
              <input
                autoFocus
                type='text'
                placeholder='Search documents, equipment...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='flex-1 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none'
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
                <X size={14} className='text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]' />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSearchOpen(true)}
              className='flex items-center gap-2 w-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--ring)/0.5)] hover:text-[hsl(var(--foreground))] transition-colors'
            >
              <Search size={14} />
              <span>Search...</span>
              <kbd className='ml-auto text-[10px] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded px-1 py-0.5 font-mono'>
                Ctrl+K
              </kbd>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right actions */}
      <div className='flex items-center gap-1.5'>
        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className='p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors'
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>

        {/* Notification bell */}
        <div className='relative'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen(!notifOpen)}
            className='relative p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors'
            title='Notifications'
          >
            {unreadCount > 0 ? <BellDot size={16} className='text-sky-500' /> : <Bell size={16} />}
            {unreadCount > 0 && (
              <span className='absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500' />
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className='absolute right-0 top-10 w-80 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden z-50'
              >
                <div className='flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]'>
                  <span className='text-sm font-semibold text-[hsl(var(--foreground))]'>Notifications</span>
                  {unreadCount > 0 && (
                    <span className='text-xs bg-sky-500/20 text-sky-500 px-2 py-0.5 rounded-full'>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className='divide-y divide-[hsl(var(--border))]'>
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 text-xs ${n.unread ? 'bg-sky-500/5' : ''}`}
                    >
                      <p className={`leading-relaxed ${n.unread ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                        {n.text}
                      </p>
                      <p className='text-[hsl(var(--muted-foreground))] mt-1'>{n.time}</p>
                    </div>
                  ))}
                </div>
                <div className='px-4 py-2 border-t border-[hsl(var(--border))]'>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className='text-xs text-sky-500 hover:text-sky-400 transition-colors'
                  >
                    Mark all as read
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div className='flex items-center gap-2 ml-1 pl-2 border-l border-[hsl(var(--border))]'>
          <div className='w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold'>
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className='hidden md:block text-xs font-medium text-[hsl(var(--foreground))]'>
            {user?.username ?? 'User'}
          </span>
        </div>
      </div>
    </div>
  )
}
