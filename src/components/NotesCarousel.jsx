/**
 * Ingredients / notes — horizontal scroll glassmorphism cards with gold icons.
 */
import { useRef } from 'react'
import { motion } from 'framer-motion'

const NOTES = [
  {
    title: 'Bergamot',
    layer: 'Top',
    copy: 'Sunlit peel and bright green zest — the first breath.',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
        <circle cx="24" cy="24" r="14" stroke="url(#g1)" strokeWidth="1.2" />
        <path d="M24 12v24M12 24h24" stroke="url(#g1)" strokeWidth="1" opacity="0.6" />
        <defs>
          <linearGradient id="g1" x1="8" y1="8" x2="40" y2="40">
            <stop stopColor="#d4af37" />
            <stop offset="1" stopColor="#f4e5b2" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: 'Amber',
    layer: 'Heart',
    copy: 'Warm resin and soft spice — the gold at the center.',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
        <path
          d="M24 8l4.5 11.5L40 24l-11.5 4.5L24 40l-4.5-11.5L8 24l11.5-4.5L24 8z"
          stroke="url(#g2)"
          strokeWidth="1.2"
        />
        <defs>
          <linearGradient id="g2" x1="8" y1="8" x2="40" y2="40">
            <stop stopColor="#d4af37" />
            <stop offset="1" stopColor="#f4e5b2" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: 'Oud',
    layer: 'Base',
    copy: 'Smoked wood and velvet depth — what lingers on skin.',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
        <rect x="14" y="10" width="20" height="28" rx="2" stroke="url(#g3)" strokeWidth="1.2" />
        <path d="M18 18h12M18 24h12M18 30h8" stroke="url(#g3)" strokeWidth="1" opacity="0.7" />
        <defs>
          <linearGradient id="g3" x1="14" y1="10" x2="34" y2="38">
            <stop stopColor="#d4af37" />
            <stop offset="1" stopColor="#f4e5b2" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: 'Saffron',
    layer: 'Accent',
    copy: 'A thread of fire woven through the amber heart.',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
        <path
          d="M24 10c0 8-10 12-10 22a10 10 0 0020 0c0-10-10-14-10-22z"
          stroke="url(#g4)"
          strokeWidth="1.2"
        />
        <defs>
          <linearGradient id="g4" x1="14" y1="10" x2="34" y2="40">
            <stop stopColor="#d4af37" />
            <stop offset="1" stopColor="#f4e5b2" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: 'Vanilla',
    layer: 'Dry-down',
    copy: 'Creamed warmth that softens the oud into silk.',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
        <ellipse cx="24" cy="24" rx="12" ry="16" stroke="url(#g5)" strokeWidth="1.2" />
        <path d="M24 12v24" stroke="url(#g5)" strokeWidth="1" opacity="0.5" />
        <defs>
          <linearGradient id="g5" x1="12" y1="8" x2="36" y2="40">
            <stop stopColor="#d4af37" />
            <stop offset="1" stopColor="#f4e5b2" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
]

export default function NotesCarousel() {
  const trackRef = useRef(null)

  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <section
      id="notes"
      className="relative bg-panel/40 py-24 sm:py-32"
      aria-label="Fragrance notes"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 flex items-end justify-between gap-6"
        >
          <div>
            <p className="mb-3 text-[11px] tracking-[0.4em] text-bronze uppercase">
              Notes
            </p>
            <h2 className="font-display text-4xl text-cream sm:text-5xl">
              Layered in <span className="gold-text italic">gold</span>
            </h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="flex h-10 w-10 items-center justify-center border border-gold/30 text-gold transition hover:border-gold hover:bg-gold/10"
              aria-label="Scroll notes left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="flex h-10 w-10 items-center justify-center border border-gold/30 text-gold transition hover:border-gold hover:bg-gold/10"
              aria-label="Scroll notes right"
            >
              →
            </button>
          </div>
        </motion.div>
      </div>

      <div
        ref={trackRef}
        className="notes-track flex gap-5 overflow-x-auto px-6 pb-4 sm:px-10 lg:px-16"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {NOTES.map((note, i) => (
          <motion.article
            key={note.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: i * 0.08 }}
            className="glass-card w-[260px] shrink-0 scroll-snap-align-start p-7 sm:w-[280px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="mb-6">{note.icon}</div>
            <p className="text-[11px] tracking-[0.35em] text-bronze uppercase">
              {note.layer}
            </p>
            <h3 className="mt-2 font-display text-2xl text-cream">{note.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-bronze">{note.copy}</p>
          </motion.article>
        ))}
        {/* Trailing spacer for edge padding on scroll */}
        <div className="w-2 shrink-0" aria-hidden />
      </div>
    </section>
  )
}
