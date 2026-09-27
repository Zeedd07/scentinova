/**
 * Final CTA - cream/white closing frame into the collection.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { easeOutExpo, fadeUp, viewportOnce } from '../lib/motion'

export default function FinalCTA() {
  return (
    <section
      id="discover"
      className="relative overflow-hidden bg-ivory px-6 py-20 text-charcoal sm:px-10 sm:py-28 lg:px-16"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,162,74,0.14), transparent 70%)',
        }}
      />
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-display text-[13vw] leading-none tracking-[0.08em] text-scent-red opacity-[0.05] xl:text-[11rem]"
      >
        SCENTINOVA
      </p>

      <div className="relative z-10 mx-auto flex max-w-6xl justify-center">
        <motion.div
          initial={fadeUp.initial}
          whileInView={fadeUp.animate}
          viewport={viewportOnce}
          transition={{ duration: 0.9, ease: easeOutExpo }}
          className="max-w-md text-center"
        >
          <span aria-hidden className="mx-auto mb-5 flex w-fit items-center gap-2">
            <span className="h-px w-8 bg-scent-red" />
            <span className="h-px w-4 bg-gold" />
          </span>
          <p className="mb-4 text-[11px] tracking-[0.42em] text-bronze uppercase">
            The Closing Frame
          </p>
          <h2 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Discover your{' '}
            <span className="italic text-bronze">signature</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-espresso sm:text-base">
            Four fragrances. Four feelings. A moment that stays.
          </p>
          <Link
            to="/shop"
            className="btn-luxury mt-10 inline-flex items-center gap-3 border border-charcoal/70 px-10 py-4 text-charcoal"
          >
            Explore collection
            <span aria-hidden>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
