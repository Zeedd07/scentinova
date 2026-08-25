/**
 * Product analytics — views, cart, sales, category mix.
 */
import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { formatPrice } from '../../data/products'

function Bar({ value, max, label, display }) {
  const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-cream">{label}</span>
        <span className="text-bronze">{display ?? value}</span>
      </div>
      <div className="h-1.5 bg-ink-soft">
        <div className="h-full bg-gold/70" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const { stats } = useCatalog()
  const { rows, totals, byCategory, topSellers, slowMovers } = stats
  const maxRev = Math.max(...rows.map((r) => r.revenue), 1)
  const maxViews = Math.max(...rows.map((r) => r.views), 1)
  const catEntries = Object.entries(byCategory).sort(
    (a, b) => b[1].revenue - a[1].revenue,
  )
  const maxCatRev = Math.max(...catEntries.map(([, v]) => v.revenue), 1)

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] tracking-[0.32em] text-bronze uppercase">
          Intelligence
        </p>
        <h2 className="mt-1 font-display text-3xl text-cream">
          Product <span className="gold-text italic">analytics</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-bronze">
          Mock + live signals: product page views, add-to-cart, and checkout
          revenue stored in this browser.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Views', totals.views.toLocaleString()],
          ['Add to cart', totals.addToCarts.toLocaleString()],
          ['Purchases', totals.purchases.toLocaleString()],
          ['Revenue', formatPrice(totals.revenue)],
        ].map(([l, v]) => (
          <div key={l} className="border border-gold/15 bg-ink-soft px-4 py-4">
            <p className="text-[10px] tracking-[0.28em] text-bronze uppercase">
              {l}
            </p>
            <p className="mt-2 font-display text-2xl text-cream">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-gold/15 p-5">
          <h3 className="font-display text-xl text-cream">Revenue by product</h3>
          <div className="mt-5 space-y-4">
            {topSellers.map((r) => (
              <Bar
                key={r.product.id}
                label={r.product.name}
                value={r.revenue}
                display={formatPrice(r.revenue)}
                max={maxRev}
              />
            ))}
          </div>
        </section>

        <section className="border border-gold/15 p-5">
          <h3 className="font-display text-xl text-cream">Views by product</h3>
          <div className="mt-5 space-y-4">
            {[...rows]
              .sort((a, b) => b.views - a.views)
              .map((r) => (
                <Bar
                  key={r.product.id}
                  label={r.product.name}
                  value={r.views}
                  max={maxViews}
                />
              ))}
          </div>
        </section>
      </div>

      <section className="border border-gold/15 p-5">
        <h3 className="font-display text-xl text-cream">By category</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {catEntries.map(([cat, v]) => (
            <div key={cat}>
              <Bar
                label={cat}
                value={v.revenue}
                display={formatPrice(v.revenue)}
                max={maxCatRev}
              />
              <p className="mt-1 text-[11px] text-bronze">
                {v.purchases} sold · {v.views} views
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-x-auto border border-gold/15">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-gold/15 bg-ink-soft text-[10px] tracking-[0.2em] text-bronze uppercase">
            <tr>
              <th className="px-4 py-3 font-normal">Product</th>
              <th className="px-4 py-3 font-normal">Views</th>
              <th className="px-4 py-3 font-normal">Carts</th>
              <th className="px-4 py-3 font-normal">Sold</th>
              <th className="px-4 py-3 font-normal">Cart %</th>
              <th className="px-4 py-3 font-normal">Buy %</th>
              <th className="px-4 py-3 font-normal">Revenue</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {rows
              .sort((a, b) => b.revenue - a.revenue)
              .map((r) => (
                <tr key={r.product.id} className="border-b border-gold/10">
                  <td className="px-4 py-3 text-cream">{r.product.name}</td>
                  <td className="px-4 py-3 text-bronze">{r.views}</td>
                  <td className="px-4 py-3 text-bronze">{r.addToCarts}</td>
                  <td className="px-4 py-3 text-bronze">{r.purchases}</td>
                  <td className="px-4 py-3 text-bronze">
                    {r.cartRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-bronze">
                    {r.buyRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-cream">
                    {formatPrice(r.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/products/${r.product.id}`}
                      className="text-[11px] tracking-[0.2em] text-gold uppercase"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <section className="border border-gold/15 p-5">
        <h3 className="font-display text-xl text-cream">Slow movers</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {slowMovers.slice(0, 6).map((r) => (
            <li
              key={r.product.id}
              className="flex justify-between text-sm text-bronze"
            >
              <span className="text-cream">{r.product.name}</span>
              <span>{r.purchases} sold</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
