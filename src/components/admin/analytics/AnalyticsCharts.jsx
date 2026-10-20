/**
 * Analytics charts built on the Bklit registry components in src/components/charts.
 * Every value comes from the /admin/analytics/report response; nothing is estimated here.
 */
import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import { AreaChart, Area } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { Bar } from '@/components/charts/bar'
import { BarXAxis } from '@/components/charts/bar-x-axis'
import { BarYAxis } from '@/components/charts/bar-y-axis'
import { FunnelChart } from '@/components/charts/funnel-chart'
import { Grid } from '@/components/charts/grid'
import { XAxis } from '@/components/charts/x-axis'
import { YAxis } from '@/components/charts/y-axis'
import { ChartTooltip, TooltipContent } from '@/components/charts/tooltip'
import { formatPrice } from '../../../data/products'
import { orderStatusLabel } from '../../../lib/orderStatus'

const rupees = (paise) => formatPrice((paise || 0) / 100)
const count = (n) => (n || 0).toLocaleString('en-IN')
const plural = (n, word) => `${count(n)} ${word}${n === 1 ? '' : 's'}`
const compactInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const wholeTick = (n) => (Number.isInteger(n) ? count(n) : '')

const STILL = { type: 'tween', duration: 0 }

/** Chart keys are calendar dates in India time: 'YYYY-MM-DD' or 'YYYY-MM'. */
export function bucketLabel(key, unit, long = false) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d || 1))
  const options =
    unit === 'month'
      ? { month: long ? 'long' : 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short', ...(long ? { weekday: 'short', year: 'numeric' } : {}) }
  return date.toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' })
}

/** Noon in India keeps the bucket on the same calendar day in any viewer time zone. */
function bucketDate(key) {
  return new Date(`${key.length === 7 ? `${key}-01` : key}T12:00:00+05:30`)
}

function useMotionProps() {
  const reduce = useReducedMotion()
  return reduce
    ? { animationDuration: 0, enterTransition: STILL, animate: false }
    : { animationDuration: 700, enterTransition: undefined, animate: true }
}

function Empty({ children }) {
  return <p className="py-10 text-center text-[15px] admin-muted">{children}</p>
}

function Summary({ children }) {
  return <p className="min-h-[1.5rem] text-[14px] text-[#4a4136]">{children}</p>
}

/** Net money collected per day (area) or per month (bars), with received and refunds in the tooltip. */
export function RevenueTrend({ timeline }) {
  const { points, unit } = timeline
  const motionProps = useMotionProps()
  const data = useMemo(
    () =>
      points.map((p) => ({
        key: p.key,
        date: bucketDate(p.key),
        label: bucketLabel(p.key, unit),
        net: p.netPaise / 100,
        point: p,
      })),
    [points, unit],
  )
  const totals = points.reduce(
    (acc, p) => ({ net: acc.net + p.netPaise, orders: acc.orders + p.orders }),
    { net: 0, orders: 0 },
  )
  const hasMoney = points.some((p) => p.receivedPaise > 0 || p.refundedPaise > 0)
  if (!hasMoney) return <Empty>No money was collected in this period.</Empty>

  const tooltip = ({ point }) => {
    const p = point.point
    const rows = [
      { color: 'var(--chart-1)', label: 'Net', value: rupees(p.netPaise) },
      { color: 'var(--chart-2)', label: 'Received', value: rupees(p.receivedPaise) },
      ...(p.refundedPaise > 0 ? [{ color: 'var(--chart-3)', label: 'Refunded', value: `−${rupees(p.refundedPaise)}` }] : []),
      { color: 'var(--chart-5)', label: 'Paid orders', value: count(p.orders) },
    ]
    return <TooltipContent rows={rows} title={bucketLabel(p.key, unit, true)} />
  }
  const margin = { top: 16, right: 12, bottom: 34, left: 56 }
  const yAxis = <YAxis formatValue={(v) => compactInr.format(v)} numTicks={4} />
  const summary = (
    <Summary>
      <span className="font-semibold text-[#1b1917]">{rupees(totals.net)}</span> net from{' '}
      {plural(totals.orders, 'paid order')}. Hover or tap the chart for each {unit}.
    </Summary>
  )
  const label = `Net revenue by ${unit}: ${rupees(totals.net)} in total from ${plural(totals.orders, 'paid order')}.`

  if (unit === 'month') {
    return (
      <div>
        {summary}
        <div role="img" aria-label={label} className="mt-3">
          <BarChart
            aspectRatio="auto"
            className="h-56 sm:h-72"
            data={data}
            margin={margin}
            xDataKey="label"
            animationDuration={motionProps.animationDuration}
            enterTransition={motionProps.enterTransition}
          >
            <Grid horizontal numTicksRows={4} />
            <Bar dataKey="net" fill="var(--chart-1)" lineCap={3} animate={motionProps.animate} minBarHeight={2} />
            <BarXAxis maxLabels={8} />
            {yAxis}
            <ChartTooltip content={tooltip} showDatePill={false} />
          </BarChart>
        </div>
      </div>
    )
  }

  return (
    <div>
      {summary}
      <div role="img" aria-label={label} className="mt-3">
        <AreaChart
          aspectRatio="auto"
          className="h-56 sm:h-72"
          style={{ touchAction: 'pan-y' }}
          data={data}
          margin={margin}
          animationDuration={motionProps.animationDuration}
          enterTransition={motionProps.enterTransition}
          yDomainTween={motionProps.animate}
        >
          <Grid horizontal numTicksRows={4} />
          <Area dataKey="net" fill="var(--chart-1)" fillOpacity={0.28} strokeWidth={2} animate={motionProps.animate} />
          <XAxis numTicks={points.length > 14 ? 5 : 7} />
          {yAxis}
          <ChartTooltip content={tooltip} />
        </AreaChart>
      </div>
    </div>
  )
}

