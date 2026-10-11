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
import { adminDashboard } from '../../services/analyticsApi'
import { ApiClientError } from '../../services/apiClient'

const formatRupees = (n) => formatPrice(Math.round(n))

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

  if (error) {
    return <p className="text-[#6e1118]">{error}</p>
  }

  const lowStockCount = data.lowStock?.length ?? 0
  const kpis = [
    { label: 'Products', value: data.products ?? 0 },
    { label: 'Catalog views', value: data.views ?? 0 },
    { label: 'Add to cart', value: data.addToCarts ?? 0 },
    { label: 'Units sold', value: data.unitsSold ?? 0 },
    { label: 'Net revenue (received)', value: data.revenue ?? 0, format: formatRupees, wide: true },
    { label: 'Paid orders', value: data.orders ?? 0 },
    { label: 'Low stock', value: lowStockCount, warn: lowStockCount > 0 },
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card
            key={k.label}
            className={cn('gap-0 rounded-sm px-4 py-3 shadow-none', k.wide && 'col-span-2 lg:col-span-1')}
          >
            <p className="text-[13px] text-muted">{k.label}</p>
            <NumberTicker
              value={Number(k.value) || 0}
              formatValue={k.format}
              className={cn(
                'mt-1 text-xl font-semibold tracking-normal sm:text-2xl',
                k.warn ? 'text-[#6e1118]' : 'text-[#1b1917]',
              )}
            />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="gap-0 rounded-sm py-0 shadow-none">
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
                        <span className="block truncate">{o.orderNumber}</span>
                        <span className="block truncate text-[13px] admin-muted">{o.customer?.name}</span>
                      </span>
                      <span className="admin-muted shrink-0 tabular-nums">
                        {formatPrice(o.total)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-sm py-0 shadow-none">
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
                      <span className="min-w-0 truncate">{p.name}</span>
                      <span className="shrink-0 text-[#6e1118]">{p.stock} left</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
