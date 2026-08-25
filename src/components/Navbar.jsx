/**
 * Editorial navigation — SCENTINOVA Parfums
 * Anchor clicks scroll without bounce (no native hash jump vs sticky hero).
 */
import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import BrandLogo from './BrandLogo'

const HOME_ANCHORS = [
  { href: '#collection', label: 'Collection' },
  { href: '#notes', label: 'Notes' },
  { to: '/about', label: 'Our Story' },
]

function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 72
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function Navbar() {
  const { count, setDrawerOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const onHome = pathname === '/'

  const onAnchorClick = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    const id = href.replace('#', '')
    if (onHome) {
      scrollToId(id)
      // update hash without triggering another scroll jump
      window.history.replaceState(null, '', href)
    } else {
      navigate({ pathname: '/', hash: href })
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gold/10 bg-ink [&_a]:outline-none [&_a]:shadow-none [&_button]:outline-none [&_button]:shadow-none">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <BrandLogo onClick={() => setMenuOpen(false)} />

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex"
          aria-label="Primary"
        >
          {HOME_ANCHORS.map((l) =>
            l.to ? (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `border-0 bg-transparent text-[11px] tracking-[0.28em] uppercase transition outline-none ring-0 ${
                    isActive ? 'text-gold-light' : 'text-bronze hover:text-cream'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ) : (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => onAnchorClick(e, l.href)}
                className="border-0 bg-transparent text-[11px] tracking-[0.32em] text-bronze uppercase transition outline-none ring-0 hover:text-cream"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            to="/shop"
            className="hidden border-0 bg-transparent text-[11px] tracking-[0.28em] text-bronze uppercase transition outline-none ring-0 hover:text-cream sm:inline"
          >
            Shop
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative border-0 bg-transparent text-bronze transition outline-none ring-0 hover:text-cream"
            aria-label={`Bag, ${count} items`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 016 0v2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            {count > 0 && (
              <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-ink">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            className="border-0 bg-transparent text-bronze outline-none ring-0 md:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-gold/10 bg-ink px-6 py-5 md:hidden">
          {HOME_ANCHORS.map((l) =>
            l.to ? (
              <NavLink
                key={l.label}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-[11px] tracking-[0.3em] text-bronze uppercase"
              >
                {l.label}
              </NavLink>
            ) : (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => onAnchorClick(e, l.href)}
                className="block py-3 text-[11px] tracking-[0.3em] text-bronze uppercase"
              >
                {l.label}
              </a>
            ),
          )}
          <Link
            to="/shop"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[11px] tracking-[0.3em] text-gold uppercase"
          >
            Shop
          </Link>
        </nav>
      )}
    </header>
  )
}
