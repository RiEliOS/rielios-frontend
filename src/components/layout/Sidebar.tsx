import { NavLink } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import financeIcon from '@/assets/finance.png'
import targetsIcon from '@/assets/targets.png'
import savingsIcon from '@/assets/savings.png'
import investmentIcon from '@/assets/investment.png'
import lifeAspectsIcon from '@/assets/lifeaspects.png'
import reportsIcon from '@/assets/reports.png'

type NavItem =
  | { to: string; icon: React.ElementType; img?: never; imgClass?: never; label: string }
  | { to: string; img: string; icon?: never; imgClass?: string; label: string }

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/finance',   img: financeIcon,       label: 'Finance' },
  { to: '/targets',   img: targetsIcon, imgClass: 'h-8 w-8', label: 'My Targets' },
  { to: '/savings',   img: savingsIcon,          label: 'Savings' },
  { to: '/investments', img: investmentIcon,    label: 'Investments' },
  { to: '/life-areas',  img: lifeAspectsIcon,   label: 'Life Aspects' },
  { to: '/reports',   img: reportsIcon,         label: 'Reports' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col w-52 shrink-0 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm z-30 transition-transform duration-200 overflow-hidden',
        'lg:relative lg:translate-x-0 lg:flex lg:top-auto lg:bottom-auto lg:left-auto',
        'fixed top-17 bottom-3 left-3',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map(({ to, label, ...rest }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex items-center justify-center rounded-lg shrink-0 transition-colors',
                  'img' in rest && rest.img
                    ? isActive ? 'h-9 w-9 bg-white dark:bg-zinc-700 rounded-lg p-0.5' : 'h-9 w-9'
                    : isActive
                      ? 'h-8 w-8 bg-white/20 text-white'
                      : 'h-8 w-8 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-200',
                )}>
                  {'img' in rest && rest.img
                    ? <img src={rest.img} alt={label} className={cn('object-contain mix-blend-multiply dark:mix-blend-normal', isActive ? 'h-7 w-7' : 'h-9 w-9', rest.imgClass)} />
                    : rest.icon && <rest.icon className="h-4 w-4" />
                  }
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
