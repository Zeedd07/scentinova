/**
 * Admin order detail - status updates, customer messages, payment, shipping, refund.
 */
import { useCallback, useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import {
  adminFetchOrder,
  adminMarkCodPaid,
  adminPostOrderUpdate,
  adminRefundOrder,
  adminUpdateOrderStatus,
  adminUpdateShipping,
} from '../../services/adminOrderApi'
import { ApiClientError } from '../../services/apiClient'
import AdminModal from '../../components/admin/AdminModal'
import {
  orderStatusBadgeClass,
  orderStatusLabel,
  primaryNextStatus,
} from '../../lib/orderStatus'

const MESSAGE_MAX = 280
const NOTE_MAX = 500

function MessageFields({ message, setMessage, note, setNote, disabled }) {
  const id = useId()
  return (
    <div className="grid gap-3">
      <div>
        <label htmlFor={`${id}-msg`} className="admin-label">
          Message to customer <span className="font-normal">(optional)</span>
        </label>
        <textarea
          id={`${id}-msg`}
          className="admin-input mt-1 min-h-[4.5rem] resize-y"
          maxLength={MESSAGE_MAX}
          placeholder="Shown on the customer's Track Order page"
          value={message}
          disabled={disabled}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="mt-1 text-right text-[12px] admin-muted">
          {message.length}/{MESSAGE_MAX}
        </p>
      </div>
      <div>
        <label htmlFor={`${id}-note`} className="admin-label">
          Internal note <span className="font-normal">(admins only)</span>
        </label>
        <input
          id={`${id}-note`}
          className="admin-input mt-1"
          maxLength={NOTE_MAX}
          value={note}
          disabled={disabled}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  )
}

function StatusPanel({ order, shipping, setShipping, busy, onSubmit }) {
  const allowed = order.allowedNextStatuses || []
  const [target, setTarget] = useState(() => primaryNextStatus(order))
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const selected = allowed.includes(target) ? target : primaryNextStatus(order)

  const editShipping = (patch) => {
    setFormError('')
    setShipping((s) => ({ ...s, ...patch }))
  }

  const send = () =>
    onSubmit({
      status: selected,
      customerMessage: message.trim() || null,
      note: note.trim() || null,
      shipping:
        selected === 'SHIPPED'
          ? {
              carrier: shipping.carrier.trim(),
              trackingNumber: shipping.trackingNumber.trim(),
              trackingUrl: shipping.trackingUrl.trim() || null,
            }
          : undefined,
    }).then((ok) => {
      if (ok) {
        setMessage('')
        setNote('')
        setTarget(null)
      }
    })

  const submit = (e) => {
    e.preventDefault()
    setFormError('')
    if (!selected) return
    if (selected === 'SHIPPED') {
      if (!shipping.carrier.trim() || !shipping.trackingNumber.trim()) {
        setFormError('Carrier and tracking number are required to mark the order shipped.')
        return
      }
      if (shipping.trackingUrl.trim() && !/^https?:\/\/\S+$/i.test(shipping.trackingUrl.trim())) {
        setFormError('Tracking URL must start with http:// or https://')
        return
      }
    }
    if (selected === 'CANCELLED') {
      setConfirmCancel(true)
      return
    }
    send()
  }

  return (
    <section className="admin-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Order status</h3>
        <span className={orderStatusBadgeClass(order.status)}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {allowed.length === 0 ? (
        <p className="mt-3 text-[14px] admin-muted">
          No further status changes for this order. You can still message the customer below.
        </p>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={submit} noValidate>
          <fieldset>
            <legend className="admin-label">Move order to</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {allowed.map((status) => {
                const active = status === selected
                const danger = status === 'CANCELLED'
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    disabled={busy}
                    onClick={() => {
                      setTarget(status)
                      setFormError('')
                    }}
                    className={`admin-btn ${
                      active ? (danger ? 'admin-btn-danger' : 'admin-btn-primary') : 'admin-btn-quiet'
                    }`}
                  >
                    {orderStatusLabel(status)}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {selected === 'SHIPPED' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="admin-input"
                placeholder="Carrier *"
                aria-label="Carrier"
                value={shipping.carrier}
                onChange={(e) => editShipping({ carrier: e.target.value })}
              />
              <input
                className="admin-input"
                placeholder="Tracking number *"
                aria-label="Tracking number"
                value={shipping.trackingNumber}
                onChange={(e) => editShipping({ trackingNumber: e.target.value })}
              />
              <input
                className="admin-input"
                placeholder="Tracking URL"
                aria-label="Tracking URL"
                value={shipping.trackingUrl}
                onChange={(e) => editShipping({ trackingUrl: e.target.value })}
              />
            </div>
          )}

          <MessageFields
            message={message}
            setMessage={setMessage}
            note={note}
            setNote={setNote}
            disabled={busy}
          />

          {formError && (
            <p role="alert" className="text-[14px] text-[#6e1118]">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !selected}
            className={`admin-btn ${selected === 'CANCELLED' ? 'admin-btn-danger' : 'admin-btn-primary'} disabled:opacity-60`}
          >
            {busy ? 'Saving…' : `Update to ${orderStatusLabel(selected)}`}
          </button>
        </form>
      )}

      <AdminModal
        open={confirmCancel}
        tone="danger"
        title={`Cancel ${order.orderNumber}?`}
        message="The customer will see this order as cancelled and reserved stock is released. This cannot be undone."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={async () => {
          setConfirmCancel(false)
          await send()
        }}
      />
    </section>
  )
}

function UpdatePanel({ busy, onSubmit }) {
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!message.trim() && !note.trim()) return
    onSubmit({ customerMessage: message.trim() || null, note: note.trim() || null }).then((ok) => {
      if (ok) {
        setMessage('')
        setNote('')
      }
    })
  }

  return (
    <section className="admin-surface p-4 sm:p-6">
      <h3 className="text-base font-semibold">Message the customer</h3>
      <p className="mt-1 text-[14px] admin-muted">
        Post an update without changing the status, e.g. a delivery delay.
      </p>
      <form className="mt-4 space-y-3" onSubmit={submit} noValidate>
        <MessageFields
          message={message}
          setMessage={setMessage}
          note={note}
          setNote={setNote}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || (!message.trim() && !note.trim())}
          className="admin-btn admin-btn-quiet disabled:opacity-50"
        >
          Post update
        </button>
      </form>
    </section>
  )
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
      return true
    } catch (err) {
      setResultModal({
        tone: 'danger',
        title: 'Action failed',
        message: err instanceof ApiClientError ? err.message : 'Request failed.',
      })
      return false
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

  const total =
    order.pricing?.totalPaise != null
      ? order.pricing.totalPaise / 100
      : order.total
  const isCod = order.paymentMethod === 'COD' || order.payment?.provider === 'cod'
  const payStatus = String(order.payment?.status || order.paymentStatus || '').toUpperCase()
  const canMarkCodPaid =
    isCod && (payStatus === 'PENDING' || payStatus === 'CREATED' || !payStatus)
  const pricing = order.pricing || {}

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/admin/orders" className="admin-link">
            ← Orders
          </Link>
          <h2 className="admin-title mt-2">{order.orderNumber}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 admin-muted text-[15px]">
            <span className={orderStatusBadgeClass(order.status)}>
              {orderStatusLabel(order.status)}
            </span>
            {isCod ? 'COD' : 'Prepaid'} · Payment{' '}
            {order.payment?.status || order.paymentStatus || '-'}
          </p>
        </div>
        <p className="text-2xl font-semibold text-[#1b1917]">{formatPrice(total)}</p>
      </div>

      <StatusPanel
        key={order.status}
        order={order}
        shipping={shipping}
        setShipping={setShipping}
        busy={busy}
        onSubmit={(body) =>
          run(
            () => adminUpdateOrderStatus(id, body),
            `Order marked ${orderStatusLabel(body.status)}. The customer's tracking page now shows it.`,
          )
        }
      />

      <UpdatePanel
        busy={busy}
        onSubmit={(body) =>
          run(
            () => adminPostOrderUpdate(id, body),
            body.customerMessage
              ? 'Update posted. The customer can see it on Track Order.'
              : 'Internal note saved.',
          )
        }
      />

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
            {order.customerSnapshot?.phone || order.customer?.phone || '-'}
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
        <h3 className="text-base font-semibold">Payment & pricing</h3>
        <dl className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="admin-muted">Payment method</dt>
            <dd>{isCod ? 'Cash on Delivery' : 'Prepaid'}</dd>
          </div>
          <div>
            <dt className="admin-muted">Payment status</dt>
            <dd>{order.payment?.status || order.paymentStatus || '-'}</dd>
          </div>
          <div>
            <dt className="admin-muted">Subtotal</dt>
            <dd>
              {formatPrice(
                pricing.subtotalPaise != null
                  ? pricing.subtotalPaise / 100
                  : order.subtotal,
              )}
            </dd>
          </div>
          <div>
            <dt className="admin-muted">Shipping</dt>
            <dd>
              {formatPrice(
                pricing.shippingPaise != null
                  ? pricing.shippingPaise / 100
                  : order.shipping,
              )}
            </dd>
          </div>
          <div>
            <dt className="admin-muted">Convenience fee</dt>
            <dd>
              {formatPrice(
                pricing.convenienceFeePaise != null
                  ? pricing.convenienceFeePaise / 100
                  : order.convenienceFee || 0,
              )}
            </dd>
          </div>
          <div>
            <dt className="admin-muted">COD fee</dt>
            <dd>
              {formatPrice(
                pricing.codFeePaise != null
                  ? pricing.codFeePaise / 100
                  : order.codFee || 0,
              )}
            </dd>
          </div>
          <div>
            <dt className="admin-muted">Discount</dt>
            <dd>
              {formatPrice(
                pricing.discountPaise != null
                  ? pricing.discountPaise / 100
                  : order.discount || 0,
              )}
            </dd>
          </div>
          <div>
            <dt className="admin-muted">Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
          <div>
            <dt className="admin-muted">Razorpay order</dt>
            <dd>{order.payment?.razorpayOrderId || '-'}</dd>
          </div>
          <div>
            <dt className="admin-muted">Payment ID</dt>
            <dd>{order.payment?.razorpayPaymentId || '-'}</dd>
          </div>
          <div>
            <dt className="admin-muted">Captured / received</dt>
            <dd>
              {order.payment?.capturedAt || order.payment?.receivedAt
                ? new Date(
                    order.payment.capturedAt || order.payment.receivedAt,
                  ).toLocaleString()
                : '-'}
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
        <ul className="mt-3 divide-y divide-[#ece5da] text-[14px]">
          {[...(order.statusHistory || [])].reverse().map((h, i) => {
            const changed = h.previousStatus !== h.status
            return (
              <li key={`${h.status}-${h.createdAt}-${i}`} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    {changed ? (
                      <span className={orderStatusBadgeClass(h.status)}>
                        {orderStatusLabel(h.status)}
                      </span>
                    ) : (
                      <span className="font-medium">Update</span>
                    )}
                    <span className="admin-muted text-[13px]">
                      {h.source === 'ADMIN' ? h.changedBy || 'Admin' : h.source?.toLowerCase().replaceAll('_', ' ')}
                    </span>
                  </span>
                  <span className="admin-muted shrink-0 text-[13px]">
                    {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                {h.customerMessage && (
                  <p className="mt-1.5 text-[14px]">
                    <span className="admin-muted">Customer sees: </span>
                    {h.customerMessage}
                  </p>
                )}
                {h.note && (
                  <p className="mt-1 text-[14px] admin-muted">
                    <span>Internal: </span>
                    {h.note}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2">
        {canMarkCodPaid && (
          <button
            type="button"
            disabled={busy}
            className="admin-btn admin-btn-primary"
            onClick={() =>
              run(
                () => adminMarkCodPaid(id, {}),
                'COD payment marked as received.',
              )
            }
          >
            Mark COD Payment Received
          </button>
        )}
        {((order.payment?.status === 'CAPTURED' && !isCod) ||
          (isCod && payStatus === 'PAID')) &&
          order.status !== 'REFUNDED' && (
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
