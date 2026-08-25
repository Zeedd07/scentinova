/**
 * Fragrance Journey — infinite marquee of ingredient orbs.
 */
import { useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const INGREDIENTS = [
  {
    name: 'Bergamot',
    layer: 'Top',
    copy: 'Sunlit citrus — the first bright breath.',
    img: '/ingredients/bergamot.jpg',
  },
  {
    name: 'Rose',
    layer: 'Heart',
    copy: 'Damask petals, soft and absolute.',
    img: '/ingredients/rose.jpg',
  },
  {
    name: 'Amber',
    layer: 'Heart',
    copy: 'Resinous warmth at the golden center.',
    img: '/ingredients/amber.jpg',
  },
  {
    name: 'Oud',
    layer: 'Base',
    copy: 'Smoked wood — velvet depth that lingers.',
    img: '/ingredients/oud.jpg',
  },
  {
    name: 'Vanilla',
    layer: 'Base',
    copy: 'Creamed silk in the dry-down.',
    img: '/ingredients/vanilla.jpg',
  },
  {
    name: 'Sandalwood',
    layer: 'Base',
    copy: 'Polished wood, quiet and lasting.',
    img: '/ingredients/sandalwood.jpg',
  },
]

function IngredientOrb({ ing, index, active, setActive, pauseMarquee }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spring = { stiffness: 120, damping: 18 }
  const rx = useSpring(my, spring)
  const ry = useSpring(mx, spring)

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    mx.set(px * 14)
    my.set(py * -14)
  }

  const onLeave = () => {
    mx.set(0)
    my.set(0)
    setActive(null)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative flex w-[150px] shrink-0 cursor-pointer flex-col items-center sm:w-[168px]"
      onMouseMove={onMove}
      onMouseEnter={() => {
        setActive(ing.name)
        pauseMarquee?.(true)
      }}
      onMouseLeave={() => {
        onLeave()
        pauseMarquee?.(false)
      }}
      onFocus={() => pauseMarquee?.(true)}
      onBlur={() => pauseMarquee?.(false)}
      onMouseDown={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setActive(ing.name)
        }
      }}
      aria-label={`${ing.name}, ${ing.layer} note`}
    >
      <div
        className="pointer-events-none absolute top-8 h-28 w-28 rounded-full opacity-0 blur-2xl transition duration-700 group-hover:opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(212,175,55,0.4), transparent 70%)',
        }}
      />

      <motion.div
        className="relative h-[132px] w-[132px] sm:h-[148px] sm:w-[148px]"
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'linear-gradient(145deg, rgba(244,229,178,0.45), rgba(212,175,55,0.05) 40%, rgba(10,8,5,0.8) 70%, rgba(244,229,178,0.2))',
            padding: 1,
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-full bg-ink">
            <img
              src={ing.img}
              alt=""
              className="h-full w-full scale-110 object-cover transition duration-700 group-hover:scale-125"
              loading="lazy"
              draggable={false}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.35), transparent 32%), radial-gradient(circle at 70% 80%, rgba(212,175,55,0.15), transparent 40%)',
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-gold-light/25" />
          </div>
        </div>

        <span className="absolute -bottom-1 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-gold/40 bg-ink text-[10px] tracking-wider text-gold">
          {String((index % INGREDIENTS.length) + 1).padStart(2, '0')}
        </span>
      </motion.div>

      <span className="mt-7 text-[11px] tracking-[0.35em] text-bronze uppercase">
        {ing.layer}
      </span>
      <span className="mt-1.5 font-display text-xl text-cream transition group-hover:text-gold-light sm:text-2xl">
        {ing.name}
      </span>

      <p
        className={`mt-3 max-w-[150px] text-center text-[12px] leading-relaxed text-bronze transition-opacity duration-300 ${
          active === ing.name ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {ing.copy}
      </p>
    </div>
  )
}

export default function FragranceJourney() {
  const [active, setActive] = useState(null)
  const [paused, setPaused] = useState(false)

  const loop = [...INGREDIENTS, ...INGREDIENTS]

  return (
    <section
      id="notes"
      className="bg-luxury relative overflow-hidden py-16 sm:py-24"
    >
      <div className="section-fade-top" />
      <div className="section-fade-bottom" />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            'radial-gradient(circle, rgba(212,175,55,0.14), transparent 68%)',
        }}
      />

      <div className="relative mx-auto mb-12 max-w-6xl px-6 sm:px-10 lg:mb-16 lg:px-16">
        <div className="max-w-xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-4 text-[11px] tracking-[0.42em] text-bronze uppercase"
          >
            The Fragrance Journey
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="font-display text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl"
          >
            A world of{' '}
            <span className="gold-text italic">precious ingredients</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="mt-5 max-w-md text-sm leading-relaxed text-bronze sm:text-[15px]"
          >
            Six notes in crystal light — drifting in a continuous ribbon. Hover
            to pause and open each chapter.
          </motion.p>
        </div>
      </div>

      {/* Marquee track */}
      <div className="journey-marquee relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-ink to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-ink to-transparent sm:w-28" />

        <div
          className={`journey-marquee-track flex w-max gap-10 py-4 sm:gap-14 ${
            paused ? 'is-paused' : ''
          }`}
        >
          {loop.map((ing, i) => (
            <IngredientOrb
              key={`${ing.name}-${i}`}
              ing={ing}
              index={i}
              active={active}
              setActive={setActive}
              pauseMarquee={setPaused}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-8 px-6 text-[11px] tracking-[0.3em] text-bronze uppercase"
      >
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gold" /> Top
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gold/70" /> Heart
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gold/40" /> Base
        </span>
      </motion.div>
    </section>
  )
}
