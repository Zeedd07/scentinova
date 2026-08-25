/**
 * Customer praise — three testimonial columns.
 */
import { motion } from 'framer-motion'

const QUOTES = [
  {
    initial: 'A',
    text: 'AURUM is the most captivating scent I have ever owned. A true private luxury.',
  },
  {
    initial: 'H',
    text: 'Finally, a fragrance that feels like me. The Discovery Set was perfect.',
  },
  {
    initial: 'I',
    text: 'SABLE smells like a timeless memory. Exceptional.',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-cream px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-14 text-center font-display text-3xl tracking-[0.15em] text-ink uppercase sm:text-4xl">
          Customer <span className="gold-text">Praise</span>
        </h2>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {QUOTES.map((q, i) => (
            <motion.blockquote
              key={q.initial}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold font-display text-xl text-gold">
                {q.initial}
              </span>
              <p className="mt-3 text-sm text-gold">★★★★★</p>
              <p className="mt-4 max-w-xs font-display text-lg leading-relaxed text-ink/85 italic">
                “{q.text}”
              </p>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
