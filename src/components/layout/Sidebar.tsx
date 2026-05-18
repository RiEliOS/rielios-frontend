import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Target, PiggyBank, BarChart3,
  Layers, FileText, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/finance', icon: TrendingUp, label: 'Finance' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/savings', icon: PiggyBank, label: 'Savings' },
  { to: '/investments', icon: BarChart3, label: 'Investments' },
  { to: '/life-areas', icon: Layers, label: 'Life Areas' },
  { to: '/reports', icon: FileText, label: 'Reports' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col w-64 border-r bg-card z-30 transition-transform duration-200',
        // Desktop: always in flow, never translated
        'lg:relative lg:translate-x-0 lg:flex',
        // Mobile: fixed drawer sliding in from the left, below navbar (h-14 = 56px)
        'fixed top-14 bottom-0 left-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            <ChevronRight className="ml-auto h-3 w-3 opacity-50" />
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
