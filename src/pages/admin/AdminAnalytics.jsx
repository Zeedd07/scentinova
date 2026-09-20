/**
 * Product analytics — live backend metrics (no fake seed data).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import {
  adminAnalyticsOverview,
  adminAnalyticsProducts,
} from '../../services/analyticsApi'
import { ApiClientError } from '../../services/apiClient'

function Bar({ value, max, label, display }) {
  const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[14px]">
        <span className="text-[#1b1917]">{label}</span>
        <span className="admin-muted">{display ?? value}</span>
      </div>
      <div className="h-2 rounded-sm bg-[#ebe4d6]">
        <div
          className="h-full rounded-sm bg-[#b4975a]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null)
  const [rows, setRows] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [ov, prod] = await Promise.all([
          adminAnalyticsOverview(),
          adminAnalyticsProducts(),
        ])
        if (cancelled) return
        setOverview(ov)
        setRows(prod.products || [])
        setByCategory(prod.byCategory || [])
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Could not load analytics.',
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

  if (loading) return <p className="admin-muted">Loading analytics…</p>
  if (error) return <p className="text-[#6e1118]">{error}</p>

  const maxRev = Math.max(...rows.map((r) => r.revenue), 1)
  const maxViews = Math.max(...rows.map((r) => r.views), 1)
  const maxCat = Math.max(...byCategory.map((c) => c.units), 1)
  const topSellers = [...rows].sort((a, b) => b.revenue - a.revenue)
  const slowMovers = [...rows].sort((a, b) => a.purchases - b.purchases)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="admin-title">Analytics</h2>
        <p className="mt-1 max-w-xl text-[15px] admin-muted">
          Views and carts from the storefront; purchases and revenue from real
          orders.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Views', (overview?.views ?? 0).toLocaleString()],
          ['Add to cart', (overview?.addToCarts ?? 0).toLocaleString()],
          ['Orders', (overview?.orders ?? 0).toLocaleString()],
          [
            'Revenue',
            formatPrice(
              overview?.revenue === 0 ? null : overview?.revenue ?? null,
            ),
          ],
        ].map(([l, v]) => (
          <div key={l} className="admin-surface px-4 py-3">
            <p className="text-[13px] text-[#766f66]">{l}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[#1b1917]">
              {v}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-surface p-4 sm:p-5">
          <h3 className="text-base font-semibold">Revenue by product</h3>
          <div className="mt-4 space-y-3">
            {topSellers.every((r) => r.revenue === 0) ? (
              <p className="admin-muted text-[15px]">No priced sales yet.</p>
            ) : (
              topSellers.map((r) => (
                <Bar
                  key={r.id}
                  label={r.name}
                  value={r.revenue}
                  display={formatPrice(r.revenue || null)}
                  max={maxRev}
                />
              ))
            )}
          </div>
        </section>

        <section className="admin-surface p-4 sm:p-5">
          <h3 className="text-base font-semibold">Views by product</h3>
          <div className="mt-4 space-y-3">
            {[...rows]
              .sort((a, b) => b.views - a.views)
              .map((r) => (
                <Bar
                  key={r.id}
                  label={r.name}
                  value={r.views}
                  max={maxViews}
                />
              ))}
          </div>
        </section>
      </div>

      <section className="admin-surface p-4 sm:p-5">
        <h3 className="text-base font-semibold">Units by category</h3>
        <div className="mt-4 space-y-3">
          {byCategory.length === 0 ? (
            <p className="admin-muted text-[15px]">No sales yet.</p>
          ) : (
            byCategory.map((c) => (
              <Bar
                key={c.category}
                label={c.category}
                value={c.units}
                max={maxCat}
              />
            ))
          )}
        </div>
      </section>

      <div className="admin-surface overflow-x-auto">
        <table className="admin-table w-full min-w-[640px] text-left">
          <thead className="border-b border-[#e0d6c4]">
            <tr>
              <th className="px-3 py-2.5">Product</th>
              <th className="px-3 py-2.5">Views</th>
              <th className="px-3 py-2.5">ATC</th>
              <th className="px-3 py-2.5">Sold</th>
              <th className="px-3 py-2.5">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {slowMovers.map((r) => (
              <tr key={r.id} className="border-b border-[#ebe4d6]">
                <td className="px-3 py-2.5">
                  <Link
                    to={`/admin/products/${r.id}`}
                    className="hover:underline"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5">{r.views}</td>
                <td className="px-3 py-2.5">{r.addToCarts}</td>
                <td className="px-3 py-2.5">{r.purchases}</td>
                <td className="px-3 py-2.5">
                  {formatPrice(r.revenue || null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
