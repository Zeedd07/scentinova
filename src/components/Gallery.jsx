/**
 * Gallery — stills from the frame sequence with light parallax on scroll.
 */
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const STILLS = [
  { src: '/frames/frame-001.jpg', caption: 'The flacon', span: 'lg:col-span-2' },
  { src: '/frames/frame-075.jpg', caption: 'Into the mist', span: 'lg:col-span-1' },
  { src: '/frames/frame-150.jpg', caption: 'Gold ribbons', span: 'lg:col-span-1' },
  { src: '/frames/frame-225.jpg', caption: 'Return', span: 'lg:col-span-2' },
]

function ParallaxImage({ src, caption, span, index }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  // Alternate parallax direction for depth
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    index % 2 === 0 ? ['-6%', '6%'] : ['4%', '-4%'],
  )

  return (
    <motion.figure
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay: index * 0.08 }}
      className={`group relative overflow-hidden ${span}`}
    >
      <div className="aspect-[4/3] overflow-hidden bg-panel">
        <motion.img
          src={src}
          alt={caption}
          className="h-[112%] w-full object-cover will-change-transform"
          style={{ y }}
          loading="lazy"
        />
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-5 pb-4 pt-12">
        <span className="text-[11px] tracking-[0.35em] text-gold-light/80 uppercase">
          {caption}
        </span>
      </figcaption>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/10 transition group-hover:ring-gold/30" />
    </motion.figure>
  )
}

export default function Gallery() {
  return (
    <section id="gallery" className="bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-14"
        >
          <p className="mb-3 text-[11px] tracking-[0.4em] text-bronze uppercase">
            Gallery
          </p>
          <h2 className="font-display text-4xl text-cream sm:text-5xl">
            Moments in the{' '}
            <span className="gold-text italic">sequence</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {STILLS.map((still, i) => (
            <ParallaxImage key={still.src} {...still} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
