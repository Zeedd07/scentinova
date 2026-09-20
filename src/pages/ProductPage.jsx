/**
 * Product detail — gallery, notes, add to cart.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatPrice } from '../data/products'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import ProductCard from '../components/ProductCard'
import { easeOutExpo } from '../lib/motion'

function asNoteList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[·,]/)
      .map((n) => n.trim())
      .filter(Boolean)
  }
  return []
}

export default function ProductPage() {
  const { slug } = useParams()
  const { getBySlug, activeProducts, trackView } = useCatalog()
  const product = getBySlug(slug)
  const { addItem } = useCart()
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    setActiveImg(0)
    setQty(1)
  }, [slug])

  useEffect(() => {
    if (product?.id) trackView(product.id)
  }, [product?.id, trackView])

  const related = useMemo(() => {
    if (!product) return []
    return activeProducts.filter((p) => p.id !== product.id).slice(0, 3)
  }, [product, activeProducts])

  if (!product || product.active === false) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-ivory px-6 pt-16 text-center">
        <h1 className="font-display text-3xl text-charcoal">Fragrance not found</h1>
        <Link to="/shop" className="mt-6 text-[11px] tracking-[0.28em] text-gold uppercase">
          Back to shop →
        </Link>
      </div>
    )
  }

  const gallery = (
    product.gallery?.length ? product.gallery : [product.image]
  ).filter(Boolean)
  const activeSrc =
    gallery[Math.min(activeImg, Math.max(gallery.length - 1, 0))] || product.image
  const notesLine =
    product.descriptors?.join(' · ') ||
    [
      ...asNoteList(product.notes?.top),
      ...asNoteList(product.notes?.heart),
      ...asNoteList(product.notes?.base),
    ].join(' · ')

  return (
    <div className="bg-ivory pt-16">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-20">
        <div>
          <motion.div
            key={activeSrc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: easeOutExpo }}
            className="flex aspect-[3/4] items-center justify-center overflow-hidden border border-stone/80 bg-[#f3eee4]"
          >
            <img
              src={activeSrc}
              alt={`${product.name} — image ${activeImg + 1} of ${gallery.length}`}
              className="h-full w-full object-contain p-6 sm:p-10"
            />
          </motion.div>
          {gallery.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`flex h-20 w-16 items-center justify-center overflow-hidden border bg-[#f3eee4] transition sm:h-24 sm:w-20 ${
                    i === activeImg
                      ? 'border-charcoal'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-contain p-1.5"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] tracking-[0.35em] text-muted uppercase">
            {product.category} · {product.concentration}
          </p>
          {product.badge && (
            <span className="mt-3 inline-block border border-gold/40 px-2.5 py-1 text-[10px] tracking-[0.25em] text-gold uppercase">
              {product.badge}
            </span>
          )}
          <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-charcoal uppercase sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-3 text-[12px] tracking-[0.18em] text-muted uppercase">
            {notesLine}
          </p>
          <p className="mt-2 font-display text-xl italic text-muted">
            {product.tagline}
          </p>
          <p className="mt-6 font-display text-3xl text-gold">
            {formatPrice(product.price)}
          </p>
          <p className="mt-1 text-xs text-muted">{product.size}</p>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-muted">
            {product.description}
          </p>
          <p className="mt-4 max-w-md font-display text-lg italic text-charcoal/80">
            {product.story}
          </p>

          <div className="mt-10 grid gap-6 border-t border-stone pt-8 sm:grid-cols-3">
            {[
              { label: 'Top', notes: asNoteList(product.notes?.top) },
              { label: 'Heart', notes: asNoteList(product.notes?.heart) },
              { label: 'Base', notes: asNoteList(product.notes?.base) },
            ].map((layer) => (
              <div key={layer.label}>
                <p className="text-[11px] tracking-[0.3em] text-gold uppercase">
                  {layer.label}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-charcoal">
                  {layer.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-stone">
              <button
                type="button"
                className="px-4 py-3 text-muted hover:text-charcoal"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="min-w-8 text-center tabular-nums">{qty}</span>
              <button
                type="button"
                className="px-4 py-3 text-muted hover:text-charcoal"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => addItem(product, qty)}
              className="btn-luxury flex-1 border border-charcoal px-8 py-3.5 text-charcoal sm:flex-none"
            >
              Add to Cart
            </button>
          </div>

          <Link
            to="/shop"
            className="mt-8 inline-block text-[11px] tracking-[0.28em] text-muted uppercase hover:text-gold"
          >
            ← All fragrances
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-stone px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 font-display text-3xl text-charcoal">
              You may also <span className="italic text-gold">like</span>
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
