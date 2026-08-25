/**
 * About the maison.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
        <div
          className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #8a6d3b 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] tracking-[0.4em] text-bronze uppercase"
          >
            Our story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 font-display text-4xl text-cream sm:text-6xl"
          >
            Maison <span className="gold-text italic">Aurum</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10 space-y-6 text-base leading-relaxed text-bronze sm:text-lg"
          >
            <p>
              We compose fragrances the way a jeweller sets stone — slowly,
              with intention, in small atelier runs. Each flacon is dark glass
              and gold; each formula is built to linger past the first hour.
            </p>
            <p>
              Aurum began with a single scent: bergamot, amber, oud. The
              collection grew around that signature — nocturne florals,
              sun-warmed woods, sea mist, leather, honeyed tobacco — always
              with the same restraint.
            </p>
            <p className="font-display text-xl italic text-cream/90">
              “Not perfume. A private hour in gold.”
            </p>
          </motion.div>

          <div className="mt-14 grid gap-8 border-t border-gold/20 pt-12 sm:grid-cols-3">
            {[
              { t: 'Atelier batches', d: 'Numbered fills, never mass-poured' },
              { t: 'Honest notes', d: 'Top, heart, base — nothing masked' },
              { t: 'Lasting wear', d: 'Eau de Parfum strength by default' },
            ].map((item) => (
              <div key={item.t}>
                <p className="font-display text-xl text-cream">{item.t}</p>
                <p className="mt-2 text-sm text-bronze">{item.d}</p>
              </div>
            ))}
          </div>

          <Link
            to="/shop"
            className="btn-luxury gold-border mt-14 inline-block rounded-sm px-10 py-3.5 text-cream"
          >
            Explore the shop
          </Link>
        </div>
      </section>
    </div>
  )
}
