import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, CheckSquare, BookOpen, Timer, BarChart3, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Logo } from './Logo'
import { ThemeToggle } from '../lib/theme'

const links = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/app/courses', label: 'Courses', icon: BookOpen },
  { to: '/app/focus', label: 'Focus Session', icon: Timer },
  { to: '/app/progress', label: 'Progress', icon: BarChart3 },
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          <l.icon size={18} />
          {l.label}
        </NavLink>
      ))}
    </nav>
  )

  const footer = (
    <div className="border-t border-border pt-4">
      <div className="flex items-center justify-between px-3">
        <p className="truncate text-xs text-muted">{user?.email}</p>
        <ThemeToggle />
      </div>
      <button
        className="nav-link mt-1 w-full"
        onClick={async () => {
          await signOut()
          navigate('/')
        }}
      >
        <LogOut size={18} />
        Log out
      </button>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-border bg-surface/60 p-4 md:flex sticky top-0 h-screen">
        <div className="px-2 pt-2">
          <Logo to="/app" />
        </div>
        {nav}
        {footer}
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo to="/app" />
        <button className="btn-ghost p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-30 bg-bg/95 p-4 pt-20 md:hidden flex flex-col gap-6">
          {nav}
          {footer}
        </div>
      )}

      <main className="flex-1 px-4 pb-10 pt-20 md:px-8 md:pt-8 max-w-6xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
