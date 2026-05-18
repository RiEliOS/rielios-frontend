import { useNavigate, Link, NavLink } from 'react-router-dom'
import { Settings, LogOut, ChevronDown, Menu } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
]

interface NavbarProps {
  onMenuClick?: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore()
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()

  const initials = user?.profile?.fullName
    ? user.profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const displayName = user?.profile?.fullName ?? user?.email ?? 'User'

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <header className="h-14 border-b shrink-0 flex items-center justify-between px-4 gap-4">

      {/* Left — hamburger (mobile only) + logo */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">R</span>
          </div>
          <span className="font-bold text-sm">RiEliOS</span>
        </Link>
      </div>

      {/* Center — nav links (desktop only) */}
      <nav className="hidden lg:flex items-center gap-1">
        {NAV_LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Right — date + profile */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground hidden lg:block">{dateStr}</span>
        <div className="h-4 w-px bg-border hidden lg:block" />

        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 outline-none hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium max-w-28 truncate hidden sm:block">
                {displayName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuPrimitive.Trigger>

          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              align="end"
              sideOffset={8}
              className="z-50 w-56 rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none"
              style={{ animationDuration: '0ms' }}
            >
              <div className="px-3 py-3">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="border-t p-1">
                <DropdownMenuPrimitive.Item
                  onSelect={() => navigate('/settings')}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </DropdownMenuPrimitive.Item>

                <DropdownMenuPrimitive.Item
                  onSelect={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-destructive/10 text-destructive outline-none select-none"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuPrimitive.Item>
              </div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>
    </header>
  )
}
