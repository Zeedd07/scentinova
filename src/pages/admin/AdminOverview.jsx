/**
 * Admin overview — KPI cards + quick product health.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { formatPrice } from '../../data/products'
import AdminModal from '../../components/admin/AdminModal'

export default function AdminOverview() {
  const { products, orders, stats, resetCatalog } = useCatalog()
  const { totals, topSellers, lowStock } = stats
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const kpis = [
    { label: 'Products', value: String(products.length) },
    { label: 'Catalog views', value: totals.views.toLocaleString() },
    { label: 'Units sold', value: totals.purchases.toLocaleString() },
    { label: 'Revenue', value: formatPrice(totals.revenue) },
    { label: 'Orders', value: String(orders.length) },
    {
      label: 'Low stock',
      value: String(lowStock.length),
      warn: lowStock.length > 0,
    },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.32em] text-bronze uppercase">
            Dashboard
          </p>
          <h2 className="mt-1 font-display text-3xl text-cream">
            Product <span className="gold-text italic">command</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/products/new"
            className="btn-luxury border border-gold/40 px-5 py-2.5 text-cream hover:border-gold"
          >
            Add perfume
          </Link>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="border border-gold/20 px-4 py-2.5 text-[11px] tracking-[0.22em] text-bronze uppercase transition hover:text-cream"
          >
            Reset mock data
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="border border-gold/15 bg-ink-soft px-5 py-4"
          >
            <p className="text-[10px] tracking-[0.28em] text-bronze uppercase">
              {k.label}
            </p>
            <p
              className={`mt-2 font-display text-3xl ${
                k.warn ? 'text-champagne' : 'text-cream'
              }`}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-gold/15 p-5">
          <h3 className="font-display text-xl text-cream">Top sellers</h3>
          <ul className="mt-4 space-y-3">
            {topSellers.slice(0, 5).map((r) => (
              <li
                key={r.product.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-cream">{r.product.name}</span>
                <span className="text-bronze">
                  {r.purchases} sold · {formatPrice(r.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-gold/15 p-5">
          <h3 className="font-display text-xl text-cream">Needs attention</h3>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-bronze">Stock levels look healthy.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <Link
                    to={`/admin/products/${p.id}`}
                    className="text-cream hover:text-gold-light"
                  >
                    {p.name}
                  </Link>
                  <span className="text-champagne">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/analytics"
            className="mt-6 inline-block text-[11px] tracking-[0.28em] text-gold uppercase"
          >
            Full analytics →
          </Link>
        </section>
      </div>

      <AdminModal
        open={confirmReset}
        tone="danger"
        title="Reset mock data?"
        message="This restores the original seed products, analytics, and demo orders. Custom products you added will be lost."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={() => {
          resetCatalog()
          setConfirmReset(false)
          setResetDone(true)
        }}
        onCancel={() => setConfirmReset(false)}
      />

      <AdminModal
        open={resetDone}
        tone="success"
        title="Data reset"
        message="Catalog, analytics, and orders were restored to the seed mock data."
        confirmLabel="OK"
        hideCancel
        onConfirm={() => setResetDone(false)}
        onCancel={() => setResetDone(false)}
      />
    </div>
  )
}
