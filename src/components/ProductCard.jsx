/**
 * Product card — editorial bottle presentation for shop grid.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatPrice } from '../data/products'
import { useCart } from '../context/CartContext'

export function shopLane(index) {
  const col = index % 4
  if (col === 0) return 'left'
  if (col === 3) return 'right'
  return 'center'
}

const ENTRANCE = {
  left: {
    initial: { opacity: 0, x: -48 },
    animate: { opacity: 1, x: 0 },
  },
  center: {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
  },
  right: {
    initial: { opacity: 0, x: 48 },
    animate: { opacity: 1, x: 0 },
  },
}

export default function ProductCard({ product, index = 0, lane }) {
  const { addItem } = useCart()
  const side = lane || shopLane(index)
  const motionProps = ENTRANCE[side] || ENTRANCE.center
  const notes =
    product.descriptors?.join(' · ') ||
    [
      ...(product.notes?.top || []),
      ...(product.notes?.heart || []),
      ...(product.notes?.base || []),
    ]
      .slice(0, 3)
      .join(' · ')

  return (
    <motion.article
      initial={motionProps.initial}
      whileInView={motionProps.animate}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 1.1,
        delay: (index % 4) * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex flex-col items-center text-center"
    >
      <div className="relative mb-2 w-full max-w-[140px] sm:max-w-[220px]">
        <Link
          to={`/product/${product.slug}`}
          className="relative mx-auto flex aspect-[3/4] w-full items-center justify-center overflow-visible transition duration-700 group-hover:-translate-y-2"
        >
          <img
            src={product.image || `/products/${product.slug}.png`}
            alt={product.name}
            className="absolute left-1/2 top-1/2 z-[1] h-[92%] w-auto max-w-[90%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_20px_36px_rgba(27,25,23,0.16)] transition duration-700 group-hover:scale-[1.03]"
            loading="eager"
            onError={(e) => {
              const fallback = `/products/${product.slug}.png`
              if (!e.currentTarget.src.includes(fallback)) {
                e.currentTarget.src = fallback
              }
            }}
          />
          {product.badge && (
            <span className="absolute left-0 top-0 z-[3] border border-gold/50 bg-ivory/90 px-1.5 py-0.5 text-[8px] tracking-[0.18em] text-charcoal uppercase sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.25em]">
              {product.badge}
            </span>
          )}
        </Link>
      </div>

      <p className="mt-5 text-[9px] tracking-[0.24em] text-muted uppercase sm:mt-8 sm:text-[10px] sm:tracking-[0.32em]">
        {String(index + 1).padStart(2, '0')} / {product.concentration}
      </p>
      <Link
        to={`/product/${product.slug}`}
        className="mt-1.5 font-display text-base leading-tight tracking-[0.04em] text-charcoal uppercase transition hover:text-gold sm:mt-2 sm:text-2xl"
      >
        {product.name}
      </Link>
      <p className="mt-2 line-clamp-2 max-w-[10rem] text-[9px] tracking-[0.1em] text-muted uppercase sm:max-w-[16rem] sm:text-[11px] sm:tracking-[0.14em]">
        {notes}
      </p>
      <div className="mt-4 flex flex-col items-center gap-2 sm:mt-5 sm:gap-3">
        <span className="font-display text-base text-gold sm:text-lg">
          {formatPrice(product.price)}
        </span>
        <button
          type="button"
          onClick={() => addItem(product)}
          className="btn-luxury border border-charcoal/25 px-3 py-1.5 text-[10px] text-charcoal hover:border-gold sm:px-4 sm:py-2 sm:text-[11px]"
        >
          Add
        </button>
      </div>
    </motion.article>
  )
}
