import { useState } from 'react'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import { Settings, LogOut, ChevronDown, Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth.store'
import { useMonthStore } from '@/store/month.store'
import { useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

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
  const { selectedMonth, selectedYear, prevMonth, nextMonth, monthLabel, isCurrentMonth, setMonth } = useMonthStore()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(selectedYear)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  function handlePickerOpen(open: boolean) {
    if (open) setPickerYear(selectedYear)
    setPickerOpen(open)
  }

  function selectMonth(m: number) {
    setMonth(m, pickerYear)
    setPickerOpen(false)
  }

  function isFuture(m: number, y: number) {
    return y > currentYear || (y === currentYear && m > currentMonth)
  }

  const initials = user?.profile?.fullName
    ? user.profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const displayName = user?.profile?.fullName ?? user?.email ?? 'User'

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

      {/* Right — month picker + profile */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Global month picker */}
        <div className="flex items-center gap-0.5 bg-zinc-50 border border-zinc-200 rounded-xl px-1.5 py-1">
          <button
            onClick={prevMonth}
            className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-zinc-200 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-zinc-500" />
          </button>

          <PopoverPrimitive.Root open={pickerOpen} onOpenChange={handlePickerOpen}>
            <PopoverPrimitive.Trigger asChild>
              <button className="text-xs font-semibold text-zinc-700 w-28 text-center hover:text-zinc-900 transition-colors rounded-md px-1 py-0.5 hover:bg-zinc-200">
                {monthLabel()}
              </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                align="center"
                sideOffset={8}
                className="z-50 rounded-2xl border border-zinc-200 bg-white shadow-xl p-4 w-64 outline-none"
                style={{ animationDuration: '0ms' }}
              >
                {/* Year row */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-zinc-500" />
                  </button>
                  <span className="text-sm font-bold text-zinc-800">{pickerYear}</span>
                  <button
                    onClick={() => setPickerYear((y) => y + 1)}
                    disabled={pickerYear >= currentYear}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                  </button>
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((name, i) => {
                    const m = i + 1
                    const isSelected = m === selectedMonth && pickerYear === selectedYear
                    const disabled = isFuture(m, pickerYear)
                    return (
                      <button
                        key={m}
                        onClick={() => !disabled && selectMonth(m)}
                        disabled={disabled}
                        className={cn(
                          'rounded-xl px-2 py-2 text-xs font-semibold transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : disabled
                            ? 'text-zinc-300 cursor-not-allowed'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                        )}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>

          <button
            onClick={nextMonth}
            disabled={isCurrentMonth()}
            className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

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
