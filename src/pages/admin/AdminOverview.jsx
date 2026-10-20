/**
 * Admin overview - live MongoDB KPIs.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatPrice } from '../../data/products'
import { orderStatusBadgeClass, orderStatusLabel } from '../../lib/orderStatus'
import { adminDashboard } from '../../services/analyticsApi'
import { ApiClientError } from '../../services/apiClient'

const formatRupees = (n) => formatPrice(Math.round(n))
const orderTotal = (o) => (o.pricing?.totalPaise != null ? o.pricing.totalPaise / 100 : o.total)

export default function AdminOverview() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
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
  }, [attempt])

  if (loading && !data) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading overview">
        <Skeleton className="h-9 w-48 bg-secondary" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20 bg-secondary" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e6c2c5] bg-[#fbeeef] px-4 py-3 text-[14px] text-[#6e1118]">
        <span className="min-w-0">{error}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </Button>
      </div>
    )
  }

  const lowStockCount = data.lowStockCount ?? data.lowStock?.length ?? 0
  const listedLowStock = data.lowStock?.length ?? 0
  const kpis = [
    { label: 'Net revenue (received, all time)', value: data.revenue ?? 0, format: formatRupees, wide: true },
    { label: 'Paid orders', value: data.orders ?? 0 },
    { label: 'Cash on delivery to collect', value: data.codAwaitingRevenue ?? 0, format: formatRupees },
    { label: 'Units sold', value: data.unitsSold ?? 0 },
    { label: 'Product page views', value: data.views ?? 0 },
    { label: 'Added to cart', value: data.addToCarts ?? 0 },
    { label: 'Products', value: data.products ?? 0, hint: `${data.activeProducts ?? 0} on sale` },
    { label: 'Low stock', value: lowStockCount, warn: lowStockCount > 0, hint: `${data.lowStockThreshold ?? 8} or fewer left` },
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="admin-title">Overview</h2>
          <p className="mt-1 admin-muted text-[15px]">
            Live data stored in Scentinova.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/admin/products/new">Add perfume</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card
            key={k.label}
            className={cn('min-w-0 gap-0 rounded-md px-4 py-3 shadow-none', k.wide && 'col-span-2 lg:col-span-1')}
          >
            <p className="text-[13px] text-muted">{k.label}</p>
            <NumberTicker
              value={Number(k.value) || 0}
              formatValue={k.format}
              className={cn(
                'mt-1 text-xl font-semibold tracking-normal break-words tabular-nums sm:text-2xl',
                k.warn ? 'text-[#6e1118]' : 'text-[#1b1917]',
              )}
            />
            {k.hint && <p className="mt-0.5 text-[12px] admin-muted">{k.hint}</p>}
          </Card>
        ))}
      </div>
      <p className="-mt-3 text-[13px] admin-muted md:-mt-5">
        Revenue counts only money collected, after refunds.{' '}
        <Link to="/admin/analytics" className="admin-link">
          See analytics by date
        </Link>
      </p>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="min-w-0 gap-0 rounded-sm py-0 shadow-none">
          <CardHeader className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardTitle className="text-base font-semibold text-[#1b1917]">Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3 pb-4 sm:px-5 sm:pb-5">
            {(data.recentOrders?.length ?? 0) === 0 ? (
              <p className="text-[15px] admin-muted">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-[#ebe4d6]">
                {data.recentOrders.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="flex min-h-11 items-center justify-between gap-3 py-2 text-[15px] hover:text-[#7a5f2c]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate" title={o.orderNumber}>{o.orderNumber}</span>
                        <span className="block truncate text-[13px] admin-muted">
                          {(o.customerSnapshot || o.customer)?.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tabular-nums text-[#1b1917]">{formatPrice(orderTotal(o))}</span>
                        <span className={orderStatusBadgeClass(o.status)}>{orderStatusLabel(o.status)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-0 rounded-sm py-0 shadow-none">
          <CardHeader className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardTitle className="text-base font-semibold text-[#1b1917]">Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3 pb-4 sm:px-5 sm:pb-5">
            {lowStockCount === 0 ? (
              <p className="text-[15px] admin-muted">Stock levels look healthy.</p>
            ) : (
              <ul className="divide-y divide-[#ebe4d6]">
                {data.lowStock.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/admin/products/${p.id}`}
                      className="flex min-h-11 items-center justify-between gap-3 py-2 text-[15px] text-[#1b1917] hover:underline"
                    >
                      <span className="min-w-0 truncate" title={p.name}>{p.name}</span>
                      <span className="shrink-0 text-[#6e1118]">{p.stock > 0 ? `${p.stock} left` : 'Out of stock'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {lowStockCount > listedLowStock && (
              <p className="mt-2 text-[13px] admin-muted">
                Showing the {listedLowStock} lowest of {lowStockCount}.{' '}
                <Link to="/admin/products" className="admin-link">
                  All products
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
