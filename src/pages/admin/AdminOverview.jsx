/**
 * Admin overview — live MongoDB KPIs.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { adminDashboard } from '../../services/analyticsApi'
import { ApiClientError } from '../../services/apiClient'

export default function AdminOverview() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const d = await adminDashboard()
        if (!cancelled) setData(d)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Could not load dashboard.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="admin-muted">Loading overview…</p>
  }

  if (error) {
    return <p className="text-[#6e1118]">{error}</p>
  }

  const kpis = [
    { label: 'Products', value: String(data.products ?? 0) },
    { label: 'Catalog views', value: String(data.views ?? 0) },
    { label: 'Add to cart', value: String(data.addToCarts ?? 0) },
    { label: 'Units sold', value: String(data.unitsSold ?? 0) },
    {
      label: 'Revenue',
      value: formatPrice(data.revenue === 0 ? null : data.revenue),
    },
    { label: 'Orders', value: String(data.orders ?? 0) },
    {
      label: 'Low stock',
      value: String(data.lowStock?.length ?? 0),
      warn: (data.lowStock?.length ?? 0) > 0,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="admin-title">Overview</h2>
          <p className="mt-1 admin-muted text-[15px]">
            Live data stored in Scentinova.
          </p>
        </div>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
          Add perfume
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="admin-surface px-4 py-3">
            <p className="text-[13px] text-[#766f66]">{k.label}</p>
            <p
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                k.warn ? 'text-[#6e1118]' : 'text-[#1b1917]'
              }`}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-surface p-4 sm:p-5">
          <h3 className="text-base font-semibold text-[#1b1917]">
            Recent orders
          </h3>
          {(data.recentOrders?.length ?? 0) === 0 ? (
            <p className="mt-3 text-[15px] admin-muted">No orders yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 text-[15px]"
                >
                  <span>
                    {o.orderNumber} · {o.customer?.name}
                  </span>
                  <span className="admin-muted shrink-0">
                    {formatPrice(o.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-surface p-4 sm:p-5">
          <h3 className="text-base font-semibold text-[#1b1917]">
            Needs attention
          </h3>
          {(data.lowStock?.length ?? 0) === 0 ? (
            <p className="mt-3 text-[15px] admin-muted">
              Stock levels look healthy.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-[15px]"
                >
                  <Link
                    to={`/admin/products/${p.id}`}
                    className="text-[#1b1917] hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="text-[#6e1118]">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
