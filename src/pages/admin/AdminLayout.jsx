/**
 * Admin chrome — hidden route /admin (not linked in storefront nav).
 */
import { NavLink, Outlet, Link } from 'react-router-dom'

const LINKS = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/orders', label: 'Orders' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="border-b border-gold/15 bg-ink-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <div>
            <p className="text-[10px] tracking-[0.35em] text-bronze uppercase">
              SCENTINOVA
            </p>
            <h1 className="font-display text-2xl text-cream">Admin</h1>
          </div>
          <Link
            to="/"
            className="text-[11px] tracking-[0.28em] text-bronze uppercase transition hover:text-gold-light"
          >
            ← Storefront
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-3 sm:px-10">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `shrink-0 border px-4 py-2 text-[11px] tracking-[0.22em] uppercase transition ${
                  isActive
                    ? 'border-gold bg-gold/15 text-gold-light'
                    : 'border-transparent text-bronze hover:border-gold/30 hover:text-cream'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <Outlet />
      </div>
    </div>
  )
}
