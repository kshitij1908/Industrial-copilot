import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { TopBar } from '../components/layout/TopBar'
import { MobileNav } from '../components/layout/MobileNav'

export function AppLayout() {
  return (
    <div className='flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden transition-colors duration-300'>
      {/* Desktop Sidebar */}
      <aside className='hidden md:flex flex-col w-64 shrink-0 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] overflow-y-auto overflow-x-hidden transition-colors duration-300'>
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className='flex flex-col flex-1 min-w-0 overflow-hidden'>
        {/* Top bar */}
        <header className='shrink-0 z-10'>
          <TopBar />
        </header>

        {/* Page content */}
        <main className='flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6'>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
