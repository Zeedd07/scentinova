/**
 * Buy / CTA — Aurum signature with real cart add + shop link.
 */
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Particles from './Particles'
import { useCart } from '../context/CartContext'
import { getProductBySlug, formatPrice } from '../data/products'

export default function BuyCTA() {
  const aurum = getProductBySlug('aurum')
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const onAdd = () => {
    if (!aurum) return
    addItem(aurum)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <section
      id="buy"
      className="relative overflow-hidden bg-panel px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="absolute inset-0 opacity-70">
        <Particles density={36} />
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, #d4af37 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4 text-[11px] tracking-[0.4em] text-bronze uppercase"
        >
          Acquire
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-display text-4xl text-cream sm:text-5xl"
        >
          Aurum <span className="gold-text italic">50 ml</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative my-10 w-48 sm:w-56"
        >
          <Link to="/product/aurum" className="gold-border block rounded-sm p-[1px]">
            <div className="overflow-hidden rounded-sm bg-ink">
              <img
                src="/frames/frame-001.jpg"
                alt="Aurum perfume bottle"
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
            </div>
          </Link>
        </motion.div>

        <p className="mt-2 max-w-xs text-sm leading-relaxed text-bronze">
          Dark glass · gold seal · bergamot, amber, oud. A scent that settles
          into skin like evening light.
        </p>

        <p className="mt-8 font-display text-3xl gold-text">
          {aurum ? formatPrice(aurum.price) : '₹999'}
        </p>
        <p className="mt-2 text-xs tracking-wide text-bronze">
          Eau de Parfum · 50 ml · Limited atelier run
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <motion.button
            type="button"
            onClick={onAdd}
            whileTap={{ scale: 0.97 }}
            className="btn-shimmer gold-border rounded-sm px-12 py-4 text-xs tracking-[0.32em] text-cream uppercase transition hover:text-gold-light"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? 'done' : 'idle'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="relative z-[2]"
              >
                {added ? 'Added to Cart' : 'Add to Cart'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <Link
            to="/shop"
            className="text-[11px] tracking-[0.28em] text-bronze uppercase transition hover:text-gold"
          >
            Full collection →
          </Link>
        </div>
      </div>
    </section>
  )
}
