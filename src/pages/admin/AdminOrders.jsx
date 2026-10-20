/**
 * Admin orders - simple list with a status dropdown on every order.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import OrdersFilter, { ORDER_SORTS } from '../../components/admin/orders/OrdersFilter'
import { formatPrice } from '../../data/products'
import { adminFetchOrders, adminUpdateOrderStatus } from '../../services/adminOrderApi'
import { adminFetchProducts } from '../../services/productApi'
import { ApiClientError } from '../../services/apiClient'
import AdminModal from '../../components/admin/AdminModal'
import ThiingsIcon from '../../components/ThiingsIcon'
import {
  isCodOrder,
  needsTracking,
  orderStatusBadgeClass,
  orderStatusLabel,
  paymentStatusText,
} from '../../lib/orderStatus'

const PAGE_SIZES = [10, 20, 50, 100]

function toggleSort(current, key) {
  const option = ORDER_SORTS.find((sort) => sort.key === key)
  const withoutGroup = current.filter((item) => ORDER_SORTS.find((sort) => sort.key === item)?.group !== option.group)
  if (current.includes(key)) {
    const next = current.filter((item) => item !== key)
    return next.length ? next : ['newest']
  }
  return [...withoutGroup, key]
}

function productGroups(order) {
  const groups = new Map()
  for (const item of order.items || []) {
    const key = String(item.productId || item.slug || item.name || 'item')
    const quantity = item.quantity || 0
    const existing = groups.get(key)
    if (existing) {
      existing.quantity += quantity
      if (!existing.image && item.image) existing.image = item.image
    } else {
      groups.set(key, {
        key,
        name: item.name || 'Order',
        image: item.image || '',
        quantity,
      })
    }
  }
  return [...groups.values()]
}

function placedLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const day = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
  const time = date
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    .replace(/\s?(am|pm)$/i, (part) => part.toUpperCase())
  return `${day} · ${time}`
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [productIds, setProductIds] = useState([])
  const [sorts, setSorts] = useState(['newest'])
  const [products, setProducts] = useState([])
  const [productsError, setProductsError] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [pendingCancel, setPendingCancel] = useState(null)
  const [failure, setFailure] = useState('')
  const requestId = useRef(0)

  useEffect(() => {
    let cancelled = false
    adminFetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list || [])
      })
      .catch((err) => {
        if (!cancelled) {
          setProductsError(err instanceof ApiClientError ? err.message : 'Could not load perfumes.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(q.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const data = await adminFetchOrders({
        status: status || undefined,
        method: method || undefined,
        product: productIds.length ? productIds.join(',') : undefined,
        sort: sorts.join(','),
        q: search || undefined,
        page,
        limit: pageSize,
      })
      if (id !== requestId.current) return
      setOrders(data.orders || [])
      setMeta(data.meta || { page: 1, pages: 1, total: data.orders?.length || 0 })
    } catch (err) {
      if (id !== requestId.current) return
      setError(err instanceof ApiClientError ? err.message : 'Could not load orders.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [status, method, productIds, sorts, search, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  const goToPage = (next) => {
    setPage(Math.min(Math.max(1, next), meta.pages))
    window.scrollTo({ top: 0 })
  }

  const applyStatus = async (order, nextStatus) => {
    setUpdatingId(order.id)
    try {
      const updated = await adminUpdateOrderStatus(order.id, { status: nextStatus })
      setOrders((list) =>
        status && updated.status !== status
          ? list.filter((o) => o.id !== order.id)
          : list.map((o) => (o.id === order.id ? updated : o)),
      )
    } catch (err) {
      setFailure(err instanceof ApiClientError ? err.message : 'Could not update the order.')
    } finally {
      setUpdatingId(null)
    }
  }

  const choose = (order, nextStatus) => {
    if (!nextStatus) return
    if (needsTracking(order, nextStatus)) {
      navigate(`/admin/orders/${order.id}`, { state: { target: nextStatus } })
    } else if (nextStatus === 'CANCELLED') {
      setPendingCancel(order)
    } else {
      applyStatus(order, nextStatus)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="admin-title">Orders</h2>
        <p className="mt-1 max-w-xl text-[15px] admin-muted">
          Change an order&apos;s status from the dropdown. Customers see it on their Track Order page.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <OrdersFilter
          status={status}
          method={method}
          productIds={productIds}
          sorts={sorts}
          products={products}
          productsError={productsError}
          disabled={loading && orders.length === 0}
          onStatus={(value) => {
            setStatus(value)
            setPage(1)
          }}
          onMethod={(value) => {
            setMethod(value)
            setPage(1)
          }}
          onToggleProduct={(id) => {
            setProductIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
            setPage(1)
          }}
          onToggleSort={(key) => {
            setSorts((current) => toggleSort(current, key))
            setPage(1)
          }}
          onClear={() => {
            setStatus('')
            setMethod('')
            setProductIds([])
            setSorts(['newest'])
            setPage(1)
          }}
        />
        <Input
          type="search"
          className="sm:max-w-md"
          placeholder="Search order no., name, email or phone"
          aria-label="Search orders"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-[#6e1118]">
          <p>{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      )}
      {loading && orders.length === 0 ? (
        <p className="admin-muted">Loading orders…</p>
      ) : !error && orders.length === 0 ? (
        <p className="rounded-md border border-dashed border-stone px-4 py-10 text-center text-[14px] admin-muted">
          No orders{status || search ? ' match these filters' : ' yet'}.
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const options = o.allowedNextStatuses || []
            const updating = updatingId === o.id
            const customer = o.customerSnapshot || o.customer || {}
            const total = o.pricing?.totalPaise != null ? o.pricing.totalPaise / 100 : o.total
            const lines = productGroups(o)
            return (
              <li key={o.id} className="admin-surface p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <Link to={`/admin/orders/${o.id}`} className="group min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f3eee4]">
                        <ThiingsIcon name="customer" alt="" className="size-8" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-[#1b1917] group-hover:underline">
                          {customer.name || 'Customer'}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#6b645b]">
                          {customer.phone && (
                            <span className="inline-flex items-center gap-1">
                              <ThiingsIcon name="smartphone" alt="" className="size-5" />
                              {customer.phone}
                            </span>
                          )}
                          {customer.phone && o.shippingAddress?.city && <span aria-hidden>·</span>}
                          {o.shippingAddress?.city && (
                            <span className="inline-flex items-center gap-1">
                              <ThiingsIcon name="map-pin" alt="" className="size-5" />
                              {o.shippingAddress.city}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-start gap-6">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-[#1b1917]">#{o.orderNumber}</p>
                        <p className="mt-0.5 text-[13px] text-[#6b645b]">{placedLabel(o.createdAt)}</p>
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {(lines.length ? lines : [{ key: 'empty', name: 'Order', image: '', quantity: 0 }]).map((item) => (
                          <div
                            key={item.key}
                            className="flex min-w-0 items-center gap-2.5 rounded-lg border border-[#e6dfd2] bg-[#faf7f2] px-2 py-1.5"
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="size-10 shrink-0 rounded-md bg-[#f3eee4] object-cover"
                              />
                            ) : (
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f3eee4]">
                                <ThiingsIcon name="shopping-bag" alt="" className="size-8" />
                              </span>
                            )}
                            <div className="min-w-0 max-w-[9rem]">
                              <p className="truncate text-[14px] font-medium text-[#1b1917]">{item.name}</p>
                              <p className="text-[12px] text-[#6b645b]">
                                {item.quantity} {item.quantity === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-col gap-2 border-t border-[#ebe4d6] pt-3 sm:items-end sm:border-0 sm:pt-0 sm:text-right">
                    <div className="flex items-baseline justify-between gap-3 sm:flex-col sm:items-end sm:gap-0">
                      <p className="text-lg font-semibold text-[#1b1917]">{formatPrice(total)}</p>
                      <p className="text-[13px] admin-muted">
                        {isCodOrder(o) ? 'COD' : 'Prepaid'} · {paymentStatusText(o)}
                      </p>
                    </div>
                    {options.length ? (
                      <Select
                        value=""
                        disabled={updatingId != null}
                        onValueChange={(v) => choose(o, v)}
                      >
                        <SelectTrigger
                          className="w-full sm:w-auto sm:min-w-[11rem]"
                          aria-label={`Status of ${o.orderNumber}`}
                          aria-busy={updating}
                        >
                          <SelectValue placeholder={updating ? 'Updating…' : orderStatusLabel(o.status)} />
                        </SelectTrigger>
                        <SelectContent position="popper" align="end">
                          {options.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s === 'CANCELLED' ? 'Cancel order' : `Mark ${orderStatusLabel(s)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={orderStatusBadgeClass(o.status)}>{orderStatusLabel(o.status)}</span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <nav
        aria-label="Order pages"
        className="flex flex-wrap items-center justify-between gap-3 text-[14px] admin-muted"
      >
        <p aria-live="polite">
          {loading && orders.length === 0
            ? 'Loading orders…'
            : meta.total === 0
              ? '0 orders'
              : `${((meta.page - 1) * (meta.limit || pageSize) + 1).toLocaleString('en-IN')}–${Math.min(
                  meta.page * (meta.limit || pageSize),
                  meta.total,
                ).toLocaleString('en-IN')} of ${meta.total.toLocaleString('en-IN')}`}
          {loading && orders.length > 0 ? ' · updating…' : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span>Per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[4.75rem]" aria-label="Orders per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <span className="tabular-nums">
            {meta.page} / {meta.pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || page >= meta.pages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </nav>

      <AdminModal
        open={Boolean(pendingCancel)}
        tone="danger"
        title={pendingCancel ? `Cancel ${pendingCancel.orderNumber}?` : ''}
        message="The customer will see this order as cancelled and reserved stock is released. This cannot be undone."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        onCancel={() => setPendingCancel(null)}
        onConfirm={async () => {
          const order = pendingCancel
          setPendingCancel(null)
          await applyStatus(order, 'CANCELLED')
        }}
      />

      <AdminModal
        open={Boolean(failure)}
        tone="danger"
        title="Status not updated"
        message={failure}
        onClose={() => setFailure('')}
      />
    </div>
  )
}
