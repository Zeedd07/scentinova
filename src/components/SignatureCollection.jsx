/**
 * Signature Collection — gallery exhibition, not a product grid.
 * Four fragrances on floating marble pedestals with spotlight.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCatalog } from '../context/CatalogContext'

const SHOWCASE = [
  {
    slug: 'aurum',
    family: 'Oriental Amber',
    descriptors: 'Warm · Rich · Timeless',
  },
  {
    slug: 'nocturne',
    family: 'Floral Woody',
    descriptors: 'Oud · Smoke · Mystery',
  },
  {
    slug: 'sable',
    family: 'Woody Spicy',
    descriptors: 'Amber · Spice · Depth',
  },
]

export default function SignatureCollection() {
  const { getBySlug, featuredProducts } = useCatalog()

  let items = SHOWCASE.map((s) => ({
    ...s,
    product: getBySlug(s.slug),
  })).filter((s) => s.product && s.product.active !== false)

  if (!items.length) {
    items = featuredProducts.slice(0, 3).map((p) => ({
      slug: p.slug,
      family: p.category,
      descriptors: p.tagline,
      product: p,
    }))
  }

  return (
    <section
      id="collection"
      className="bg-luxury relative overflow-hidden px-6 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="section-fade-top" />
      <div className="section-fade-bottom" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9 }}
          >
            <p className="mb-4 text-[11px] tracking-[0.42em] text-bronze uppercase">
              The Collection
            </p>
            <h2 className="font-display text-4xl leading-tight text-cream sm:text-5xl">
              Signature{' '}
              <span className="gold-text italic">Fragrances</span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-bronze">
              Three compositions. Crystal, marble, and gold — each a private
              hour, poured in the atelier.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-2 text-[11px] tracking-[0.32em] text-gold uppercase transition hover:text-gold-light"
            >
              Explore all <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>

        <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-14 sm:gap-x-8 lg:gap-x-10">
          {items.map((item, i) => (
            <motion.article
              key={item.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.85, delay: i * 0.1 }}
              className="group flex w-full max-w-[280px] flex-col items-center text-center sm:w-[30%] sm:max-w-[300px]"
            >
              <div className="relative mb-2 w-full max-w-[280px]">
                <Link
                  to={`/product/${item.slug}`}
                  className="relative mx-auto flex aspect-[3/4] w-full items-center justify-center overflow-visible transition duration-700 group-hover:-translate-y-2"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-[95%] w-auto max-w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)] transition duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </Link>
                <div className="marble-pedestal transition duration-700 group-hover:translate-y-1 group-hover:shadow-[0_16px_40px_rgba(212,175,55,0.15)]" />
              </div>

              <p className="mt-8 text-[11px] tracking-[0.32em] text-bronze uppercase">
                {item.family}
              </p>
              <Link
                to={`/product/${item.slug}`}
                className="mt-2 font-display text-2xl tracking-wide text-cream transition hover:text-gold-light"
              >
                {item.product.name}
              </Link>
              <p className="mt-2 text-[11px] tracking-[0.18em] text-bronze uppercase">
                {item.descriptors}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
