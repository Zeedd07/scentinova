/**
 * Admin order detail — payment, timeline, shipping, refund.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import {
  adminFetchOrder,
  adminRefundOrder,
  adminUpdateOrderStatus,
  adminUpdateShipping,
} from '../../services/adminOrderApi'
import { ApiClientError } from '../../services/apiClient'
import AdminModal from '../../components/admin/AdminModal'

const NEXT_ACTIONS = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  REFUND_PENDING: [],
  REFUNDED: [],
  PENDING_PAYMENT: ['CANCELLED'],
  PAYMENT_FAILED: ['CANCELLED'],
  PAYMENT_EXPIRED: ['CANCELLED'],
  CANCELLED: [],
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [shipping, setShipping] = useState({
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
  })
  const [resultModal, setResultModal] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await adminFetchOrder(id)
      setOrder(data)
      setShipping({
        carrier: data.fulfillment?.carrier || '',
        trackingNumber: data.fulfillment?.trackingNumber || '',
        trackingUrl: data.fulfillment?.trackingUrl || '',
      })
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Could not load order.',
      )
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn, successMessage) => {
    setBusy(true)
    try {
      const updated = await fn()
      setOrder(updated)
      setResultModal({
        tone: 'success',
        title: 'Updated',
        message: successMessage,
      })
    } catch (err) {
      setResultModal({
        tone: 'danger',
        title: 'Action failed',
        message: err instanceof ApiClientError ? err.message : 'Request failed.',
      })
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <div>
        <p className="admin-muted">{error}</p>
        <Link to="/admin/orders" className="admin-link mt-3 inline-block">
          ← Orders
        </Link>
      </div>
    )
  }

  if (!order) return <p className="admin-muted">Loading order…</p>

  const actions = NEXT_ACTIONS[order.status] || []
  const total =
    order.pricing?.totalPaise != null
      ? order.pricing.totalPaise / 100
      : order.total

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/admin/orders" className="admin-link">
            ← Orders
          </Link>
          <h2 className="admin-title mt-2">{order.orderNumber}</h2>
          <p className="mt-1 admin-muted text-[15px]">
            {order.status} · Payment {order.payment?.status || order.paymentStatus || '—'}
          </p>
        </div>
        <p className="text-2xl font-semibold text-[#1b1917]">{formatPrice(total)}</p>
      </div>

      <section className="admin-surface grid gap-6 p-4 sm:grid-cols-2 sm:p-6">
        <div>
          <h3 className="text-base font-semibold">Customer</h3>
          <p className="mt-2 text-[15px]">
            {order.customerSnapshot?.name || order.customer?.name}
          </p>
          <p className="admin-muted text-[14px]">
            {order.customerSnapshot?.email || order.customer?.email}
          </p>
          <p className="admin-muted text-[14px]">
            {order.customerSnapshot?.phone || order.customer?.phone || '—'}
          </p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Shipping</h3>
          <p className="mt-2 text-[15px]">
            {order.shippingAddress?.fullName || order.customerSnapshot?.name}
          </p>
          <p className="admin-muted text-[14px]">
            {order.shippingAddress?.addressLine1 || order.shippingAddress?.line1}
          </p>
          <p className="admin-muted text-[14px]">
            {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postalCode]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      </section>

      <section className="admin-surface p-4 sm:p-6">
        <h3 className="text-base font-semibold">Items</h3>
        <ul className="mt-3 space-y-2">
          {order.items?.map((item, i) => (
            <li key={`${item.slug}-${i}`} className="flex justify-between text-[15px]">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>
                {formatPrice(
                  item.totalPaise != null ? item.totalPaise / 100 : item.lineTotal,
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-surface p-4 sm:p-6">
        <h3 className="text-base font-semibold">Payment</h3>
        <dl className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="admin-muted">Razorpay order</dt>
            <dd>{order.payment?.razorpayOrderId || '—'}</dd>
          </div>
          <div>
            <dt className="admin-muted">Payment ID</dt>
            <dd>{order.payment?.razorpayPaymentId || '—'}</dd>
          </div>
          <div>
            <dt className="admin-muted">Method</dt>
            <dd>{order.payment?.method || '—'}</dd>
          </div>
          <div>
            <dt className="admin-muted">Captured</dt>
            <dd>
              {order.payment?.capturedAt
                ? new Date(order.payment.capturedAt).toLocaleString()
                : '—'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="admin-surface space-y-3 p-4 sm:p-6">
        <h3 className="text-base font-semibold">Shipment</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="admin-input"
            placeholder="Carrier"
            value={shipping.carrier}
            onChange={(e) => setShipping((s) => ({ ...s, carrier: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Tracking number"
            value={shipping.trackingNumber}
            onChange={(e) =>
              setShipping((s) => ({ ...s, trackingNumber: e.target.value }))
            }
          />
          <input
            className="admin-input"
            placeholder="Tracking URL"
            value={shipping.trackingUrl}
            onChange={(e) =>
              setShipping((s) => ({ ...s, trackingUrl: e.target.value }))
            }
          />
        </div>
        <button
          type="button"
          disabled={busy}
          className="admin-btn admin-btn-quiet"
          onClick={() =>
            run(
              () => adminUpdateShipping(id, shipping),
              'Shipping details saved.',
            )
          }
        >
          Save shipping
        </button>
      </section>

      <section className="admin-surface p-4 sm:p-6">
        <h3 className="text-base font-semibold">Timeline</h3>
        <ul className="mt-3 space-y-2 text-[14px]">
          {(order.statusHistory || []).map((h, i) => (
            <li key={`${h.status}-${i}`} className="flex justify-between gap-3">
              <span>
                {h.status}
                {h.note ? ` — ${h.note}` : ''}
              </span>
              <span className="admin-muted shrink-0">
                {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2">
        {actions.map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy}
            className="admin-btn admin-btn-primary"
            onClick={() =>
              run(
                () =>
                  adminUpdateOrderStatus(id, {
                    status,
                    shipping:
                      status === 'SHIPPED'
                        ? {
                            carrier: shipping.carrier,
                            trackingNumber: shipping.trackingNumber,
                            trackingUrl: shipping.trackingUrl || null,
                          }
                        : undefined,
                  }),
                `Marked ${status}.`,
              )
            }
          >
            Mark {status.replaceAll('_', ' ')}
          </button>
        ))}
        {order.payment?.status === 'CAPTURED' && order.status !== 'REFUNDED' && (
          <button
            type="button"
            disabled={busy}
            className="admin-btn admin-btn-quiet text-[#6e1118]"
            onClick={() =>
              run(() => adminRefundOrder(id, {}), 'Refund initiated.')
            }
          >
            Refund
          </button>
        )}
      </section>

      <AdminModal
        open={Boolean(resultModal)}
        title={resultModal?.title}
        message={resultModal?.message}
        tone={resultModal?.tone}
        onClose={() => setResultModal(null)}
      />
    </div>
  )
}