/** Orders placed per bucket, whatever happened to them afterwards. */
export function OrdersTrend({ timeline, placed }) {
  const { points, unit } = timeline
  const motionProps = useMotionProps()
  const data = useMemo(
    () => points.map((p) => ({ key: p.key, label: bucketLabel(p.key, unit), orders: p.placedOrders || 0 })),
    [points, unit],
  )
  if (!placed.orders) return <Empty>No orders were placed in this period.</Empty>

  const busiest = data.reduce((best, p) => (p.orders > best.orders ? p : best), data[0])
  const tied = data.filter((p) => p.orders === busiest.orders).length
  const tooltip = ({ point }) => (
    <TooltipContent
      rows={[{ color: 'var(--chart-2)', label: 'Orders placed', value: count(point.orders) }]}
      title={bucketLabel(point.key, unit, true)}
    />
  )

  return (
    <div>
      <Summary>
        <span className="font-semibold text-[#1b1917]">{plural(placed.orders, 'order')}</span> placed ·{' '}
        {tied > 1
          ? `most in one ${unit}: ${count(busiest.orders)}, on ${tied} ${unit}s.`
          : `busiest ${unit} ${bucketLabel(busiest.key, unit, true)} (${count(busiest.orders)}).`}
      </Summary>
      <div
        role="img"
        aria-label={`Orders placed by ${unit}: ${plural(placed.orders, 'order')} in total.`}
        className="mt-3"
      >
        <BarChart
          aspectRatio="auto"
          className="h-48 sm:h-60"
          data={data}
          margin={{ top: 16, right: 12, bottom: 34, left: 40 }}
          xDataKey="label"
          barGap={data.length > 40 ? 0.1 : 0.25}
          animationDuration={motionProps.animationDuration}
          enterTransition={motionProps.enterTransition}
        >
          <Grid horizontal numTicksRows={4} />
          <Bar dataKey="orders" fill="var(--chart-2)" lineCap={2} animate={motionProps.animate} />
          <BarXAxis maxLabels={7} />
          <YAxis formatValue={wholeTick} numTicks={4} />
          <ChartTooltip content={tooltip} showDatePill={false} />
        </BarChart>
      </div>
    </div>
  )
}

const STATUS_ORDER = [
  'PENDING_PAYMENT',
  'PAYMENT_PROCESSING',
  'PAYMENT_FAILED',
  'PAYMENT_EXPIRED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUND_PENDING',
  'REFUNDED',
]

