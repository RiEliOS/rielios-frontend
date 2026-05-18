import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
]

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          <span className="font-bold text-lg">RiEliOS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
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

        {/* Desktop auth buttons */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-md hover:bg-accent transition-colors"
          onClick={() => setOpen((p) => !p)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t bg-background px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="flex gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
            </Button>
            <Button size="sm" className="flex-1" asChild>
              <Link to="/register" onClick={() => setOpen(false)}>Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
