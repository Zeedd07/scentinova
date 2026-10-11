/**
 * Analytics - money from real orders (only what was actually collected) plus storefront activity.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { adminAnalyticsReport } from '../../services/analyticsApi'
import { ApiClientError } from '../../services/apiClient'

const RANGES = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
]

const rupees = (paise) => formatPrice((paise || 0) / 100)
const count = (n) => (n || 0).toLocaleString('en-IN')
const percent = (part, whole) => (whole ? `${((part / whole) * 100).toFixed(1).replace(/\.0$/, '')}%` : '-')
const plural = (n, word) => `${count(n)} ${word}${n === 1 ? '' : 's'}`

/** Chart keys are calendar dates in India time: 'YYYY-MM-DD' or 'YYYY-MM'. */
function bucketLabel(key, unit, long = false) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d || 1))
  const options =
    unit === 'month'
      ? { month: long ? 'long' : 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short', ...(long ? { weekday: 'short', year: 'numeric' } : {}) }
  return date.toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' })
}

function RangePicker({ value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Time period">
      {RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          disabled={disabled}
          aria-pressed={value === r.key}
          onClick={() => onChange(r.key)}
          className={`admin-btn !px-3 !py-1.5 !text-[13px] ${value === r.key ? 'admin-btn-primary' : ''}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function StatCard({ label, value, hint, highlight = false, tone }) {
  return (
    <div
      className={`px-4 py-4 ${highlight ? 'border border-[#1b1917] bg-[#1b1917] text-[#faf9f6]' : 'admin-surface'}`}
    >
      <p className={`text-[13px] font-medium ${highlight ? 'text-[#d4c9b4]' : 'text-[#4a4136]'}`}>{label}</p>
      <p
        className={`mt-1 text-[1.6rem] leading-tight font-semibold tabular-nums ${
          highlight ? 'text-white' : tone === 'bad' ? 'text-[#6e1118]' : 'text-[#1b1917]'
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className={`mt-1.5 text-[13px] leading-snug ${highlight ? 'text-[#d4c9b4]' : 'admin-muted'}`}>
          {hint}
        </p>
      )}
    </div>
  )
}

function Section({ title, description, children, className = '' }) {
  return (
    <section className={`admin-surface p-4 sm:p-5 ${className}`}>
      <h3 className="text-base font-semibold text-[#1b1917]">{title}</h3>
      {description && <p className="mt-1 text-[14px] admin-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function RevenueChart({ timeline }) {
  const { points, unit } = timeline
  const [active, setActive] = useState(null)
  const max = Math.max(...points.map((p) => p.netPaise), 0)
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))
  const shown = active != null ? points[active] : null
  const totals = points.reduce(
    (acc, p) => ({ net: acc.net + p.netPaise, orders: acc.orders + p.orders }),
    { net: 0, orders: 0 },
  )

  if (max <= 0) {
    return (
      <p className="py-10 text-center text-[15px] admin-muted">
        No money was collected in this period.
      </p>
    )
  }

  return (
    <div>
      <p className="min-h-[2.75rem] text-[14px] text-[#4a4136]" aria-live="polite">
        {shown ? (
          <>
            <span className="font-semibold text-[#1b1917]">{bucketLabel(shown.key, unit, true)}</span>
            <br />
            {rupees(shown.netPaise)} net from {plural(shown.orders, 'paid order')}
            {shown.refundedPaise > 0 && ` (after ${rupees(shown.refundedPaise)} refunded)`}
          </>
        ) : (
          <>
            <span className="font-semibold text-[#1b1917]">{rupees(totals.net)}</span> net from{' '}
            {plural(totals.orders, 'paid order')}
            <br />
            <span className="admin-muted">Hover or tap a bar to see that {unit}.</span>
          </>
        )}
      </p>

      <div className="relative mt-3 flex h-48 items-end gap-[3px] border-b border-l border-[#e0d6c4] pl-1 sm:gap-1">
        <span className="absolute -top-1 left-2 text-[11px] admin-muted">{rupees(max)}</span>
        {points.map((p, i) => {
          const height = p.netPaise > 0 ? Math.max(3, (p.netPaise / max) * 100) : 0
          return (
            <button
              key={p.key}
              type="button"
              aria-label={`${bucketLabel(p.key, unit, true)}: ${rupees(p.netPaise)} from ${plural(p.orders, 'order')}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(i)}
              className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
            >
              <span
                className={`block w-full transition-colors ${
                  active === i ? 'bg-[#1b1917]' : 'bg-gold group-hover:bg-bronze'
                }`}
                style={{ height: `${height}%` }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-[3px] pl-1 sm:gap-1">
        {points.map((p, i) => (
          <span key={p.key} className="min-w-0 flex-1 text-center text-[10px] whitespace-nowrap admin-muted">
            {i % labelEvery === 0 ? bucketLabel(p.key, unit) : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function MoneyBreakdown({ money }) {
  const b = money.breakdown
  const rows = [
    ['Product sales (full price)', b.itemsPaise],
    b.discountPaise > 0 && ['Sale discounts given', -b.discountPaise],
    ['Shipping charged', b.shippingPaise],
    b.codFeePaise > 0 && ['Cash-on-delivery fees', b.codFeePaise],
    b.convenienceFeePaise > 0 && ['Convenience fees', b.convenienceFeePaise],
    b.taxPaise > 0 && ['Tax', b.taxPaise],
  ].filter(Boolean)

  const line = (label, paise, strong = false) => (
    <div
      key={label}
      className={`flex justify-between gap-4 py-2 text-[15px] ${strong ? 'font-semibold text-[#1b1917]' : 'text-[#4a4136]'}`}
    >
      <span>{label}</span>
      <span className={`tabular-nums ${paise < 0 ? 'text-[#6e1118]' : ''}`}>
        {paise < 0 ? `−${rupees(-paise)}` : rupees(paise)}
      </span>
    </div>
  )

  return (
    <div className="divide-y divide-[#ebe4d6]">
      {rows.map(([label, paise]) => line(label, paise))}
      {line('Money received', money.receivedPaise, true)}
      {line('Refunds', -money.refundedPaise)}
      <div className="flex justify-between gap-4 border-t-2 border-[#1b1917] pt-2.5 text-[16px] font-semibold text-[#1b1917]">
        <span>Net revenue</span>
        <span className="tabular-nums">{rupees(money.netPaise)}</span>
      </div>
    </div>
  )
}

function Funnel({ funnel }) {
  const steps = [
    ['Product page views', funnel.views, 'Shoppers opening a product page'],
    ['Added to cart', funnel.addToCarts, 'Times a perfume was added to the bag'],
    ['Started checkout', funnel.checkoutStarted, 'Visits to the checkout page'],
    ['Paid orders', funnel.paidOrders, 'Orders where money was collected'],
  ]
  const max = Math.max(funnel.views, funnel.addToCarts, funnel.checkoutStarted, funnel.paidOrders, 1)

  return (
    <div className="space-y-4">
      {steps.map(([label, value, hint], i) => (
        <div key={label}>
          <div className="flex items-baseline justify-between gap-3 text-[15px]">
            <span className="text-[#1b1917]">{label}</span>
            <span className="tabular-nums">
              <span className="font-semibold text-[#1b1917]">{count(value)}</span>
              {i > 0 && (
                <span className="ml-2 text-[13px] admin-muted">{percent(value, funnel.views)} of views</span>
              )}
            </span>
          </div>
          <div className="mt-1 h-2.5 bg-[#ebe4d6]">
            <div
              className={i === steps.length - 1 ? 'h-full bg-[#3f6b3a]' : 'h-full bg-gold'}
              style={{ width: `${value ? Math.max(1.5, (value / max) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-1 text-[12px] admin-muted">{hint}</p>
        </div>
      ))}
    </div>
  )
}

function productNote(p, topRevenueId) {
  if (p.id === topRevenueId) return { text: 'Best seller', tone: 'good' }
  if (p.views >= 10 && p.unitsSold === 0) return { text: 'Viewed, not bought yet', tone: 'warn' }
  if (p.stock != null && p.stock <= 8 && p.active) return { text: `Only ${p.stock} in stock`, tone: 'warn' }
  if (!p.active) return { text: 'Hidden from store', tone: 'muted' }
  return null
}

const NOTE_STYLES = {
  good: 'border-[#3f6b3a]/40 bg-[#eef4ec] text-[#3f6b3a]',
  warn: 'border-[#b8862b]/40 bg-[#fbf3e2] text-[#7a5f2c]',
  muted: 'border-[#d8d0c2] bg-[#f5f1ea] text-[#6b645b]',
}

function ProductTable({ products }) {
  const sorted = [...products].sort(
    (a, b) => b.revenuePaise - a.revenuePaise || b.views - a.views || a.name.localeCompare(b.name),
  )
  const topRevenueId = sorted[0]?.revenuePaise > 0 ? sorted[0].id : null

  return (
    <div className="overflow-x-auto">
      <table className="admin-table w-full min-w-[720px] text-left">
        <thead className="border-b border-[#e0d6c4]">
          <tr>
            <th className="px-3 py-2.5">Perfume</th>
            <th className="px-3 py-2.5 !text-right">Views</th>
            <th className="px-3 py-2.5 !text-right">Added to cart</th>
            <th className="px-3 py-2.5 !text-right">Units sold</th>
            <th className="px-3 py-2.5 !text-right">Sales</th>
            <th className="px-3 py-2.5 !text-right" title="Units sold per 100 product page views">
              Views → sale
            </th>
            <th className="px-3 py-2.5">Note</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const note = productNote(p, topRevenueId)
            return (
              <tr key={p.id} className="border-b border-[#ebe4d6]">
                <td className="px-3 py-2.5">
                  <Link to={`/admin/products/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  {p.category && <span className="block text-[12px] admin-muted">{p.category}</span>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(p.views)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(p.addToCarts)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(p.unitsSold)}</td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">{rupees(p.revenuePaise)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{percent(p.unitsSold, p.views)}</td>
                <td className="px-3 py-2.5">
                  {note && (
                    <span className={`inline-block border px-2 py-0.5 text-[12px] ${NOTE_STYLES[note.tone]}`}>
                      {note.text}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminAnalytics() {
  const [range, setRange] = useState('30d')
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (key, isCancelled = () => false) => {
    setLoading(true)
    setError('')
    try {
      const data = await adminAnalyticsReport(key)
      if (!isCancelled()) setReport(data)
    } catch (err) {
      if (!isCancelled()) {
        setError(err instanceof ApiClientError ? err.message : 'Could not load analytics.')
      }
    } finally {
      if (!isCancelled()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    load(range, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [range, load])

  const rangeLabel = RANGES.find((r) => r.key === range)?.label.toLowerCase()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="admin-title">Analytics</h2>
          <p className="mt-1 max-w-2xl text-[15px] admin-muted">
            Revenue comes straight from your orders and counts only money you have actually received.
            Unpaid, cancelled and not-yet-collected cash orders are shown separately.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangePicker value={range} onChange={setRange} disabled={loading && !report} />
          <button type="button" className="admin-btn admin-btn-quiet !px-3 !py-1.5 !text-[13px]" onClick={() => load(range)} disabled={loading}>
            {loading && report ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <p className="text-[#6e1118]">{error}</p>}
      {!report && loading && <p className="admin-muted">Loading analytics…</p>}

      {report && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <p className="text-[13px] admin-muted">
            Showing {rangeLabel}
            {report.range.from &&
              ` (${new Date(report.range.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – today)`}
            . Updated {new Date(report.generatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              highlight
              label="Net revenue"
              value={rupees(report.money.netPaise)}
              hint="Money received minus refunds"
            />
            <StatCard
              label="Money received"
              value={rupees(report.money.receivedPaise)}
              hint={`${plural(report.money.paidOrders, 'paid order')} · online ${rupees(report.money.online.paise)} · cash ${rupees(report.money.cod.paise)}`}
            />
            <StatCard
              label="Refunds"
              value={rupees(report.money.refundedPaise)}
              tone={report.money.refundedPaise > 0 ? 'bad' : undefined}
              hint="Returned or being returned to customers"
            />
            <StatCard
              label="Average order"
              value={
                report.money.paidOrders ? rupees(Math.round(report.money.averageOrderPaise / 100) * 100) : '-'
              }
              hint="Typical amount paid per order"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="admin-surface border-dashed px-4 py-3.5">
              <p className="text-[13px] font-medium text-[#4a4136]">Cash on delivery - not collected yet</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[#1b1917]">
                {rupees(report.money.codAwaiting.paise)}
                <span className="ml-2 text-[14px] font-normal admin-muted">
                  {plural(report.money.codAwaiting.orders, 'order')}
                </span>
              </p>
              <p className="mt-1 text-[13px] admin-muted">
                Counted as revenue once you mark the cash as received on the order.
              </p>
            </div>
            <div className="admin-surface border-dashed px-4 py-3.5">
              <p className="text-[13px] font-medium text-[#4a4136]">Orders that were never paid</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[#1b1917]">
                {count(report.money.unpaid.orders)}
              </p>
              <p className="mt-1 text-[13px] admin-muted">
                {count(report.money.unpaid.cancelled)} cancelled · {count(report.money.unpaid.failedOrExpired)} payment
                failed or expired · {count(report.money.unpaid.awaitingPayment)} still awaiting payment. Not counted as
                revenue.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Section
              className="lg:col-span-3"
              title={report.timeline.unit === 'month' ? 'Net revenue by month' : 'Net revenue by day'}
              description="Money received each day (India time), after refunds."
            >
              <RevenueChart key={range} timeline={report.timeline} />
            </Section>
            <Section
              className="lg:col-span-2"
              title="Where the money came from"
              description="Paid orders in this period, line by line."
            >
              <MoneyBreakdown money={report.money} />
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Section
              className="lg:col-span-2"
              title="Shopper journey"
              description="How many shoppers moved from looking to paying."
            >
              <Funnel funnel={report.funnel} />
            </Section>
            <Section
              className="lg:col-span-3"
              title="Sales by category"
              description="Units sold and product sales (excluding shipping and fees)."
            >
              {report.categories.length === 0 ? (
                <p className="text-[15px] admin-muted">No sales in this period.</p>
              ) : (
                <div className="space-y-3">
                  {report.categories.map((c) => {
                    const max = report.categories[0].revenuePaise || 1
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between gap-3 text-[15px]">
                          <span className="text-[#1b1917]">{c.category}</span>
                          <span className="tabular-nums">
                            <span className="font-semibold">{rupees(c.revenuePaise)}</span>
                            <span className="ml-2 text-[13px] admin-muted">{plural(c.units, 'unit')}</span>
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 bg-[#ebe4d6]">
                          <div
                            className="h-full bg-gold"
                            style={{ width: `${Math.max(2, (c.revenuePaise / max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>
          </div>

          <Section
            title="Perfume performance"
            description="Sales are what customers paid for the perfume itself (after sale discounts), from paid orders that weren't refunded."
          >
            <ProductTable products={report.products} />
          </Section>

          <details className="admin-surface p-4 text-[14px] sm:p-5">
            <summary className="cursor-pointer font-semibold text-[#1b1917]">How these numbers are calculated</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[#4a4136]">
              <li>
                <strong>Money received</strong> counts online payments captured by Razorpay and cash-on-delivery orders
                you marked as cash received, on the day the money arrived.
              </li>
              <li>
                <strong>Refunds</strong> use the refund amount recorded with the payment; orders marked “refund in
                progress” count in full.
              </li>
              <li>
                <strong>Not counted:</strong> orders awaiting payment, failed or expired payments, cancelled orders and
                cash-on-delivery orders whose cash hasn&apos;t been collected yet.
              </li>
              <li>
                <strong>Views</strong> count each shopper once per perfume every 30 minutes. Views, carts and checkouts
                are recorded by the storefront as shoppers browse.
              </li>
              <li>Every figure, including test orders you paid for yourself, comes from the live database - nothing is estimated.</li>
            </ul>
          </details>
        </div>
      )}
    </div>
  )
}
