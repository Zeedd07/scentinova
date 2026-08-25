/**
 * Product card — floating bottle with pedestal; shop entrance by lane.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatPrice } from '../data/products'
import { useCart } from '../context/CartContext'

/** left | center | right — based on 3-column shop row */
export function shopLane(index) {
  const col = index % 3
  if (col === 0) return 'left'
  if (col === 1) return 'center'
  return 'right'
}

const ENTRANCE = {
  left: {
    initial: { opacity: 0, x: -88 },
    animate: { opacity: 1, x: 0 },
  },
  center: {
    initial: { opacity: 0, scale: 0.88, y: 22 },
    animate: { opacity: 1, scale: 1, y: 0 },
  },
  right: {
    initial: { opacity: 0, x: 88 },
    animate: { opacity: 1, x: 0 },
  },
}

export default function ProductCard({ product, index = 0, lane }) {
  const { addItem } = useCart()
  const side = lane || shopLane(index)
  const motionProps = ENTRANCE[side] || ENTRANCE.center

  return (
    <motion.article
      initial={motionProps.initial}
      whileInView={motionProps.animate}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 1.45,
        delay: (index % 3) * 0.18,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex flex-col items-center text-center"
    >
      <div className="relative mb-2 w-full max-w-[240px]">
        <Link
          to={`/product/${product.slug}`}
          className="relative mx-auto flex aspect-[3/4] w-full items-center justify-center overflow-visible transition duration-700 group-hover:-translate-y-2"
        >
          <img
            src={product.image}
            alt={product.name}
            className="absolute left-1/2 top-1/2 z-[1] h-[92%] w-auto max-w-[90%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)] transition duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {product.badge && (
            <span className="absolute left-0 top-0 z-[3] border border-gold/40 bg-ink/80 px-2.5 py-1 text-[10px] tracking-[0.25em] text-gold-light uppercase">
              {product.badge}
            </span>
          )}
        </Link>
        <div className="marble-pedestal transition duration-700 group-hover:translate-y-1 group-hover:shadow-[0_16px_40px_rgba(212,175,55,0.15)]" />
      </div>

      <p className="mt-8 text-[11px] tracking-[0.32em] text-bronze uppercase">
        {product.category} · {product.size}
      </p>
      <Link
        to={`/product/${product.slug}`}
        className="mt-2 font-display text-2xl tracking-wide text-cream transition hover:text-gold-light"
      >
        {product.name}
      </Link>
      <p className="mt-2 line-clamp-1 text-[11px] tracking-[0.18em] text-bronze uppercase">
        {product.tagline}
      </p>
      <div className="mt-5 flex items-center justify-center gap-4">
        <span className="font-display text-lg gold-text">
          {formatPrice(product.price)}
        </span>
        <button
          type="button"
          onClick={() => addItem(product)}
          className="btn-luxury border border-gold/30 px-3 py-2 text-cream hover:border-gold"
        >
          Add
        </button>
      </div>
    </motion.article>
  )
}
