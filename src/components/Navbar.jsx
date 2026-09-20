/**
 * Maison navbar — Vizzari-inspired: logo left, gold links right.
 * Same destinations: Collection · Notes · Our Story · Shop · Cart
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

const linkBase =
  'relative border-0 bg-transparent pb-1 text-[11px] tracking-[0.28em] text-[#d2b879] uppercase transition outline-none hover:text-[#e8d49a]'

const linkActive =
  'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[#d2b879]'

function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const nav = document.querySelector('.site-nav')
  const navH = nav?.getBoundingClientRect().height || 56
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function Navbar() {
  const { count, setDrawerOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const onHome = pathname === '/'

  const onAnchorClick = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    const id = href.replace('#', '')
    if (onHome) {
      scrollToId(id)
      window.history.replaceState(null, '', href)
    } else {
      navigate({ pathname: '/', hash: href })
    }
  }

  const isAnchorActive = (href) => onHome && hash === href

  return (
    <header className="site-nav fixed inset-x-0 top-0 z-[100] bg-black text-[#d2b879] pt-[env(safe-area-inset-top,0px)] [&_a]:outline-none [&_button]:outline-none">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-[1400px] items-center justify-between px-4 sm:px-8 lg:px-16">
        <BrandLogo onClick={() => setMenuOpen(false)} light />

        <div className="flex items-center gap-3 sm:gap-6">
          <nav
            className="hidden items-center gap-8 lg:gap-10 md:flex"
            aria-label="Primary"
          >
            {HOME_ANCHORS.map((l) =>
              l.to ? (
                <NavLink
                  key={l.label}
                  to={l.to}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : ''}`
                  }
                >
                  {l.label}
                </NavLink>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={(e) => onAnchorClick(e, l.href)}
                  className={`${linkBase} ${isAnchorActive(l.href) ? linkActive : ''}`}
                >
                  {l.label}
                </a>
              ),
            )}
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ''}`
              }
            >
              Shop
            </NavLink>
          </nav>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative border-0 bg-transparent text-[#d2b879] transition outline-none hover:text-[#e8d49a]"
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
              <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d2b879] px-1 text-[10px] font-medium text-black">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            className="border-0 bg-transparent text-[#d2b879] outline-none md:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-[#d2b879]/15 bg-black px-6 py-4 md:hidden">
          {HOME_ANCHORS.map((l) =>
            l.to ? (
              <NavLink
                key={l.label}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-[11px] tracking-[0.3em] text-[#d2b879] uppercase"
              >
                {l.label}
              </NavLink>
            ) : (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => onAnchorClick(e, l.href)}
                className="block py-3 text-[11px] tracking-[0.3em] text-[#d2b879] uppercase"
              >
                {l.label}
              </a>
            ),
          )}
          <Link
            to="/shop"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[11px] tracking-[0.3em] text-[#d2b879] uppercase"
          >
            Shop
          </Link>
        </nav>
      )}
    </header>
  )
}
