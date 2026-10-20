/**
 * Analytics - money from real orders (only what was actually collected) plus storefront activity.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import AnalyticsRangeFilter from '../../components/admin/analytics/AnalyticsRangeFilter'
import ResponsiveTable from '../../components/admin/ui/ResponsiveTable'
import {
  OrdersTrend,
  RevenueTrend,
  ShopperFunnel,
  StatusMix,
} from '../../components/admin/analytics/AnalyticsCharts'
import { formatPrice } from '../../data/products'
import { adminAnalyticsReport } from '../../services/analyticsApi'
import { ApiClientError } from '../../services/apiClient'

const RANGES = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom dates' },
]

const rupees = (paise) => formatPrice((paise || 0) / 100)
const count = (n) => (n || 0).toLocaleString('en-IN')
const percent = (part, whole) => (whole ? `${((part / whole) * 100).toFixed(1).replace(/\.0$/, '')}%` : '-')
const plural = (n, word) => `${count(n)} ${word}${n === 1 ? '' : 's'}`

function StatCard({ label, value, hint, highlight = false, tone, wide = false }) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-md px-4 py-4',
        highlight ? 'border border-[#1b1917] bg-[#1b1917] text-[#faf9f6]' : 'border border-[#e2dbcf] bg-card',
        wide && 'col-span-2 sm:col-span-1',
      )}
    >
      <p className={`text-[13px] font-medium ${highlight ? 'text-[#d4c9b4]' : 'text-[#4a4136]'}`}>{label}</p>
      <p
        className={`mt-1 text-[1.3rem] leading-tight font-semibold break-words tabular-nums sm:text-[1.6rem] ${
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
    <Card className={cn('min-w-0 gap-0 p-4 sm:p-5', className)}>
      <h3 className="text-base font-semibold text-[#1b1917]">{title}</h3>
      {description && <p className="mt-1 text-[14px] admin-muted">{description}</p>}
      <div className="mt-4 min-w-0">{children}</div>
    </Card>
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
      <span className="min-w-0">{label}</span>
      <span className={`shrink-0 tabular-nums ${paise < 0 ? 'text-[#6e1118]' : ''}`}>
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

function CategorySales({ categories }) {
  if (categories.length === 0) return <p className="text-[15px] admin-muted">No sales in this period.</p>
  const max = categories[0].revenuePaise || 1
  return (
    <ul className="space-y-3">
      {categories.map((c) => (
        <li key={c.category}>
          <div className="flex justify-between gap-3 text-[15px]">
            <span className="min-w-0 break-words text-[#1b1917]">{c.category}</span>
            <span className="shrink-0 tabular-nums">
              <span className="font-semibold">{rupees(c.revenuePaise)}</span>
              <span className="ml-2 text-[13px] admin-muted">{plural(c.units, 'unit')}</span>
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#ebe4d6]">
            <div
              className="h-full rounded-full bg-[var(--chart-1)]"
              style={{ width: `${Math.max(2, (c.revenuePaise / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function productNote(p, topRevenueId) {
  if (p.id === topRevenueId) return { text: 'Best seller', tone: 'good' }
  if (p.views >= 10 && p.unitsSold === 0) return { text: 'Viewed, not bought yet', tone: 'warn' }
  if (p.stock != null && p.stock <= 0 && p.active) return { text: 'Out of stock', tone: 'warn' }
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

  const noteTag = (p) => {
    const note = productNote(p, topRevenueId)
    return (
      note && (
        <span className={`inline-block rounded-full border px-2 py-0.5 text-[12px] ${NOTE_STYLES[note.tone]}`}>
          {note.text}
        </span>
      )
    )
  }
  const name = (p) => (
    <>
      <Link to={`/admin/products/${p.id}`} className="font-medium break-words hover:underline">
        {p.name}
      </Link>
      {p.category && <span className="block text-[12px] admin-muted">{p.category}</span>}
    </>
  )
  const num = 'text-right tabular-nums'
  const columns = [
    { key: 'name', header: 'Perfume', cell: name },
    { key: 'views', header: 'Views', cell: (p) => count(p.views), className: num, headClassName: 'text-right' },
    {
      key: 'carts',
      header: 'Added to cart',
      cell: (p) => count(p.addToCarts),
      className: num,
      headClassName: 'text-right',
    },
    { key: 'units', header: 'Units sold', cell: (p) => count(p.unitsSold), className: num, headClassName: 'text-right' },
    {
      key: 'sales',
      header: 'Sales',
      cell: (p) => rupees(p.revenuePaise),
      className: `${num} font-medium`,
      headClassName: 'text-right',
    },
    {
      key: 'rate',
      header: <span title="Units sold per 100 product page views">Views → sale</span>,
      cell: (p) => percent(p.unitsSold, p.views),
      className: num,
      headClassName: 'text-right',
    },
    { key: 'note', header: 'Note', cell: noteTag },
  ]

  const stat = (label, value) => (
    <div className="min-w-0">
      <dt className="text-[12px] admin-muted">{label}</dt>
      <dd className="tabular-nums text-[#1b1917]">{value}</dd>
    </div>
  )

  return (
    <ResponsiveTable
      caption="Perfume performance"
      columns={columns}
      rows={sorted}
      rowKey={(p) => p.id}
      renderCard={(p) => (
        <div className="space-y-2 text-[14px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">{name(p)}</div>
            <span className="shrink-0 font-semibold tabular-nums">{rupees(p.revenuePaise)}</span>
          </div>
          <dl className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-4">
            {stat('Views', count(p.views))}
            {stat('In cart', count(p.addToCarts))}
            {stat('Sold', count(p.unitsSold))}
            {stat('View → sale', percent(p.unitsSold, p.views))}
          </dl>
          {noteTag(p)}
        </div>
      )}
    />
  )
}

function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 bg-secondary" />
        ))}
      </div>
      <Skeleton className="h-80 bg-secondary" />
    </div>
  )
}

function periodText(shown) {
  if (shown.range.key === 'custom' && shown.range.from && shown.range.to) {
    const fmt = (iso) =>
      new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    return `${fmt(shown.range.from)} – ${fmt(shown.range.to)}, India time`
  }
  const label = RANGES.find((r) => r.key === shown.range.key)?.label.toLowerCase()
  const from = shown.range.from
    ? ` (${new Date(shown.range.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} – today, India time)`
    : ''
  return `${label}${from}`
}

export default function AdminAnalytics() {
  const [range, setRange] = useState('30d')
  const [custom, setCustom] = useState(null)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const data = await adminAnalyticsReport(
        range === 'custom' ? { range: 'custom', from: custom.from, to: custom.to } : range,
      )
      if (id === requestId.current) setReport(data)
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof ApiClientError ? err.message : 'Could not load analytics.')
      }
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [range, custom])

  useEffect(() => {
    if (range === 'custom' && (!custom?.from || !custom?.to)) return undefined
    load()
    return () => {
      requestId.current += 1
    }
  }, [range, custom, load])

  const shown = report

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="admin-title">Analytics</h2>
          <p className="mt-1 max-w-2xl text-[15px] admin-muted">
            Revenue comes straight from your orders and counts only money you have actually received.
            Unpaid, cancelled and not-yet-collected cash orders are shown separately.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <AnalyticsRangeFilter
            value={range}
            custom={custom}
            disabled={loading && !report}
            onChange={({ range: next, custom: nextCustom }) => {
              setRange(next)
              setCustom(nextCustom)
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-end sm:self-auto"
            onClick={() => load()}
            disabled={loading}
          >
            {loading && report ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e6c2c5] bg-[#fbeeef] px-4 py-3 text-[14px] text-[#6e1118]">
          <span className="min-w-0">{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            Try again
          </Button>
        </div>
      )}
      {!report && loading && <LoadingState />}

      {shown && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          <p className="text-[13px] admin-muted">
            Showing {periodText(shown)}. Updated{' '}
            {new Date(shown.generatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}.
          </p>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              highlight
              wide
              label="Net revenue"
              value={rupees(shown.money.netPaise)}
              hint="Money received minus refunds"
            />
            <StatCard
              wide
              label="Money received"
              value={rupees(shown.money.receivedPaise)}
              hint={`${plural(shown.money.paidOrders, 'paid order')} · online ${rupees(shown.money.online.paise)} · cash ${rupees(shown.money.cod.paise)}`}
            />
            <StatCard
              label="Refunds"
              value={rupees(shown.money.refundedPaise)}
              tone={shown.money.refundedPaise > 0 ? 'bad' : undefined}
              hint="Returned or being returned to customers"
            />
            <StatCard
              label="Average order"
              value={
                shown.money.paidOrders ? rupees(Math.round(shown.money.averageOrderPaise / 100) * 100) : '-'
              }
              hint="Typical amount paid per order"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="admin-surface min-w-0 rounded-md px-4 py-3.5">
              <p className="text-[13px] font-medium text-[#4a4136]">Orders placed</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[#1b1917]">{count(shown.placed?.orders)}</p>
              <p className="mt-1 text-[13px] admin-muted">
                {count(shown.placed?.byMethod.PREPAID)} prepaid · {count(shown.placed?.byMethod.COD)} cash on delivery.
                Every order, paid or not.
              </p>
            </div>
            <div className="admin-surface min-w-0 rounded-md border-dashed px-4 py-3.5">
              <p className="text-[13px] font-medium text-[#4a4136]">Cash on delivery - not collected yet</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[#1b1917]">
                {rupees(shown.money.codAwaiting.paise)}
                <span className="ml-2 text-[14px] font-normal admin-muted">
                  {plural(shown.money.codAwaiting.orders, 'order')}
                </span>
              </p>
              <p className="mt-1 text-[13px] admin-muted">
                Counted as revenue once you mark the cash as received on the order.
              </p>
            </div>
            <div className="admin-surface min-w-0 rounded-md border-dashed px-4 py-3.5">
              <p className="text-[13px] font-medium text-[#4a4136]">Orders that were never paid</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[#1b1917]">
                {count(shown.money.unpaid.orders)}
              </p>
              <p className="mt-1 text-[13px] admin-muted">
                {count(shown.money.unpaid.cancelled)} cancelled · {count(shown.money.unpaid.failedOrExpired)} payment
                failed or expired · {count(shown.money.unpaid.awaitingPayment)} still awaiting payment. Not counted as
                revenue.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Section
              className="lg:col-span-3"
              title={shown.timeline.unit === 'month' ? 'Net revenue by month' : 'Net revenue by day'}
              description="Money received each day (India time), after refunds."
            >
              <RevenueTrend key={shown.range.key} timeline={shown.timeline} />
            </Section>
            <Section
              className="lg:col-span-2"
              title="Where the money came from"
              description="Paid orders in this period, line by line."
            >
              <MoneyBreakdown money={shown.money} />
            </Section>
          </div>

          {shown.placed && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Section
                title={shown.timeline.unit === 'month' ? 'Orders placed by month' : 'Orders placed by day'}
                description="Every order on the day it was placed, including ones that were never paid."
              >
                <OrdersTrend key={shown.range.key} timeline={shown.timeline} placed={shown.placed} />
              </Section>
              <Section title="Where those orders are now" description="Current status of the orders placed in this period.">
                <StatusMix key={shown.range.key} placed={shown.placed} />
              </Section>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <Section
              className="lg:col-span-2"
              title="Shopper journey"
              description="How many shoppers moved from looking to paying."
            >
              <ShopperFunnel key={shown.range.key} funnel={shown.funnel} />
            </Section>
            <Section
              className="lg:col-span-3"
              title="Sales by category"
              description="Units sold and product sales (excluding shipping and fees)."
            >
              <CategorySales categories={shown.categories} />
            </Section>
          </div>

          <Section
            title="Perfume performance"
            description="Sales are what customers paid for the perfume itself (after sale discounts), from paid orders that weren't refunded."
          >
            <ProductTable products={shown.products} />
          </Section>

          <details className="admin-surface rounded-md p-4 text-[14px] sm:p-5">
            <summary className="cursor-pointer font-semibold text-[#1b1917]">How these numbers are calculated</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[#4a4136]">
              <li>
                <strong>Money received</strong> counts online payments captured by Razorpay and cash-on-delivery orders
                you marked as cash received, on the day the money arrived.
              </li>
              <li>
                <strong>Refunds</strong> use the refund amount recorded with the payment; orders marked “refund in
                progress” count in full. A refund is shown against the day the order was paid, not the day it was
                refunded.
              </li>
              <li>
                <strong>Not counted:</strong> orders awaiting payment, failed or expired payments, cancelled orders and
                cash-on-delivery orders whose cash hasn&apos;t been collected yet.
              </li>
              <li>
                <strong>Orders placed</strong> counts every order on the day it was created, whatever happened next, so
                it can be higher than paid orders.
              </li>
              <li>
                <strong>Views</strong> count each shopper once per perfume every 30 minutes. Carts and checkouts count
                every time they happen. All three are recorded by the storefront as shoppers browse.
              </li>
              <li>Every figure, including test orders you paid for yourself, comes from the live database - nothing is estimated.</li>
            </ul>
          </details>
        </div>
      )}
    </div>
  )
}
