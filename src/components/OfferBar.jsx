/**
 * Cream announcement bar above the navbar. Rotates the active offers set in
 * admin (arrows + auto-advance); hidden entirely when there are none.
 * Its height is exposed as --offer-h via `html.has-offer-bar` (see index.css).
 */
import { useEffect, useLayoutEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { fetchOffers } from '../services/offerApi'

const CACHE_KEY = 'scentinova:offers:v1'
const ROTATE_MS = 4500
const HTML_CLASS = 'has-offer-bar'

function isOfferList(value) {
  return (
    Array.isArray(value) &&
    value.every((o) => o && typeof o.id === 'string' && typeof o.text === 'string')
  )
}

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
    return isOfferList(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCache(offers) {
  try {
    if (offers.length) localStorage.setItem(CACHE_KEY, JSON.stringify(offers))
    else localStorage.removeItem(CACHE_KEY)
  } catch {
    // Storage can be unavailable (private mode); the bar still works uncached
  }
}

function Chevron({ dir }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Sparkle({ className = '' }) {
  return (
    <svg viewBox="0 0 12 12" className={`h-2 w-2 shrink-0 ${className}`} aria-hidden>
      <path d="M6 0c.4 3 2.6 5.6 6 6-3.4.4-5.6 3-6 6-.4-3-2.6-5.6-6-6 3.4-.4 5.6-3 6-6Z" fill="currentColor" />
    </svg>
  )
}

const arrowCls =
  'relative z-[2] flex h-full w-9 shrink-0 items-center justify-center border-0 bg-transparent text-charcoal/45 transition-colors duration-300 hover:text-bronze focus-visible:text-bronze focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-bronze sm:w-12'

export default function OfferBar() {
  const [offers, setOffers] = useState(readCache)
  const [[index, direction], setSlide] = useState([0, 1])
  const [paused, setPaused] = useState(false)
  const reduceMotion = useReducedMotion()
  const count = offers.length
  const current = count ? offers[index % count] : null

  useEffect(() => {
    const controller = new AbortController()
    fetchOffers({ signal: controller.signal })
      .then((list) => {
        const clean = isOfferList(list) ? list : []
        setOffers(clean)
        writeCache(clean)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setOffers([])
        writeCache([])
      })
    return () => controller.abort()
  }, [])

  useLayoutEffect(() => {
    document.documentElement.classList.toggle(HTML_CLASS, count > 0)
    return () => document.documentElement.classList.remove(HTML_CLASS)
  }, [count])

  useEffect(() => {
    if (count < 2 || paused) return undefined
    const id = window.setInterval(() => {
      setSlide(([i]) => [(i + 1) % count, 1])
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [count, paused])

  if (!current) return null

  const go = (step) => setSlide(([i]) => [(i + step + count) % count, step])
  const offset = reduceMotion ? 0 : 18

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Offers"
      className="offer-bar relative flex h-[var(--offer-h)] items-stretch overflow-hidden text-charcoal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false)
      }}
    >
      <span aria-hidden className="offer-bar-shine pointer-events-none absolute inset-y-0 left-0 z-[1] w-1/3" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent"
      />

      {count > 1 ? (
        <button type="button" className={arrowCls} onClick={() => go(-1)} aria-label="Previous offer">
          <Chevron dir="prev" />
        </button>
      ) : null}

      <div
        className="relative z-[2] min-w-0 flex-1 overflow-hidden"
        aria-live={paused || count < 2 ? 'polite' : 'off'}
        aria-atomic="true"
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.p
            key={current.id}
            custom={direction}
            variants={{
              enter: (d) => ({ opacity: 0, x: d * offset }),
              center: { opacity: 1, x: 0 },
              exit: (d) => ({ opacity: 0, x: d * -offset }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 m-0 flex items-center justify-center gap-2.5 px-2 text-center text-[10px] leading-[1.25] tracking-[0.16em] uppercase sm:gap-4 sm:text-[11px] sm:tracking-[0.3em]"
          >
            <Sparkle className="text-gold" />
            <span className="line-clamp-2">{current.text}</span>
            <Sparkle className="text-gold" />
          </motion.p>
        </AnimatePresence>
      </div>

      {count > 1 ? (
        <button type="button" className={arrowCls} onClick={() => go(1)} aria-label="Next offer">
          <Chevron dir="next" />
        </button>
      ) : null}
    </div>
  )
}
