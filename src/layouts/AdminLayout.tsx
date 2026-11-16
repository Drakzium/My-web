import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FolderKanban,
  Images,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { api } from '../lib/api'
import { cn } from '../lib/cn'

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/media', label: 'Media', icon: Images },
  { to: '/admin/content', label: 'Content', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    api
      .get<{ authenticated: boolean; ownerPending: boolean }>('/api/auth/status')
      .then((s) => {
        setPending(s.ownerPending)
        if (!s.authenticated) {
          nav('/admin/login')
          return
        }
        setReady(true)
      })
      .catch(() => nav('/admin/login'))
  }, [nav])

  async function logout() {
    await api.post('/api/auth/logout')
    nav('/admin/login')
  }

  if (!ready) {
    return <div className="grid min-h-screen place-items-center bg-bg text-muted">Loading admin…</div>
  }

  return (
    <div className="min-h-screen bg-bg text-white md:flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-surface p-4 transition md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link to="/admin" className="font-display text-lg font-semibold">
            NOL Admin
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        {pending ? (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            Owner email PENDING. Set OWNER_EMAIL to enable login and writes.
          </p>
        ) : null}
        <nav className="space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-white',
                  isActive && 'bg-primary/15 text-white',
                )
              }
            >
              <l.icon size={16} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-8 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} /> Logout
        </button>
        <Link to="/" className="mt-2 block px-3 text-xs text-cyan hover:underline">
          View site
        </Link>
      </aside>

      <div className="flex-1">
        <div className="flex h-14 items-center border-b border-border px-4 md:hidden">
          <button onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="ml-3 font-display font-semibold">Admin</span>
        </div>
        <main className="mx-auto max-w-6xl p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
