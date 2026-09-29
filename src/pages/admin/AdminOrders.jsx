/**
 * Admin orders - simple list with a status dropdown on every order.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { adminFetchOrders, adminUpdateOrderStatus } from '../../services/adminOrderApi'
import { ApiClientError } from '../../services/apiClient'
import AdminModal from '../../components/admin/AdminModal'
import {
  formatDateTime,
  isCodOrder,
  needsTracking,
  orderStatusBadgeClass,
  orderStatusLabel,
  paymentStatusText,
} from '../../lib/orderStatus'

const FILTERS = [
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
  'REFUNDED',
]

function itemSummary(order) {
  const items = order.items || []
  const count = items.reduce((n, i) => n + (i.quantity || 0), 0)
  const names = items.map((i) => i.name).filter(Boolean)
  const label = names.length > 1 ? `${names[0]} + ${names.length - 1} more` : names[0] || ''
  return `${count} ${count === 1 ? 'item' : 'items'}${label ? ` · ${label}` : ''}`
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [pendingCancel, setPendingCancel] = useState(null)
  const [failure, setFailure] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetchOrders({
        status: status || undefined,
        q: q.trim() || undefined,
      })
      setOrders(data.orders || [])
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }, [status, q])

  useEffect(() => {
    load()
  }, [load])

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

      <div className="grid max-w-2xl gap-3 sm:grid-cols-[13rem_1fr]">
        <select
          className="admin-input"
          value={status}
          aria-label="Filter by status"
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All orders</option>
          {FILTERS.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s)}
            </option>
          ))}
        </select>
        <input
          type="search"
          className="admin-input"
          placeholder="Search order no., name, email or phone"
          aria-label="Search orders"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="text-[#6e1118]">{error}</p>}
      {loading ? (
        <p className="admin-muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="border border-dashed border-stone px-4 py-10 text-center text-[14px] admin-muted">
          No orders{status || q.trim() ? ' match these filters' : ' yet'}.
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const options = o.allowedNextStatuses || []
            const updating = updatingId === o.id
            const customer = o.customerSnapshot || o.customer || {}
            const total = o.pricing?.totalPaise != null ? o.pricing.totalPaise / 100 : o.total
            return (
              <li key={o.id} className="admin-surface p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <Link to={`/admin/orders/${o.id}`} className="group min-w-0 flex-1">
                    <p className="text-base font-semibold text-[#1b1917] group-hover:underline">
                      {customer.name || 'Customer'}
                    </p>
                    <p className="mt-0.5 text-[14px] admin-muted">
                      {[customer.phone, o.shippingAddress?.city].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-2 text-[13px] admin-muted">
                      {o.orderNumber} · {formatDateTime(o.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[13px] admin-muted">{itemSummary(o)}</p>
                  </Link>

                  <div className="flex flex-col items-end gap-2 text-right">
                    <p className="text-lg font-semibold text-[#1b1917]">{formatPrice(total)}</p>
                    <p className="text-[13px] admin-muted">
                      {isCodOrder(o) ? 'COD' : 'Prepaid'} · {paymentStatusText(o)}
                    </p>
                    {options.length ? (
                      <select
                        className="admin-input w-auto min-w-[11rem] py-1.5 text-[14px]"
                        aria-label={`Status of ${o.orderNumber}`}
                        value=""
                        disabled={updatingId != null}
                        aria-busy={updating}
                        onChange={(e) => choose(o, e.target.value)}
                      >
                        <option value="">
                          {updating ? 'Updating…' : orderStatusLabel(o.status)}
                        </option>
                        {options.map((s) => (
                          <option key={s} value={s}>
                            {s === 'CANCELLED' ? 'Cancel order' : `Mark ${orderStatusLabel(s)}`}
                          </option>
                        ))}
                      </select>
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
