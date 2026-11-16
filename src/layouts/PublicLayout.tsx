import { Link, NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import type { SiteSettings } from '../types'

const nav = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/skills', label: 'Skills' },
  { to: '/services', label: 'Services' },
  { to: '/experience', label: 'Experience' },
  { to: '/contact', label: 'Contact' },
]

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    api.get<SiteSettings>('/api/public/settings').then(setSettings).catch(() => null)
  }, [])

  const brand = settings?.logoText || 'NO ONE LABS'

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="sticky top-0 z-50 border-b border-border glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-display text-lg font-semibold tracking-wide">
            {brand}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn('rounded-lg px-3 py-2 text-sm text-muted hover:text-white', isActive && 'text-white bg-white/5')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button className="md:hidden text-muted" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-border px-5 py-3 md:hidden">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </header>

      <Outlet context={{ settings }} />

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display font-semibold">{brand}</p>
            <p className="mt-1 text-sm text-muted">© {new Date().getFullYear()} NO ONE LABS</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            {nav.slice(0, 5).map((n) => (
              <Link key={n.to} to={n.to} className="hover:text-white">
                {n.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {(settings?.socialLinks || []).map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-cyan hover:underline">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
