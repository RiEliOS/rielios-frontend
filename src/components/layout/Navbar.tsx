import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Settings, LogOut, ChevronDown, Menu,
  ChevronLeft, ChevronRight, Search, Zap,
  TrendingUp, TrendingDown, X,
} from 'lucide-react'
import financeIcon from '@/assets/finance.png'
import expensesIcon from '@/assets/expenses.png'
import savingsIcon from '@/assets/savings.png'
import investmentIcon from '@/assets/investment.png'
import targetsIcon from '@/assets/targets.png'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth.store'
import { useMonthStore } from '@/store/month.store'
import { useLogout } from '@/hooks/useAuth'
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface NavbarProps {
  onMenuClick?: () => void
}

interface SearchResult {
  id: string
  label: string
  sub: string
  type: 'target' | 'saving' | 'investment' | 'aspect'
  path: string
  img: string
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore()
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()
  const { selectedMonth, selectedYear, prevMonth, nextMonth, monthLabel, isCurrentMonth, setMonth } = useMonthStore()
  const fmt = useCurrencyFormat()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(selectedYear)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Net worth data
  const { data: summary } = useQuery<any>({
    queryKey: ['dashboard-summary', selectedMonth, selectedYear],
    queryFn: () => api.get('/dashboard/summary', { params: { month: selectedMonth, year: selectedYear } }).then(r => r.data),
  })

  // Search data
  const { data: goals = [] } = useQuery<any[]>({ queryKey: ['goals'], queryFn: () => api.get('/goals').then(r => r.data), enabled: searchOpen })
  const { data: savings = [] } = useQuery<any[]>({ queryKey: ['savings'], queryFn: () => api.get('/savings').then(r => r.data), enabled: searchOpen })
  const { data: investments = [] } = useQuery<any[]>({ queryKey: ['investments'], queryFn: () => api.get('/investments').then(r => r.data), enabled: searchOpen })
  const { data: lifeAspects = [] } = useQuery<any[]>({ queryKey: ['life-areas'], queryFn: () => api.get('/life-areas').then(r => r.data), enabled: searchOpen })

