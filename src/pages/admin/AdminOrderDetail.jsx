/**
 * Admin order detail - one status dropdown, then everything about the order at a glance.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import {
  adminFetchOrder,
  adminMarkCodPaid,
  adminRefundOrder,
  adminUpdateOrderStatus,
  adminUpdateShipping,
} from '../../services/adminOrderApi'
import { ApiClientError } from '../../services/apiClient'
import AdminModal from '../../components/admin/AdminModal'
import ShippingLabel from '../../components/admin/ShippingLabel'
import { shipperAddressReady } from '../../config/shipper'
import { canPrintLabel, downloadLabelPdf, labelFileName, printLabel } from '../../lib/shippingLabel'
import {
  formatDateTime,
  isCodOrder,
  needsTracking,
  orderStatusBadgeClass,
  orderStatusLabel,
  paymentStatusText,
} from '../../lib/orderStatus'

const URL_PATTERN = /^https?:\/\/\S+$/i

const rupees = (paise, fallback = 0) => formatPrice(paise != null ? paise / 100 : fallback || 0)

function Card({ title, action, children }) {
  return (
    <section className="admin-surface p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#1b1917]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-1.5 text-[15px]">
      <dt className="admin-muted">{label}</dt>
      <dd className="min-w-0 break-words text-[#1b1917]">{children || '—'}</dd>
    </div>
  )
}

function TrackingFields({ value, onChange, disabled }) {
  const set = (patch) => onChange({ ...value, ...patch })
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block">
        <span className="admin-label">Courier *</span>
        <input
          className="admin-input mt-1"
          placeholder="e.g. Delhivery"
          value={value.carrier}
          disabled={disabled}
          onChange={(e) => set({ carrier: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="admin-label">Tracking number *</span>
        <input
          className="admin-input mt-1"
          value={value.trackingNumber}
          disabled={disabled}
          onChange={(e) => set({ trackingNumber: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="admin-label">Tracking link</span>
        <input
          className="admin-input mt-1"
          placeholder="https://…"
          value={value.trackingUrl}
          disabled={disabled}
          onChange={(e) => set({ trackingUrl: e.target.value })}
        />
      </label>
    </div>
  )
}

function trackingError({ carrier, trackingNumber, trackingUrl }) {
  if (!carrier.trim() || !trackingNumber.trim()) return 'Enter the courier and tracking number.'
  if (trackingUrl.trim() && !URL_PATTERN.test(trackingUrl.trim())) {
    return 'Tracking link must start with http:// or https://'
  }
  return ''
}

const cleanTracking = (t) => ({
  carrier: t.carrier.trim(),
  trackingNumber: t.trackingNumber.trim(),
  trackingUrl: t.trackingUrl.trim() || null,
})

function StatusCard({ order, initialTarget, busy, onStatus }) {
  const options = order.allowedNextStatuses || []
  const [target, setTarget] = useState(options.includes(initialTarget) ? initialTarget : '')
  const [tracking, setTracking] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' })
  const [error, setError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const askTracking = needsTracking(order, target)

  const send = () =>
    onStatus({
      status: target,
      shipping: askTracking ? cleanTracking(tracking) : undefined,
    })

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!target) return
    if (askTracking) {
      const problem = trackingError(tracking)
      if (problem) {
        setError(problem)
        return
      }
    }
    if (target === 'CANCELLED') {
      setConfirmCancel(true)
      return
    }
    send()
  }

  return (
    <Card title="Update status">
      <form className="space-y-4" onSubmit={submit} noValidate>
        <label className="block">
          <span className="admin-label">Order status</span>
          <select
            className="admin-input mt-1"
            value={target}
            disabled={busy}
            onChange={(e) => {
              setTarget(e.target.value)
              setError('')
            }}
          >
            <option value="">{orderStatusLabel(order.status)} (current)</option>
            {options.map((s) => (
              <option key={s} value={s}>
                {s === 'CANCELLED' ? 'Cancel order' : orderStatusLabel(s)}
              </option>
            ))}
          </select>
          {options.length === 0 && (
            <span className="mt-1 block text-[13px] admin-muted">
              This order can&apos;t move to another status.
            </span>
          )}
        </label>

        {askTracking && <TrackingFields value={tracking} onChange={setTracking} disabled={busy} />}

        {error && (
          <p role="alert" className="text-[14px] text-[#6e1118]">
            {error}
          </p>
        )}

        {options.length > 0 && (
          <button
            type="submit"
            disabled={busy || !target}
            className={`admin-btn ${target === 'CANCELLED' ? 'admin-btn-danger' : 'admin-btn-primary'} disabled:opacity-50`}
          >
            {busy
              ? 'Saving…'
              : target === 'CANCELLED'
                ? 'Cancel order'
                : target
                  ? `Update to ${orderStatusLabel(target)}`
                  : 'Update status'}
          </button>
        )}
      </form>

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
    </Card>
  )
}

function ShipmentCard({ order, busy, onSave }) {
  const f = order.fulfillment || {}
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState({
    carrier: f.carrier || '',
    trackingNumber: f.trackingNumber || '',
    trackingUrl: f.trackingUrl || '',
  })
  const [error, setError] = useState('')

  const save = async () => {
    const problem = trackingError(value)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    if (await onSave(cleanTracking(value))) setEditing(false)
  }

  return (
    <Card
      title="Shipment"
      action={
        !editing && (
          <button type="button" className="admin-link text-[14px]" onClick={() => setEditing(true)}>
            Edit
          </button>
        )
      }
    >
      {editing ? (
        <div className="space-y-3">
          <TrackingFields value={value} onChange={setValue} disabled={busy} />
          {error && (
            <p role="alert" className="text-[14px] text-[#6e1118]">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={busy} className="admin-btn admin-btn-primary" onClick={save}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" disabled={busy} className="admin-btn admin-btn-quiet" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <dl>
          <Row label="Courier">{f.carrier}</Row>
          <Row label="Tracking no.">{f.trackingNumber}</Row>
          <Row label="Tracking link">
            {f.trackingUrl && (
              <a href={f.trackingUrl} target="_blank" rel="noopener noreferrer" className="admin-link">
                Open tracking
              </a>
            )}
          </Row>
          <Row label="Shipped on">{f.shippedAt && formatDateTime(f.shippedAt)}</Row>
          <Row label="Delivered on">{f.deliveredAt && formatDateTime(f.deliveredAt)}</Row>
        </dl>
      )}
    </Card>
  )
}

function LabelCard({ order }) {
  const svgRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const hasTracking = Boolean(order.fulfillment?.trackingNumber)

  const download = async () => {
    setDownloading(true)
    setError('')
    try {
      await downloadLabelPdf(svgRef.current, labelFileName(order))
    } catch {
      setError('Could not create the PDF. Try Print instead.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card title="Shipping label">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="w-full max-w-[15rem] shrink-0 border border-[#e2dbcf] bg-white shadow-sm">
          <ShippingLabel ref={svgRef} order={order} className="block h-auto w-full" />
        </div>
        <div className="space-y-3 text-[14px]">
          <p className="admin-muted">4 × 6 inch label. Print it and stick it on the parcel.</p>
          {!hasTracking && (
            <p className="text-[#7a5a1e]">
              No tracking number yet, so the barcode shows the order number. Add the courier&apos;s AWB
              when you ship and the label will use it.
            </p>
          )}
          {!shipperAddressReady() && (
            <p className="text-[#7a5a1e]">
              Your return address isn&apos;t set, so the From section only shows the brand name. Add it
              in <code>src/config/shipper.js</code>.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-btn admin-btn-primary disabled:opacity-60"
              disabled={downloading}
              aria-busy={downloading}
              onClick={download}
            >
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
            <button type="button" className="admin-btn admin-btn-quiet" onClick={() => printLabel(svgRef.current)}>
              Print
            </button>
          </div>
          {error && <p className="text-[#6e1118]">{error}</p>}
        </div>
      </div>
    </Card>
  )
}

function historySource(h) {
  if (h.source === 'ADMIN') return h.changedBy || 'Admin'
  if (h.source === 'RAZORPAY_WEBHOOK') return 'Razorpay'
  if (h.source === 'CUSTOMER') return 'Customer'
  return 'System'
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [resultModal, setResultModal] = useState(null)
  const [confirmRefund, setConfirmRefund] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setOrder(await adminFetchOrder(id))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load order.')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn, successMessage) => {
    setBusy(true)
    try {
      setOrder(await fn())
      setResultModal({ tone: 'success', title: 'Saved', message: successMessage })
      return true
    } catch (err) {
      setResultModal({
        tone: 'danger',
        title: 'Not saved',
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

  const cod = isCodOrder(order)
  const pricing = order.pricing || {}
  const total = pricing.totalPaise != null ? pricing.totalPaise / 100 : order.total
  const payStatus = String(order.payment?.status || order.paymentStatus || '').toUpperCase()
  const paid = payStatus === 'PAID' || payStatus === 'CAPTURED'
  const canMarkCodPaid = cod && (payStatus === 'PENDING' || payStatus === 'CREATED' || !payStatus)
  const canRefund = paid && order.status !== 'REFUNDED' && order.status !== 'REFUND_PENDING'
  const customer = order.customerSnapshot || order.customer || {}
  const addr = order.shippingAddress || {}
  const f = order.fulfillment || {}
  const hasShipment = Boolean(f.carrier || f.trackingNumber || f.shippedAt || f.deliveredAt)
  const itemCount = (order.items || []).reduce((n, i) => n + (i.quantity || 0), 0)

  const bill = [
    ['Subtotal', pricing.subtotalPaise, order.subtotal, true],
    ['Shipping', pricing.shippingPaise, order.shipping, true],
    ['Convenience fee', pricing.convenienceFeePaise, order.convenienceFee],
    ['COD fee', pricing.codFeePaise, order.codFee],
    ['Discount', pricing.discountPaise, order.discount],
  ].filter(([, paise, legacy, always]) => always || (paise ?? legacy ?? 0) > 0)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/admin/orders" className="admin-link">
        ← Orders
      </Link>

      <header className="admin-surface flex flex-wrap items-start justify-between gap-4 p-4 sm:p-6">
        <div className="min-w-0">
          <h2 className="admin-title break-all">{order.orderNumber}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] admin-muted">
            <span className={orderStatusBadgeClass(order.status)}>{orderStatusLabel(order.status)}</span>
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-[#1b1917]">{formatPrice(total)}</p>
          <p className="mt-1 text-[14px] admin-muted">
            {cod ? 'Cash on Delivery' : 'Prepaid'} · {paymentStatusText(order)}
          </p>
        </div>
      </header>

      <StatusCard
        key={`${order.status}-${order.updatedAt}`}
        order={order}
        initialTarget={location.state?.target}
        busy={busy}
        onStatus={(body) =>
          run(
            () => adminUpdateOrderStatus(id, body),
            `Order is now ${orderStatusLabel(body.status)}. The customer's tracking page shows it.`,
          )
        }
      />

      {canPrintLabel(order) && <LabelCard order={order} />}

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Customer">
          <dl>
            <Row label="Name">{customer.name}</Row>
            <Row label="Phone">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="admin-link">
                  {customer.phone}
                </a>
              )}
            </Row>
            <Row label="Email">
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="admin-link break-all">
                  {customer.email}
                </a>
              )}
            </Row>
            {order.customerNote && <Row label="Customer note">{order.customerNote}</Row>}
          </dl>
        </Card>

        <Card title="Delivery address">
          <dl>
            <Row label="Deliver to">{addr.fullName || customer.name}</Row>
            <Row label="Phone">{addr.phone || customer.phone}</Row>
            <Row label="Address">
              {[addr.addressLine1 || addr.line1, addr.addressLine2 || addr.line2].filter(Boolean).join(', ')}
            </Row>
            {addr.landmark && <Row label="Landmark">{addr.landmark}</Row>}
            <Row label="City">{addr.city}</Row>
            <Row label="State">{addr.state}</Row>
            <Row label="PIN code">{addr.postalCode}</Row>
            <Row label="Country">{addr.country || 'India'}</Row>
          </dl>
        </Card>
      </div>

      <Card title={`Items (${itemCount})`}>
        <ul className="divide-y divide-[#ece5da]">
          {order.items?.map((item, i) => {
            const unit = item.unitPricePaise != null ? item.unitPricePaise / 100 : item.unitPrice
            return (
              <li key={`${item.slug}-${i}`} className="flex items-center gap-3 py-3 first:pt-0">
                {item.image ? (
                  <img src={item.image} alt="" className="h-14 w-14 shrink-0 border border-[#ebe4d6] bg-[#f3eee4] object-contain" />
                ) : (
                  <span className="h-14 w-14 shrink-0 border border-[#ebe4d6] bg-[#f3eee4]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#1b1917]">{item.name}</p>
                  <p className="text-[13px] admin-muted">
                    {[item.size, item.concentration].filter(Boolean).join(' · ')}
                    {unit != null && ` · ${formatPrice(unit)} × ${item.quantity}`}
                  </p>
                </div>
                <p className="shrink-0 text-[15px]">{rupees(item.totalPaise, item.lineTotal)}</p>
              </li>
            )
          })}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-[#ece5da] pt-3 text-[15px]">
          {bill.map(([label, paise, legacy]) => (
            <div key={label} className="flex justify-between">
              <dt className="admin-muted">{label}</dt>
              <dd>
                {label === 'Discount' ? '− ' : ''}
                {rupees(paise, legacy)}
              </dd>
            </div>
          ))}
          <div className="flex justify-between pt-1 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Payment">
        <dl>
          <Row label="Method">{cod ? 'Cash on Delivery' : 'Prepaid (Razorpay)'}</Row>
          <Row label="Status">{paymentStatusText(order)}</Row>
          <Row label="Amount">{formatPrice(total)}</Row>
          <Row label={cod ? 'Received on' : 'Paid on'}>
            {(order.payment?.capturedAt || order.payment?.receivedAt) &&
              formatDateTime(order.payment.capturedAt || order.payment.receivedAt)}
          </Row>
          {!cod && <Row label="Payment ID">{order.payment?.razorpayPaymentId}</Row>}
          {!cod && <Row label="Razorpay order">{order.payment?.razorpayOrderId}</Row>}
        </dl>
        {(canMarkCodPaid || canRefund) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {canMarkCodPaid && (
              <button
                type="button"
                disabled={busy}
                className="admin-btn admin-btn-primary"
                onClick={() => run(() => adminMarkCodPaid(id, {}), 'Cash payment marked as received.')}
              >
                Mark cash received
              </button>
            )}
            {canRefund && (
              <button
                type="button"
                disabled={busy}
                className="admin-btn admin-btn-quiet text-[#6e1118]"
                onClick={() => setConfirmRefund(true)}
              >
                Refund
              </button>
            )}
          </div>
        )}
      </Card>

      {hasShipment && <ShipmentCard key={order.updatedAt} order={order} busy={busy} onSave={(body) => run(() => adminUpdateShipping(id, body), 'Shipment details saved.')} />}

      <Card title="History">
        <ul className="divide-y divide-[#ece5da] text-[14px]">
          {[...(order.statusHistory || [])].reverse().map((h, i) => {
            const changed = h.previousStatus !== h.status
            return (
              <li key={`${h.status}-${h.createdAt}-${i}`} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    {changed ? (
                      <span className={orderStatusBadgeClass(h.status)}>{orderStatusLabel(h.status)}</span>
                    ) : (
                      <span className="font-medium">Update</span>
                    )}
                    <span className="text-[13px] admin-muted">by {historySource(h)}</span>
                  </span>
                  <span className="shrink-0 text-[13px] admin-muted">{formatDateTime(h.createdAt)}</span>
                </div>
                {h.customerMessage && (
                  <p className="mt-1.5">
                    <span className="admin-muted">Customer sees: </span>
                    {h.customerMessage}
                  </p>
                )}
                {h.note && <p className="mt-1 admin-muted">Note: {h.note}</p>}
              </li>
            )
          })}
        </ul>
      </Card>

      <AdminModal
        open={confirmRefund}
        tone="danger"
        title={`Refund ${order.orderNumber}?`}
        message={
          cod
            ? `This records a refund of ${formatPrice(total)} for this cash order.`
            : `This refunds ${formatPrice(total)} to the customer through Razorpay.`
        }
        confirmLabel="Refund"
        onCancel={() => setConfirmRefund(false)}
        onConfirm={async () => {
          setConfirmRefund(false)
          await run(() => adminRefundOrder(id, {}), 'Refund started.')
        }}
      />

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
