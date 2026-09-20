/**
 * About the maison — Scentinova.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <div className="bg-ivory pt-16">
      <section className="relative overflow-hidden px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
        <div className="relative mx-auto max-w-3xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] tracking-[0.4em] text-muted uppercase"
          >
            Our story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 font-display text-4xl text-charcoal sm:text-6xl"
          >
            Maison <span className="italic text-gold">Scentinova</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10 space-y-6 text-base leading-relaxed text-muted sm:text-lg"
          >
            <p>
              Heavenly Crafted Perfume — four signatures composed for presence.
              Each flacon is crystal and gold; each formula is built to linger
              past the first hour.
            </p>
            <p>
              Lunar Leather. Oud on the Petals. Masai-Mara. Seaweed. A house
              built on contrast — dark leather and white florals, burnt rose and
              marine musk — always with the same restraint.
            </p>
            <p className="font-display text-xl italic text-charcoal/90">
              “A fragrance is not what you wear. It is what remains.”
            </p>
          </motion.div>

          <div className="mt-14 grid gap-8 border-t border-stone pt-12 sm:grid-cols-3">
            {[
              { t: 'Four signatures', d: 'A focused house — never diluted' },
              { t: 'Honest notes', d: 'Top, heart, base — nothing masked' },
              { t: 'Pure Parfum', d: 'Concentration that stays on skin' },
            ].map((item) => (
              <div key={item.t}>
                <p className="font-display text-xl text-charcoal">{item.t}</p>
                <p className="mt-2 text-sm text-muted">{item.d}</p>
              </div>
            ))}
          </div>

          <Link
            to="/shop"
            className="btn-luxury mt-14 inline-block border border-charcoal px-10 py-3.5 text-charcoal"
          >
            Explore the shop
          </Link>
        </div>
      </section>
    </div>
  )
}
