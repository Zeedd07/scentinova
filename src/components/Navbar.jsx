/**
 * Maison navbar - black bar. Mobile: menu toggle + logo left, Buy Now + cart right.
 * md+: menu toggle left, logo centred, Shop + bag right.
 * The menu is a white drawer that slides in from the left beneath the bar.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useScrollLock } from '../hooks/useScrollLock'
import { easeOutExpo } from '../lib/motion'
import { SOCIAL_LINKS } from '../config/site'
import BrandLogo from './BrandLogo'
import { useLenis } from './SmoothScroll'

const MENU_ID = 'site-menu'
const BELOW_NAV = 'calc(var(--nav-h) + env(safe-area-inset-top, 0px))'

const MAIN_LINKS = [
  { to: '/', label: 'Home', match: (p, h) => p === '/' && !h },
  { to: '/shop', label: 'Shop All', match: (p) => p === '/shop' || p.startsWith('/product/') },
  { hash: '#collection', label: 'Collection' },
  { hash: '#notes', label: 'Notes' },
  { to: '/about', label: 'Our Story', match: (p) => p === '/about' },
]

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.34, ease: easeOutExpo } },
}

function scrollToId(id, lenis) {
  const el = document.getElementById(id)
  if (!el) return
  const navH = document.querySelector('.site-nav')?.getBoundingClientRect().height || 56
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8
  if (lenis) lenis.scrollTo(top, { duration: 1 })
  else window.scrollTo({ top, behavior: 'smooth' })
}

function MenuToggle({ open, onClick, buttonRef }) {
  const bar = 'absolute left-1/2 top-1/2 block h-[1.5px] w-[22px] -ml-[11px] rounded-full bg-current'
  const t = { duration: 0.3, ease: easeOutExpo }
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls={MENU_ID}
      className="relative -ml-2 flex h-11 w-11 items-center justify-center border-0 bg-transparent text-warm-white transition-colors hover:text-scent-red-light focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-champagne"
    >
      <motion.span className={bar} initial={false} animate={open ? { y: 0, rotate: 45 } : { y: -7, rotate: 0 }} transition={t} />
      <motion.span className={bar} initial={false} animate={{ opacity: open ? 0 : 1, scaleX: open ? 0.4 : 1 }} transition={t} />
      <motion.span className={bar} initial={false} animate={open ? { y: 0, rotate: -45 } : { y: 7, rotate: 0 }} transition={t} />
    </button>
  )
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.5-1.1l1.6-6.3H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19.5" r="1.3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17" cy="19.5" r="1.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function ParcelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.75 5.25l8.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  )
}

const SOCIAL_ICONS = { instagram: InstagramIcon }

const drawerLink =
  'group flex items-center gap-3 py-3.5 text-[13px] tracking-[0.24em] uppercase transition-colors duration-300 outline-none focus-visible:text-scent-red sm:text-[14px]'

export default function Navbar() {
  const { count, setDrawerOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const lenis = useLenis()
  const toggleRef = useRef(null)
  const panelRef = useRef(null)
  const onHome = pathname === '/'

  useScrollLock(menuOpen)

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false)
    if (restoreFocus) toggleRef.current?.focus()
  }, [])

  // Any navigation (links, back/forward) closes the drawer
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname, hash])

  useEffect(() => {
    if (!menuOpen) return undefined

    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector(FOCUSABLE)?.focus({ preventScroll: true })
    })

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu(true)
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      // Trap focus between the toggle (still visible in the bar) and the drawer
      const nodes = [toggleRef.current, ...panelRef.current.querySelectorAll(FOCUSABLE)].filter(Boolean)
      const idx = nodes.indexOf(document.activeElement)
      const next = idx === -1 ? 0 : (idx + (e.shiftKey ? -1 : 1) + nodes.length) % nodes.length
      e.preventDefault()
      nodes[next].focus()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, closeMenu])

  const goToAnchor = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    if (onHome && hash === href) {
      // Same hash won't re-trigger ScrollToTop; wait for the scroll lock to lift
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(href.slice(1), lenis)))
      return
    }
    navigate({ pathname: '/', hash: href })
  }

  const openBag = () => {
    setMenuOpen(false)
    setDrawerOpen(true)
  }

  const isActive = (link) =>
    link.hash ? onHome && hash === link.hash : Boolean(link.match?.(pathname, hash))

  const shopActive = pathname === '/shop'

  return (
    <>
      <header className="site-nav fixed inset-x-0 top-0 z-[100] bg-black text-warm-white pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex h-[var(--nav-h)] max-w-[1600px] items-center px-3 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-10">
          <div className="flex shrink-0 items-center justify-start">
            <MenuToggle
              open={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              buttonRef={toggleRef}
            />
          </div>

          <BrandLogo onClick={() => closeMenu()} light className="ml-1 min-w-0 md:ml-0 md:justify-self-center" />

          <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:gap-4 md:ml-0">
            <Link
              to="/shop"
              aria-current={shopActive ? 'page' : undefined}
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-warm-white px-3 text-[13px] font-medium whitespace-nowrap text-black transition-colors duration-300 outline-none hover:bg-champagne focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-champagne md:hidden"
            >
              Buy Now
            </Link>
            <Link
              to="/shop"
              aria-current={shopActive ? 'page' : undefined}
              className={`hidden h-9 items-center border px-5 text-[11px] tracking-[0.32em] uppercase transition-colors duration-300 outline-none focus-visible:border-champagne md:inline-flex ${
                shopActive
                  ? 'border-champagne text-champagne'
                  : 'border-white/25 text-warm-white hover:border-champagne hover:text-champagne'
              }`}
            >
              Shop
            </Link>
            <button
              type="button"
              onClick={openBag}
              className="relative -mr-2 flex h-11 w-11 items-center justify-center border-0 bg-transparent text-warm-white transition-colors hover:text-champagne focus-visible:outline focus-visible:outline-1 focus-visible:outline-champagne"
              aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}
            >
              <span className="md:hidden">
                <CartIcon />
              </span>
              <span className="hidden md:block">
                <BagIcon />
              </span>
              {count > 0 && (
                <span className="absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-scent-red px-1 text-[10px] leading-none font-medium text-warm-white tabular-nums">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="menu-overlay"
              aria-hidden
              onClick={() => closeMenu(true)}
              className="fixed inset-x-0 bottom-0 z-[95] bg-black/45 backdrop-blur-[2px]"
              style={{ top: BELOW_NAV }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            <motion.div
              key="menu-panel"
              id={MENU_ID}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="fixed bottom-0 left-0 z-[96] flex w-[88vw] max-w-[380px] flex-col overflow-y-auto overscroll-contain bg-white text-charcoal shadow-[20px_0_60px_rgba(0,0,0,0.18)] md:w-[360px] lg:w-[400px] lg:max-w-[400px]"
              style={{ top: BELOW_NAV }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.38, ease: easeOutExpo }}
            >
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="flex min-h-full flex-col px-7 pt-7 pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] sm:px-9 sm:pt-9"
              >
                <nav aria-label="Main">
                  <ul>
                    {MAIN_LINKS.map((link) => {
                      const active = isActive(link)
                      const cls = `${drawerLink} ${active ? 'text-scent-red' : 'text-charcoal hover:text-scent-red'}`
                      const body = (
                        <>
                          <span
                            aria-hidden
                            className={`h-px bg-scent-red transition-all duration-300 ${
                              active ? 'w-5' : 'w-0 group-hover:w-3'
                            }`}
                          />
                          {link.label}
                        </>
                      )
                      return (
                        <motion.li key={link.label} variants={itemVariants} className="border-b border-stone/60">
                          {link.hash ? (
                            <a
                              href={`/${link.hash}`}
                              onClick={(e) => goToAnchor(e, link.hash)}
                              aria-current={active ? 'location' : undefined}
                              className={cls}
                            >
                              {body}
                            </a>
                          ) : (
                            <Link
                              to={link.to}
                              onClick={() => closeMenu()}
                              aria-current={active ? 'page' : undefined}
                              className={cls}
                            >
                              {body}
                            </Link>
                          )}
                        </motion.li>
                      )
                    })}
                  </ul>
                </nav>

                <div className="min-h-10 flex-1" />

                <motion.div variants={itemVariants} className="border-t border-stone/60 pt-2">
                  <NavLink
                    to="/track-order"
                    onClick={() => closeMenu()}
                    className={({ isActive: active }) =>
                      `${drawerLink} text-[12px] sm:text-[12px] ${active ? 'text-scent-red' : 'text-charcoal hover:text-scent-red'}`
                    }
                  >
                    <ParcelIcon />
                    Track Order
                  </NavLink>
                </motion.div>

                {SOCIAL_LINKS.length > 0 && (
                  <motion.div variants={itemVariants} className="mt-6">
                    <p className="text-[10px] tracking-[0.36em] text-muted uppercase">Follow us</p>
                    <ul className="mt-4 flex items-center gap-3">
                      {SOCIAL_LINKS.map((s) => {
                        const Icon = SOCIAL_ICONS[s.id]
                        return (
                          <li key={s.id}>
                            <a
                              href={s.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Scentinova on ${s.label}`}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-stone text-charcoal transition-colors duration-300 hover:border-scent-red hover:text-scent-red focus-visible:border-scent-red focus-visible:text-scent-red focus-visible:outline-none"
                            >
                              {Icon ? <Icon /> : s.label}
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
