/**
 * Shop — filterable perfume catalog.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES } from '../data/products'
import { useCatalog } from '../context/CatalogContext'
import ProductCard, { shopLane } from '../components/ProductCard'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price · Low to high' },
  { value: 'price-desc', label: 'Price · High to low' },
  { value: 'name', label: 'Name · A–Z' },
]

function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0]

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex items-center gap-3">
      <span className="text-[11px] tracking-[0.28em] text-bronze uppercase">
        Sort
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-w-[11.5rem] items-center justify-between gap-4 border border-gold/30 bg-ink px-4 py-2.5 text-left text-[11px] tracking-[0.2em] text-cream uppercase transition hover:border-gold/55"
      >
        <span>{current.label.split(' · ')[0]}</span>
        <span
          className={`text-bronze transition duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%+0.4rem)] right-0 z-30 min-w-[14rem] border border-gold/25 bg-ink py-2 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
          >
            {SORT_OPTIONS.map((opt) => {
              const active = opt.value === value
              return (
                <li key={opt.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[11px] tracking-[0.18em] uppercase transition ${
                      active
                        ? 'bg-gold/15 text-gold-light'
                        : 'text-bronze hover:bg-gold/8 hover:text-cream'
                    }`}
                  >
                    {opt.label}
                    {active && <span aria-hidden>✓</span>}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ShopPage() {
  const { activeProducts } = useCatalog()
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')

  const list = useMemo(() => {
    let items =
      category === 'All'
        ? [...activeProducts]
        : activeProducts.filter((p) => p.category === category)

    if (sort === 'price-asc') items.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price)
    else if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name))
    else items.sort((a, b) => Number(b.featured) - Number(a.featured))

    return items
  }, [category, sort, activeProducts])

  return (
    <div className="pt-16">
      <section className="border-b border-gold/10 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] tracking-[0.4em] text-bronze uppercase"
          >
            SCENTINOVA
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 font-display text-4xl text-cream sm:text-5xl md:text-6xl"
          >
            The <span className="gold-text italic">Shop</span>
          </motion.h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-bronze">
            Ten compositions in crystal and gold. Explore the full maison
            collection.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`border px-3 py-1.5 text-[11px] tracking-[0.22em] uppercase transition ${
                  category === c
                    ? 'border-gold bg-gold/15 text-gold-light'
                    : 'border-gold/20 text-bronze hover:border-gold/50 hover:text-cream'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <SortMenu value={sort} onChange={setSort} />
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-x-8 gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} lane={shopLane(i)} />
          ))}
        </div>

        {list.length === 0 && (
          <p className="py-20 text-center text-bronze">No fragrances in this category.</p>
        )}
      </section>
    </div>
  )
}
