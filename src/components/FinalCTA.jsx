/**
 * Final cinematic CTA — closing shot of a luxury fragrance film.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Particles from './Particles'

export default function FinalCTA() {
  return (
    <section
      id="discover"
      className="sunset-sky relative overflow-hidden px-6 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      {/* Soft ink veil into Closing Frame */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[6] h-24 sm:h-32"
        style={{
          background:
            'linear-gradient(180deg, #050403 0%, rgba(5,4,3,0.7) 45%, transparent 100%)',
        }}
      />
      {/* Soft water reflection band */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] opacity-50"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(5,4,3,0.4) 20%, rgba(20,14,10,0.85))',
          transform: 'scaleY(-1)',
          transformOrigin: 'top',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      />

      <div className="absolute inset-0 opacity-60">
        <Particles density={48} />
      </div>

      {/* Silk ribbon shapes */}
      <svg
        className="pointer-events-none absolute -right-10 top-1/4 h-[60%] w-[45%] opacity-30"
        viewBox="0 0 400 600"
        fill="none"
        aria-hidden
      >
        <path
          d="M80 40C180 120 220 200 160 300C100 400 200 480 320 560"
          stroke="url(#silk)"
          strokeWidth="48"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M200 20C280 140 120 220 180 340C240 460 300 500 360 580"
          stroke="url(#silk)"
          strokeWidth="28"
          strokeLinecap="round"
          opacity="0.35"
        />
        <defs>
          <linearGradient id="silk" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f4e5b2" stopOpacity="0.9" />
            <stop offset="1" stopColor="#d4af37" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 mx-auto flex max-w-6xl justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9 }}
          className="max-w-md text-center"
        >
          <p className="mb-4 text-[11px] tracking-[0.42em] text-champagne/80 uppercase">
            The Closing Frame
          </p>
          <h2 className="font-display text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl">
            Discover your{' '}
            <span className="gold-text italic">signature</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-cream/70 sm:text-base">
            A fragrance. A feeling. A moment that stays.
          </p>
          <Link
            to="/shop"
            className="btn-luxury gold-border mt-10 inline-flex items-center gap-3 rounded-sm px-10 py-4 text-cream"
          >
            Explore collection
            <span aria-hidden>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
