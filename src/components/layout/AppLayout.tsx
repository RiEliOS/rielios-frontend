import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useMe } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'

function applyTheme(theme: string | null | undefined) {
  const root = document.documentElement
  const resolved = theme ?? 'light'
  if (resolved === 'system') {
    root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
  } else {
    root.classList.toggle('dark', resolved === 'dark')
  }
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: me } = useMe()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    if (me) setAuth(me)
  }, [me])

  useEffect(() => {
    applyTheme(me?.profile?.theme)
  }, [me?.profile?.theme])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar onMenuClick={() => setSidebarOpen((p) => !p)} />
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
