/**
 * Home teaser — featured fragrances linking to shop.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getFeaturedProducts } from '../data/products'
import ProductCard from './ProductCard'

export default function CollectionTeaser() {
  const featured = getFeaturedProducts().slice(0, 4)

  return (
    <section id="collection" className="bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <p className="mb-3 text-[11px] tracking-[0.4em] text-bronze uppercase">
              The Collection
            </p>
            <h2 className="font-display text-4xl text-cream sm:text-5xl">
              Fragrances of the{' '}
              <span className="gold-text italic">maison</span>
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-[11px] tracking-[0.3em] text-gold uppercase transition hover:text-gold-light"
          >
            View all →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