  const totalSaved = summary?.savings?.totalSaved ?? 0
  const totalReturned = summary?.investments?.totalReturned ?? 0
  const totalInvested = summary?.investments?.totalInvested ?? 0
  const totalExpenses = summary?.investments?.totalExpenses ?? 0
  const netWorth = totalSaved + totalReturned - totalInvested - totalExpenses
  const netWorthPositive = netWorth >= 0

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50)
    else setSearchQuery('')
  }, [searchOpen])

  const searchResults: SearchResult[] = searchQuery.trim().length < 1 ? [] : [
    ...goals.filter((g: any) => g.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((g: any) => ({
      id: g.id, label: g.title, sub: 'Target', type: 'target' as const, path: '/targets', img: targetsIcon,
    })),
    ...savings.filter((s: any) => s.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((s: any) => ({
      id: s.id, label: s.name, sub: 'Saving', type: 'saving' as const, path: '/savings', img: savingsIcon,
    })),
    ...investments.filter((i: any) => i.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((i: any) => ({
      id: i.id, label: i.name, sub: 'Investment', type: 'investment' as const, path: '/investments', img: investmentIcon,
    })),
    ...lifeAspects.filter((l: any) => l.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((l: any) => ({
      id: l.id, label: l.name, sub: 'Life Aspect', type: 'aspect' as const, path: '/life-areas', img: financeIcon,
    })),
  ]

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

  const QUICK_ADD = [
    { label: 'Add Income',     sub: 'Record a payment received',  path: '/finance',      img: financeIcon },
    { label: 'Add Expense',    sub: 'Record a spend or purchase', path: '/finance',      img: expensesIcon },
    { label: 'New Saving',     sub: 'Create a new saving',        path: '/savings',      img: savingsIcon },
    { label: 'New Investment', sub: 'Track a new investment',     path: '/investments',  img: investmentIcon },
    { label: 'New Target',     sub: 'Set a personal target',      path: '/targets',      img: targetsIcon },
  ]

  return (
    <>
      <header className="h-14 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 shrink-0 flex items-center justify-between px-4 gap-4 shadow-sm">

        {/* Left — hamburger + logo + net worth */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-black text-sm">R</span>
            </div>
            <span className="font-black text-base tracking-tight text-zinc-900 dark:text-zinc-100">RiEliOS</span>
          </Link>

          {/* Net worth chip */}
          {summary && (
            <div className={cn(
              'hidden md:flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold',
              netWorthPositive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700',
            )}>
              {netWorthPositive
                ? <TrendingUp className="h-3.5 w-3.5" />
                : <TrendingDown className="h-3.5 w-3.5" />
              }
              <span className="hidden lg:inline text-zinc-400 dark:text-zinc-500 font-normal">Net Worth</span>
              <span>{(netWorthPositive ? '+' : '') + fmt(netWorth)}</span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors text-xs text-zinc-400 dark:text-zinc-500 w-64"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left hidden sm:block">Search…</span>
            <kbd className="hidden sm:inline text-[10px] bg-zinc-200 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-300 px-1.5 py-0.5 rounded font-mono shrink-0">⌘K</kbd>
          </button>

          {/* Month picker */}
          <div className="flex items-center gap-0.5 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-1.5 py-1">
            <button onClick={prevMonth} className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors" aria-label="Previous month">
              <ChevronLeft className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>

            <PopoverPrimitive.Root open={pickerOpen} onOpenChange={handlePickerOpen}>
              <PopoverPrimitive.Trigger asChild>
                <button className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-28 text-center hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-md px-1 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600">
                  {monthLabel()}
                </button>
              </PopoverPrimitive.Trigger>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content align="center" sideOffset={8} className="z-50 rounded-2xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 shadow-xl p-4 w-64 outline-none" style={{ animationDuration: '0ms' }}>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setPickerYear((y) => y - 1)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                      <ChevronLeft className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{pickerYear}</span>
                    <button onClick={() => setPickerYear((y) => y + 1)} disabled={pickerYear >= currentYear} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES.map((name, i) => {
                      const m = i + 1
                      const isSelected = m === selectedMonth && pickerYear === selectedYear
                      const disabled = isFuture(m, pickerYear)
                      return (
                        <button key={m} onClick={() => !disabled && selectMonth(m)} disabled={disabled}
                          className={cn('rounded-xl px-2 py-2 text-xs font-semibold transition-colors',
                            isSelected ? 'bg-primary text-primary-foreground'
                              : disabled ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
                          )}>
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>

            <button onClick={nextMonth} disabled={isCurrentMonth()} className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Next month">
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>

          {/* Quick add */}
          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                <Zap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuPrimitive.Portal>
              <DropdownMenuPrimitive.Content align="end" sideOffset={8} className="z-50 w-60 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 shadow-lg outline-none p-1" style={{ animationDuration: '0ms' }}>
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-1.5">Quick Add</p>
                {QUICK_ADD.map(({ label, sub, path, img }) => (
                  <DropdownMenuPrimitive.Item
                    key={label}
                    onSelect={() => navigate(path)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 outline-none select-none transition-colors"
                  >
                    <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                      <img src={img} alt={label} className="h-5 w-5 object-contain mix-blend-multiply dark:mix-blend-normal" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{sub}</p>
                    </div>
                  </DropdownMenuPrimitive.Item>
                ))}
              </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
          </DropdownMenuPrimitive.Root>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

          {/* User dropdown */}
          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={user?.profile?.avatarUrl ?? undefined} alt={displayName} className="object-cover" />
                  <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 max-w-28 truncate hidden sm:block">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 hidden sm:block" />
              </button>
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuPrimitive.Portal>
              <DropdownMenuPrimitive.Content align="end" sideOffset={8} className="z-50 w-56 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 shadow-lg outline-none" style={{ animationDuration: '0ms' }}>
                <div className="px-3 py-3 border-b border-zinc-100 dark:border-zinc-700">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{displayName}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1">
                  <DropdownMenuPrimitive.Item onSelect={() => navigate('/settings')} className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 outline-none select-none transition-colors">
                    <Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    Settings
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Item onSelect={() => logout()} className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-red-50 text-red-600 outline-none select-none transition-colors">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuPrimitive.Item>
                </div>
              </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
          </DropdownMenuPrimitive.Root>
        </div>
      </header>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-700">
              <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search targets, savings, investments, life aspects…"
                className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none bg-transparent"
              />
              <button onClick={() => setSearchOpen(false)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                <X className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {searchQuery.trim() === '' ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-10">Start typing to search…</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-10">No results for "{searchQuery}"</p>
              ) : (
                <div className="p-2 space-y-0.5">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { navigate(r.path); setSearchOpen(false) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                        <img src={r.img} alt={r.sub} className="h-5 w-5 object-contain mix-blend-multiply dark:mix-blend-normal" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{r.label}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">{r.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
