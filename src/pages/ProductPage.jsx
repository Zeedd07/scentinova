/**
 * Product detail - gallery, notes, add to cart.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { fetchProductBySlug } from '../services/productApi'
import ProductCard from '../components/ProductCard'
import ProductGallery from '../components/ProductGallery'
import PriceTag from '../components/PriceTag'
import ThiingsIcon from '../components/ThiingsIcon'
import { easeOutExpo } from '../lib/motion'
import { mediaForSize, productSizes } from '../lib/productSizes'

function formatSaleEnd(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

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

function NoteThumb({ image, name }) {
  const [state, setState] = useState('loading')
  if (state === 'error') {
    return (
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center bg-cream font-display text-lg text-scent-red/70 sm:h-14 sm:w-14"
      >
        {name.charAt(0)}
      </span>
    )
  }
  return (
    <span className="relative block h-12 w-12 shrink-0 overflow-hidden bg-cream sm:h-14 sm:w-14">
      <img
        src={image.url}
        srcSet={image.srcSet || undefined}
        sizes="56px"
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
        className={`h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out motion-safe:group-hover:scale-[1.03] ${
          state === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </span>
  )
}

export default function ProductPage() {
  const { slug } = useParams()
  const { getBySlug, activeProducts, trackView } = useCatalog()
  const product = getBySlug(slug)
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [sizeMl, setSizeMl] = useState(null)
  const [noteMedia, setNoteMedia] = useState({ slug: null, data: null })
  const sizes = useMemo(() => (product ? productSizes(product) : []), [product])
  const selected = sizes.find((s) => s.ml === sizeMl) || sizes[0] || null

  useEffect(() => {
    setQty(1)
    setSizeMl(null)
  }, [slug])

  useEffect(() => {
    let cancelled = false
    fetchProductBySlug(slug)
      .then((p) => {
        if (!cancelled && p?.noteMedia) setNoteMedia({ slug, data: p.noteMedia })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-ivory px-6 pt-[calc(var(--page-top)+0.5rem)] text-center">
        <ThiingsIcon name="perfume-bottle" alt="" className="mb-6 h-32 w-32" />
        <h1 className="font-display text-3xl text-charcoal">Fragrance not found</h1>
        <Link to="/shop" className="mt-6 text-[11px] tracking-[0.28em] text-scent-red uppercase">
          Back to shop →
        </Link>
      </div>
    )
  }

  const media = noteMedia.slug === slug ? noteMedia.data : null
  const sale = selected?.sale || null
  const notesLine =
    product.descriptors?.join(' · ') ||
    [
      ...asNoteList(product.notes?.top),
      ...asNoteList(product.notes?.heart),
      ...asNoteList(product.notes?.base),
    ].join(' · ')

  return (
    <div className="bg-ivory pt-[calc(var(--page-top)+0.5rem)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: easeOutExpo }}
          className="min-w-0"
        >
          <ProductGallery key={`${product.id}-${selected?.ml ?? 'default'}`} product={mediaForSize(product, selected)} />
        </motion.div>

        <div>
          <p className="text-[11px] tracking-[0.35em] text-muted uppercase">
            {product.category} · {product.concentration}
          </p>
          {product.badge && (
            <span className="mt-3 inline-block bg-scent-red px-2.5 py-1 text-[10px] tracking-[0.25em] text-warm-white uppercase">
              {product.badge}
            </span>
          )}
          <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-charcoal uppercase sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-3 text-[12px] tracking-[0.18em] text-muted uppercase">
            {notesLine}
          </p>
          <p className="mt-2 font-display text-xl text-muted">
            {product.tagline}
          </p>
          <p className="mt-6">
            <PriceTag
              price={selected?.price}
              salePrice={sale?.price}
              percentOff={sale?.percentOff}
              className="font-display text-3xl text-bronze"
              originalClassName="font-display text-xl text-muted"
              align="start"
            />
          </p>
          {sale && (
            <p className="mt-2 text-[11px] tracking-[0.25em] text-scent-red uppercase">
              {sale.name}
              {sale.endsAt && ` · Ends ${formatSaleEnd(sale.endsAt)}`}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Bottle size">
            {sizes.map((size) => {
              const on = size.ml === selected?.ml
              return (
                <button
                  key={size.ml}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSizeMl(size.ml)}
                  className={`min-h-11 min-w-16 border px-4 text-[13px] tracking-[0.12em] uppercase transition ${
                    on
                      ? 'border-charcoal bg-charcoal text-ivory'
                      : 'border-stone bg-warm-white text-charcoal hover:border-charcoal'
                  }`}
                >
                  {size.label}
                </button>
              )
            })}
          </div>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-muted">
            {product.description}
          </p>
          <p className="mt-4 max-w-md font-display text-lg text-charcoal/80">
            {product.story}
          </p>

          <div className="relative mt-10 grid gap-6 border-t border-stone pt-8 before:absolute before:top-[-1px] before:left-0 before:h-px before:w-10 before:bg-scent-red sm:grid-cols-3">
            {[
              { label: 'Top', key: 'top' },
              { label: 'Heart', key: 'heart' },
              { label: 'Base', key: 'base' },
            ].map(({ label, key }) => {
              const images = new Map(
                (media?.[key] || []).filter((n) => n.image).map((n) => [n.name, n.image]),
              )
              const notes = asNoteList(product.notes?.[key])
              const withImages = notes.some((n) => images.has(n))
              return (
                <div key={label} className="@container min-w-0">
                  <p className="text-[11px] tracking-[0.3em] text-scent-red uppercase">
                    {label}
                  </p>
                  {withImages ? (
                    <ul className="mt-3 space-y-3 text-sm text-charcoal">
                      {notes.map((n) => {
                        const image = images.get(n)
                        return (
                          <li
                            key={n}
                            className="group flex min-w-0 flex-col items-start gap-1.5 @min-[11rem]:flex-row @min-[11rem]:items-center @min-[11rem]:gap-3"
                          >
                            {image ? (
                              <NoteThumb key={image.url} image={image} name={n} />
                            ) : (
                              <span aria-hidden="true" className="hidden w-12 shrink-0 sm:w-14 @min-[11rem]:block" />
                            )}
                            <span className="min-w-0 leading-snug break-words">{n}</span>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm text-charcoal">
                      {notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex items-center overflow-hidden rounded-none border border-stone">
              <button
                type="button"
                className="px-4 py-3 text-muted hover:text-charcoal"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="min-w-8 text-center text-scent-red tabular-nums">{qty}</span>
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
              onClick={() => selected && addItem(product, qty, selected)}
              className="btn-luxury flex-1 border border-charcoal px-8 py-3.5 text-charcoal sm:flex-none"
            >
              Add to Cart
            </button>
          </div>

          <Link
            to="/shop"
            className="mt-8 inline-block text-[11px] tracking-[0.28em] text-muted uppercase hover:text-scent-red"
          >
            ← All fragrances
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-stone px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 font-display text-3xl text-charcoal">
              You may also <span className="text-bronze">like</span>
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
