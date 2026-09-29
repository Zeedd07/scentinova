/**
 * Signatures - sharp black→cream cut from hero, then copy + product row.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCatalog } from '../context/CatalogContext'
import { easeOutExpo, fadeUp, viewportOnce } from '../lib/motion'
import { signatureStageCss } from '../lib/storefrontBackdrops'

/** Preferred order and family labels for the house signatures. */
const SHOWCASE = [
  { slug: 'lunar-leather', family: 'Oriental Amber' },
  { slug: 'oud-on-the-petals', family: 'Floral Woody' },
  { slug: 'masai-mara', family: 'Woody Leather' },
  { slug: 'seaweed', family: 'Marine Musk' },
]

const MAX_ITEMS = 4
const LG_COLS = ['', 'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4']

function showcaseRank(slug) {
  const i = SHOWCASE.findIndex((s) => s.slug === slug)
  return i === -1 ? SHOWCASE.length : i
}

export default function SignatureCollection() {
  const { activeProducts, featuredProducts } = useCatalog()

  // "Featured on homepage" decides what shows; with nothing featured, fall back so the section isn't empty.
  const source = featuredProducts.length ? featuredProducts : activeProducts
  const items = [...source]
    .sort((a, b) => showcaseRank(a.slug) - showcaseRank(b.slug) || a.name.localeCompare(b.name))
    .slice(0, MAX_ITEMS)
    .map((p) => ({
      slug: p.slug,
      family: SHOWCASE.find((s) => s.slug === p.slug)?.family || p.category,
      product: p,
    }))

  return (
    <>
      {/* Cream-gold stage - warm ivory with golden light */}
      <section
        id="collection"
        className="signatures relative scroll-mt-16 overflow-x-clip sm:scroll-mt-20 lg:scroll-mt-24"
        style={{ background: signatureStageCss.base }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: signatureStageCss.glows }}
          aria-hidden
        />

        <div className="relative z-10 px-6 pb-10 pt-10 sm:px-10 sm:pb-12 sm:pt-12 lg:px-16 lg:pt-14">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <motion.div
              initial={fadeUp.initial}
              whileInView={fadeUp.animate}
              viewport={viewportOnce}
              transition={{ duration: 0.85, ease: easeOutExpo }}
              className="max-w-xl"
            >
              <p className="mb-4 text-[11px] font-medium tracking-[0.42em] text-bronze uppercase">
                The Signatures
              </p>
              <h2
                id="featured-perfumes-title"
                className="font-display text-4xl leading-[1.1] text-charcoal uppercase sm:text-5xl lg:text-[3.35rem]"
              >
                Precious, potent, personal
              </h2>
            </motion.div>

            <motion.div
              initial={fadeUp.initial}
              whileInView={fadeUp.animate}
              viewport={viewportOnce}
              transition={{ duration: 0.85, delay: 0.08, ease: easeOutExpo }}
              className="max-w-sm border-l-2 border-gold/70 pl-5 lg:border-l-0 lg:pl-0 lg:text-right"
            >
              <p className="font-display text-lg leading-relaxed text-espresso sm:text-xl">
                Distinct signatures, composed for presence.
              </p>
              <Link
                to="/shop"
                className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.32em] text-bronze uppercase transition hover:text-scent-red"
              >
                Explore the collection <span aria-hidden>↗</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Separator into products */}
        <div className="relative z-10 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-gold/65 to-transparent" />

        {/* ── 3. Product grid - 2×2 on mobile, 4 across on desktop ── */}
        <div className="relative z-10 mx-auto max-w-[1400px] pt-4 pb-8 sm:pb-12 lg:pb-16">
          <div
            className={`grid ${items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${LG_COLS[items.length] || ''}`}
            role="list"
            aria-label="Signature fragrances"
          >
            {items.map((item, i) => {
              const notes =
                item.product.descriptors?.join(' · ') ||
                [
                  ...(item.product.notes?.top || []),
                  ...(item.product.notes?.heart || []),
                  ...(item.product.notes?.base || []),
                ].join(' · ')

              const isOddCol = i % 2 === 0 && i + 1 < items.length
              const isTopRow = i < 2 && items.length > 2
              const spansRow = items.length > 1 && items.length % 2 === 1 && i === items.length - 1

              return (
                <motion.article
                  key={item.slug}
                  role="listitem"
                  initial={fadeUp.initial}
                  whileInView={fadeUp.animate}
                  viewport={viewportOnce}
                  transition={{
                    duration: 0.85,
                    delay: Math.min(i, 3) * 0.06,
                    ease: easeOutExpo,
                  }}
                  className={`group relative flex flex-col items-center px-3 py-10 text-center sm:px-5 sm:py-14 lg:border-r lg:border-gold/35 lg:py-20 lg:last:border-r-0 ${
                    isOddCol ? 'border-r border-gold/35 lg:border-r' : ''
                  } ${
                    isTopRow
                      ? 'border-b border-gold/35 lg:border-b-0'
                      : ''
                  } ${spansRow ? 'col-span-2 lg:col-span-1' : ''}`}
                >
                  <p className="mb-5 text-[9px] font-medium tracking-[0.28em] text-bronze uppercase sm:mb-8 sm:text-[10px] sm:tracking-[0.4em]">
                    {item.family}
                  </p>

                  <Link
                    to={`/product/${item.slug}`}
                    className="relative mb-6 flex h-[180px] w-full max-w-[130px] items-center justify-center sm:mb-10 sm:h-[280px] sm:max-w-[200px] lg:h-[380px] lg:max-w-[230px]"
                  >
                    <img
                      src={item.product.image || `/products/${item.slug}.png`}
                      alt={item.product.name}
                      className="max-h-full w-auto max-w-full object-contain drop-shadow-[0_24px_40px_rgba(90,70,30,0.18)] transition duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.02]"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      onError={(e) => {
                        const fallback = `/products/${item.slug}.png`
                        if (e.currentTarget.getAttribute('src') === fallback) return
                        e.currentTarget.src = fallback
                      }}
                    />
                  </Link>

                  <p className="text-[9px] font-medium tracking-[0.28em] text-bronze uppercase sm:text-[10px] sm:tracking-[0.3em]">
                    {item.product.concentration}
                  </p>
                  <Link
                    to={`/product/${item.slug}`}
                    className="mt-1.5 font-display text-base leading-tight tracking-[0.04em] text-charcoal uppercase transition group-hover:text-scent-red sm:mt-2 sm:text-2xl sm:tracking-[0.06em] lg:text-[1.65rem]"
                  >
                    {item.product.name}
                  </Link>
                  <p className="mt-2 max-w-[10rem] text-[9px] leading-relaxed tracking-[0.08em] text-muted uppercase sm:mt-3 sm:max-w-[16rem] sm:text-[11px] sm:tracking-[0.12em]">
                    {notes}
                  </p>
                  <Link
                    to={`/product/${item.slug}`}
                    className="mt-5 inline-flex items-center gap-2 border-b border-gold/55 pb-0.5 text-[9px] font-medium tracking-[0.24em] text-bronze uppercase transition group-hover:border-scent-red group-hover:text-scent-red sm:mt-8 sm:text-[11px] sm:tracking-[0.28em]"
                  >
                    Discover <span aria-hidden>→</span>
                  </Link>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
