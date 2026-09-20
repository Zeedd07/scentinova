/**
 * About — maison story, cream editorial frame.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { easeOutExpo, fadeUp } from '../lib/motion'

const SIGNATURES = [
  'Lunar Leather',
  'Oud on the Petals',
  'Masai-Mara',
  'Seaweed',
]

export default function AboutPage() {
  return (
    <div className="bg-[#f7f3eb] pt-[calc(var(--nav-h)+0.5rem)]">
      <section className="relative overflow-hidden px-6 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 18% 20%, rgba(180,151,90,0.16), transparent 62%), radial-gradient(ellipse 50% 40% at 88% 78%, rgba(196,160,74,0.1), transparent 65%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          <motion.p
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.7, ease: easeOutExpo }}
            className="text-[11px] tracking-[0.4em] text-[#7a6438] uppercase"
          >
            Our story
          </motion.p>

          <motion.h1
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ delay: 0.05, duration: 0.85, ease: easeOutExpo }}
            className="mt-4 font-display text-5xl leading-[1.05] text-charcoal sm:text-6xl md:text-7xl"
          >
            <span className="block tracking-[0.06em]">SCENTINOVA</span>
            <span className="mt-2 block font-display text-3xl italic font-normal text-[#9a7b3c] sm:text-4xl">
              Heavenly Crafted Perfume
            </span>
          </motion.h1>

          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ delay: 0.12, duration: 0.85, ease: easeOutExpo }}
            className="mt-10 max-w-xl space-y-5 text-sm leading-relaxed text-[#4a4136] sm:mt-12 sm:text-base"
          >
            <p>
              Four signatures composed for presence. Each flacon is crystal and
              gold; each formula is built to linger past the first hour.
            </p>
            <p>
              A house built on contrast — dark leather and white florals, burnt
              rose and marine musk — always with the same restraint.
            </p>
          </motion.div>

          <motion.p
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ delay: 0.18, duration: 0.85, ease: easeOutExpo }}
            className="mt-12 font-display text-2xl italic leading-snug text-charcoal/90 sm:mt-14 sm:text-3xl"
          >
            “A fragrance is not what you wear. It is what remains.”
          </motion.p>

          <motion.ul
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ delay: 0.24, duration: 0.85, ease: easeOutExpo }}
            className="mt-14 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#d4c4a0]/70 pt-10 text-[11px] tracking-[0.28em] text-[#8a6e3a] uppercase sm:gap-x-10"
          >
            {SIGNATURES.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </motion.ul>

          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ delay: 0.3, duration: 0.85, ease: easeOutExpo }}
          >
            <Link
              to="/shop"
              className="btn-luxury mt-12 inline-flex items-center gap-3 border border-[#1b1917]/70 px-10 py-4 text-[#1b1917] transition hover:border-[#9a7b3c] hover:bg-[#1b1917] hover:text-[#f7f3eb] sm:mt-14"
            >
              Explore the collection
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
