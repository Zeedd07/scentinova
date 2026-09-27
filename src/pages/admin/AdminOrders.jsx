/**
 * Admin orders - list with filters and a one-click next status step.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { adminFetchOrders, adminUpdateOrderStatus } from '../../services/adminOrderApi'
import { ApiClientError } from '../../services/apiClient'
import AdminModal from '../../components/admin/AdminModal'
import {
  orderStatusBadgeClass,
  orderStatusLabel,
  primaryNextStatus,
} from '../../lib/orderStatus'

const FILTERS = [
  '',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PAYMENT_FAILED',
]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [failure, setFailure] = useState('')

  const advance = async (order, nextStatus) => {
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
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Could not load orders.',
      )
    } finally {
      setLoading(false)
    }
  }, [status, q])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="admin-title">Orders</h2>
        <p className="mt-1 max-w-xl text-[15px] admin-muted">
          Storefront orders. Status changes show up on the customer&apos;s Track Order page.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className="admin-input w-auto min-w-[12rem]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {FILTERS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s)}
            </option>
          ))}
        </select>
        <input
          className="admin-input max-w-sm"
          placeholder="Search order / email / tracking"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className="admin-btn admin-btn-quiet" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <p className="text-[#6e1118]">{error}</p>}
      {loading ? (
        <p className="admin-muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="admin-muted">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const next = primaryNextStatus(o)
            const updating = updatingId === o.id
            return (
              <li key={o.id} className="admin-surface p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[#1b1917]">
                      {o.customerSnapshot?.name || o.customer?.name}
                    </p>
                    <p className="mt-1 text-[15px] admin-muted">
                      {o.customerSnapshot?.email || o.customer?.email}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] admin-muted">
                      <span className={orderStatusBadgeClass(o.status)}>
                        {orderStatusLabel(o.status)}
                      </span>
                      {o.orderNumber} · {new Date(o.createdAt).toLocaleString()}
                    </p>
                    {next && (
                      <div className="mt-3">
                        {next === 'SHIPPED' ? (
                          <Link
                            to={`/admin/orders/${o.id}`}
                            className="admin-btn admin-btn-quiet inline-flex"
                          >
                            Add tracking &amp; ship →
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingId != null}
                            aria-busy={updating}
                            onClick={() => advance(o, next)}
                            className="admin-btn admin-btn-quiet disabled:opacity-60"
                          >
                            {updating ? 'Updating…' : `Mark ${orderStatusLabel(next)}`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[#1b1917]">
                      {formatPrice(
                        o.pricing?.totalPaise != null
                          ? o.pricing.totalPaise / 100
                          : o.total,
                      )}
                    </p>
                    <p className="mt-1 text-[13px] admin-muted">
                      {o.payment?.status || o.paymentStatus || '-'}
                    </p>
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="admin-link mt-2 inline-block"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

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
