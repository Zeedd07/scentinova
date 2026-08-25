/**
 * Story — bottle craft, wear arc, notes + 3D-tilt flacon.
 */
import { motion } from 'framer-motion'
import TiltBottle from './TiltBottle'

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
}

const SPECS = [
  { label: 'Volume', value: '50 ml' },
  { label: 'Concentration', value: 'Eau de Parfum' },
  { label: 'Vessel', value: 'Dark glass flacon' },
  { label: 'Seal', value: 'Hand-set gold cap' },
]

const WEAR = [
  { hour: 'Morning', line: 'Bergamot opens — bright peel, cool air.' },
  { hour: 'Afternoon', line: 'Amber warms the pulse; soft spice blooms.' },
  { hour: 'Night', line: 'Oud and vanilla linger on scarf and skin.' },
]

export default function Story() {
  return (
    <section
      id="story"
      className="relative overflow-hidden bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div
        className="pointer-events-none absolute -right-32 top-1/4 h-[480px] w-[480px] rounded-full opacity-30 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #8a6d3b 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.p
            custom={0}
            variants={fadeUp}
            className="mb-4 text-[11px] tracking-[0.4em] text-bronze uppercase"
          >
            The Composition
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="font-display text-4xl leading-tight text-cream sm:text-5xl"
          >
            Gold amber held in{' '}
            <span className="gold-text italic">glass silence</span>
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-6 max-w-md text-sm leading-relaxed text-bronze sm:text-base"
          >
            Cut from heavy dark glass, the rectangular flacon is meant to sit
            like architecture on a vanity — not a trinket. The gold cap turns
            with a soft click; the neck is ground glass, airtight. Inside:
            bergamot bright as dawn, amber warm as dusk, oud deep as memory.
          </motion.p>

          <motion.ul
            custom={3}
            variants={fadeUp}
            className="mt-10 space-y-4 border-l border-gold/25 pl-6"
          >
            {[
              { note: 'Bergamot', desc: 'Citrus lift, crystalline opening' },
              { note: 'Amber', desc: 'Resinous warmth at the heart' },
              { note: 'Oud', desc: 'Smoked wood, lasting base' },
            ].map((item) => (
              <li key={item.note}>
                <span className="font-display text-xl text-cream">{item.note}</span>
                <span className="mt-0.5 block text-xs tracking-wide text-bronze">
                  {item.desc}
                </span>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <TiltBottle src="/frames/frame-001.jpg" />
          <p className="mt-4 text-center text-[11px] tracking-[0.3em] text-bronze uppercase">
            Move to tilt
          </p>
        </motion.div>
      </div>

      {/* Bottle specs */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="relative mx-auto mt-20 grid max-w-6xl grid-cols-2 gap-px overflow-hidden border border-gold/20 bg-gold/20 sm:grid-cols-4"
      >
        {SPECS.map((s) => (
          <div key={s.label} className="bg-ink px-5 py-6 text-center sm:px-6">
            <p className="text-[11px] tracking-[0.3em] text-bronze uppercase">
              {s.label}
            </p>
            <p className="mt-2 font-display text-lg text-cream sm:text-xl">
              {s.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Wear arc */}
      <div className="relative mx-auto mt-24 max-w-6xl">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-3 text-center text-[11px] tracking-[0.4em] text-bronze uppercase"
        >
          A day in Aurum
        </motion.p>
        <motion.h3
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center font-display text-3xl text-cream sm:text-4xl"
        >
          How it <span className="gold-text italic">wears</span>
        </motion.h3>

        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {WEAR.map((w, i) => (
            <motion.div
              key={w.hour}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className="text-center md:text-left"
            >
              <span className="text-[11px] tracking-[0.35em] text-gold uppercase">
                {String(i + 1).padStart(2, '0')} · {w.hour}
              </span>
              <p className="mt-3 font-display text-xl text-cream">{w.hour}</p>
              <p className="mt-2 text-sm leading-relaxed text-bronze">{w.line}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Craft note */}
      <motion.blockquote
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative mx-auto mt-24 max-w-2xl border-t border-gold/25 pt-10 text-center"
      >
        <p className="font-display text-xl italic leading-relaxed text-cream/90 sm:text-2xl">
          “Each bottle is filled in small atelier batches — numbered, sealed,
          and meant to outlast the season it was poured.”
        </p>
        <footer className="mt-4 text-[11px] tracking-[0.28em] text-bronze uppercase">
          SCENTINOVA · Atelier note
        </footer>
      </motion.blockquote>
    </section>
  )
}
