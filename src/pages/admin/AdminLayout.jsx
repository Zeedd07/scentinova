/**
 * Admin chrome - cream, minimal, readable. Phones get a menu sheet instead of the tab row.
 */
import { useRef, useState } from 'react'
import { NavLink, Link, useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAdminAuth } from '../../context/AdminAuthContext'

const LINKS = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/media', label: 'Media' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/offers', label: 'Offers & sales' },
]

const tabClass = ({ isActive }) =>
  `shrink-0 rounded-sm px-3 py-2 text-[15px] font-medium transition ${
    isActive ? 'bg-[#1b1917] text-[#faf9f6]' : 'text-[#4a4136] hover:bg-[#f0e9dc]'
  }`

const menuClass = ({ isActive }) =>
  `flex min-h-12 items-center rounded-sm px-4 text-[16px] font-medium transition ${
    isActive ? 'bg-[#1b1917] text-[#faf9f6]' : 'text-[#1b1917] hover:bg-[#f0e9dc]'
  }`

/** Top-level section for the page key, so editing a product doesn't replay the transition. */
function sectionOf(pathname) {
  return pathname.split('/').slice(0, 3).join('/')
}

export default function AdminLayout() {
  const { user, logout } = useAdminAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef(null)
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const reduceMotion = useReducedMotion()
  const current = LINKS.find((l) => (l.end ? pathname === l.to : pathname.startsWith(l.to)))

  return (
    <div className="admin-shell">
      <header className="border-b border-[#e0d6c4] bg-[#fffcf7] pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8 md:py-4">
          <div className="min-w-0">
            <p className="admin-eyebrow">Scentinova</p>
            <h1 className="admin-title text-xl md:text-2xl">
              Admin
              {current && <span className="text-muted-foreground md:hidden"> · {current.label}</span>}
            </h1>
            {user?.email && (
              <p className="mt-0.5 hidden truncate text-[13px] text-muted md:block">{user.email}</p>
            )}
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <Button type="button" variant="link" className="px-2" onClick={() => logout()}>
              Sign out
            </Button>
            <Button asChild variant="link" className="px-2 no-underline hover:underline">
              <Link to="/">← Back to store</Link>
            </Button>
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="md:hidden" aria-label="Open admin menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85vw] max-w-xs gap-0 p-0"
              data-lenis-prevent
              onOpenAutoFocus={(e) => {
                // Radix skips links when picking the first focus target
                e.preventDefault()
                const nav = navRef.current
                ;(nav?.querySelector('[aria-current="page"]') || nav?.querySelector('a'))?.focus()
              }}
            >
              <SheetHeader className="border-b border-border px-5 pt-5 pb-4">
                <SheetTitle className="font-display text-xl font-medium">Admin</SheetTitle>
                <SheetDescription className="truncate text-[13px]">
                  {user?.email || 'Scentinova'}
                </SheetDescription>
              </SheetHeader>
              <nav ref={navRef} className="flex flex-col gap-1 p-3" aria-label="Admin">
                {LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={menuClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button asChild variant="outline">
                  <Link to="/" onClick={() => setMenuOpen(false)}>
                    ← Back to store
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                  }}
                >
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <nav
          className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-8 pb-3 md:flex"
          aria-label="Admin"
        >
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={tabClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 md:py-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={sectionOf(pathname)}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
