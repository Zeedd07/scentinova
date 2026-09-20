/**
 * Admin chrome — cream, minimal, readable.
 */
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

const LINKS = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/orders', label: 'Orders' },
]

export default function AdminLayout() {
  const { user, logout } = useAdminAuth()

  return (
    <div className="admin-shell">
      <header className="border-b border-[#e0d6c4] bg-[#fffcf7]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="admin-eyebrow">Scentinova</p>
            <h1 className="admin-title text-2xl">Admin</h1>
            {user?.email && (
              <p className="mt-0.5 text-[13px] text-[#766f66]">{user.email}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => logout()}
              className="admin-link border-0 bg-transparent hover:underline"
            >
              Sign out
            </button>
            <Link to="/" className="admin-link no-underline hover:underline">
              ← Back to store
            </Link>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-3 sm:px-8"
          aria-label="Admin"
        >
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `shrink-0 rounded-sm px-3 py-2 text-[15px] font-medium transition ${
                  isActive
                    ? 'bg-[#1b1917] text-[#faf9f6]'
                    : 'text-[#4a4136] hover:bg-[#f0e9dc]'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Outlet />
      </div>
    </div>
  )
}
