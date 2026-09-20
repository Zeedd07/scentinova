/**
 * Final CTA — cream/white closing frame into the collection.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function FinalCTA() {
  return (
    <section
      id="discover"
      className="relative overflow-hidden bg-[#f7f3eb] px-6 py-20 text-[#1b1917] sm:px-10 sm:py-28 lg:px-16"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(180,151,90,0.14), transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-6xl justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9 }}
          className="max-w-md text-center"
        >
          <p className="mb-4 text-[11px] tracking-[0.42em] text-[#7a6438] uppercase">
            The Closing Frame
          </p>
          <h2 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Discover your{' '}
            <span className="italic text-[#9a7b3c]">signature</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-[#4a4136] sm:text-base">
            Four fragrances. Four feelings. A moment that stays.
          </p>
          <Link
            to="/shop"
            className="btn-luxury mt-10 inline-flex items-center gap-3 border border-[#1b1917]/70 px-10 py-4 text-[#1b1917] hover:border-[#9a7b3c] hover:bg-[#1b1917] hover:text-[#f7f3eb]"
          >
            Explore collection
            <span aria-hidden>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
