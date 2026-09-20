/**
 * Shop — four house signatures.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES } from '../data/products'
import { useCatalog } from '../context/CatalogContext'
import ProductCard, { shopLane } from '../components/ProductCard'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
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
      <span className="text-[11px] tracking-[0.28em] text-muted uppercase">Sort</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-w-[11.5rem] items-center justify-between gap-4 border border-stone bg-warm-white px-4 py-2.5 text-left text-[11px] tracking-[0.2em] text-charcoal uppercase transition hover:border-gold"
      >
        <span>{current.label.split(' · ')[0]}</span>
        <span
          className={`text-muted transition duration-300 ${open ? 'rotate-180' : ''}`}
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
            className="absolute top-[calc(100%+0.4rem)] right-0 z-30 min-w-[14rem] border border-stone bg-warm-white py-2 shadow-[0_16px_40px_rgba(27,25,23,0.12)]"
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
                        ? 'bg-cream text-gold'
                        : 'text-muted hover:bg-cream hover:text-charcoal'
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

    if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name))
    else items.sort((a, b) => Number(b.featured) - Number(a.featured))

    return items
  }, [category, sort, activeProducts])

  return (
    <div className="bg-ivory pt-16">
      <section className="border-b border-stone px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] tracking-[0.4em] text-muted uppercase"
          >
            SCENTINOVA
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 font-display text-4xl text-charcoal sm:text-5xl md:text-6xl"
          >
            The <span className="italic text-gold">Collection</span>
          </motion.h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
            Four signatures. Crystal, gold, and presence — each a private hour,
            composed in the house.
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
                    ? 'border-charcoal bg-charcoal text-warm-white'
                    : 'border-stone text-muted hover:border-charcoal hover:text-charcoal'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <SortMenu value={sort} onChange={setSort} />
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-x-3 gap-y-12 sm:mt-16 sm:gap-x-8 sm:gap-y-20 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} lane={shopLane(i)} />
          ))}
        </div>

        {list.length === 0 && (
          <p className="py-20 text-center text-muted">No fragrances in this category.</p>
        )}
      </section>
    </div>
  )
}