/** Where the orders placed in this period are now. */
export function StatusMix({ placed }) {
  const motionProps = useMotionProps()
  const rows = useMemo(
    () =>
      Object.entries(placed.byStatus)
        .filter(([, n]) => n > 0)
        .sort(([a], [b]) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b))
        .map(([status, orders]) => ({ status, label: orderStatusLabel(status), orders })),
    [placed.byStatus],
  )
  if (!rows.length) return <Empty>No orders were placed in this period.</Empty>

  const share = (n) => `${Math.round((n / placed.orders) * 100)}%`
  const tooltip = ({ point }) => (
    <TooltipContent
      rows={[{ color: 'var(--chart-1)', label: 'Orders', value: `${count(point.orders)} (${share(point.orders)})` }]}
      title={point.label}
    />
  )

  return (
    <div className="space-y-4">
      <div aria-hidden="true" className="min-w-0" style={{ height: Math.max(120, rows.length * 30 + 24) }}>
        <BarChart
          aspectRatio="auto"
          className="h-full"
          data={rows}
          margin={{ top: 8, right: 16, bottom: 8, left: 128 }}
          orientation="horizontal"
          xDataKey="label"
          barGap={0.3}
          animationDuration={motionProps.animationDuration}
          enterTransition={motionProps.enterTransition}
        >
          <Bar dataKey="orders" fill="var(--chart-1)" lineCap={3} animate={motionProps.animate} minBarHeight={2} />
          <BarYAxis />
          <ChartTooltip content={tooltip} showCrosshair={false} />
        </BarChart>
      </div>
      <dl className="grid gap-x-6 text-[14px] sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.status} className="flex justify-between gap-3 border-b border-[#ebe4d6] py-1.5">
            <dt className="min-w-0 text-[#4a4136]">{r.label}</dt>
            <dd className="shrink-0 tabular-nums text-[#1b1917]">
              {count(r.orders)} <span className="admin-muted">· {share(r.orders)}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[13px] admin-muted">
        {count(placed.byMethod.PREPAID)} prepaid · {count(placed.byMethod.COD)} cash on delivery
      </p>
    </div>
  )
}

const FUNNEL_STEPS = [
  ['views', 'Views', 'Product page views', 'Shoppers opening a product page'],
  ['addToCarts', 'Carts', 'Added to cart', 'Times a perfume was added to the bag'],
  ['checkoutStarted', 'Checkouts', 'Started checkout', 'Visits to the checkout page'],
  ['paidOrders', 'Paid', 'Paid orders', 'Orders where money was collected'],
]

const percentOf = (part, whole) =>
  whole ? `${((part / whole) * 100).toFixed(1).replace(/\.0$/, '')}%` : '-'

/**
 * The funnel chart only draws when each stage is no larger than the one before; carts and checkouts
 * are counted per event, so a shopper adding twice can make a later stage bigger than an earlier one.
 */
export function ShopperFunnel({ funnel }) {
  const reduce = useReducedMotion()
  const values = FUNNEL_STEPS.map(([key]) => funnel[key] || 0)
  const narrows = values[0] > 0 && values.every((v, i) => i === 0 || v <= values[i - 1])
  const data = FUNNEL_STEPS.map(([, short], i) => ({ label: short, value: values[i] }))

  return (
    <div className="space-y-4">
      {narrows ? (
        <div aria-hidden="true" className="px-1">
          <FunnelChart
            data={data}
            color="var(--chart-1)"
            layers={2}
            gap={3}
            formatValue={count}
            formatPercentage={(p) => `${p < 10 ? p.toFixed(1).replace(/\.0$/, '') : Math.round(p)}%`}
            staggerDelay={reduce ? 0 : 0.08}
            enterTransition={reduce ? STILL : undefined}
            style={{ aspectRatio: '2.4 / 1', minHeight: 150 }}
          />
        </div>
      ) : (
        values[0] > 0 && (
          <p className="text-[13px] admin-muted">
            A later step is larger than an earlier one (carts and checkouts count every visit), so the funnel
            shape is not drawn. The figures below are exact.
          </p>
        )
      )}
      <ol className="space-y-3">
        {FUNNEL_STEPS.map(([key, , label, hint], i) => (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-3 text-[15px]">
              <span className="min-w-0 text-[#1b1917]">{label}</span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold text-[#1b1917]">{count(values[i])}</span>
                {i > 0 && (
                  <span className="ml-2 text-[13px] admin-muted">{percentOf(values[i], values[0])} of views</span>
                )}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] admin-muted">{hint}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
