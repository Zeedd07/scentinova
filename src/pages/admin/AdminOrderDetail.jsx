/**
 * Admin order detail - one status dropdown, then everything about the order at a glance.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Field from '../../components/admin/ui/Field'
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

const KEEP_STATUS = '__current__'

function Panel({ title, action, children }) {
  return (
    <Card className="gap-0 p-4 sm:p-6">
      <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#1b1917]">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-1.5 text-[15px] sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <dt className="admin-muted">{label}</dt>
      <dd className="min-w-0 break-words text-[#1b1917]">{children || '—'}</dd>
    </div>
  )
}

function TrackingFields({ value, onChange, disabled }) {
  const set = (patch) => onChange({ ...value, ...patch })
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Courier *">
        <Input
          placeholder="e.g. Delhivery"
          value={value.carrier}
          disabled={disabled}
          onChange={(e) => set({ carrier: e.target.value })}
        />
      </Field>
      <Field label="Tracking number *">
        <Input
          value={value.trackingNumber}
          disabled={disabled}
          onChange={(e) => set({ trackingNumber: e.target.value })}
        />
      </Field>
      <Field label="Tracking link">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={value.trackingUrl}
          disabled={disabled}
          onChange={(e) => set({ trackingUrl: e.target.value })}
        />
      </Field>
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
    <Panel title="Update status">
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Field
          label="Order status"
          htmlFor="order-status"
          hint={options.length === 0 ? "This order can't move to another status." : undefined}
        >
          <Select
            value={target || KEEP_STATUS}
            disabled={busy || options.length === 0}
            onValueChange={(v) => {
              setTarget(v === KEEP_STATUS ? '' : v)
              setError('')
            }}
          >
            <SelectTrigger id="order-status" className="w-full sm:max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={KEEP_STATUS}>{orderStatusLabel(order.status)} (current)</SelectItem>
              {options.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'CANCELLED' ? 'Cancel order' : orderStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {askTracking && <TrackingFields value={tracking} onChange={setTracking} disabled={busy} />}

        {error && (
          <p role="alert" className="text-[14px] text-[#6e1118]">
            {error}
          </p>
        )}

        {options.length > 0 && (
          <Button
            type="submit"
            disabled={busy || !target}
            variant={target === 'CANCELLED' ? 'danger' : 'default'}
            className="w-full sm:w-auto"
          >
            {busy
              ? 'Saving…'
              : target === 'CANCELLED'
                ? 'Cancel order'
                : target
                  ? `Update to ${orderStatusLabel(target)}`
                  : 'Update status'}
          </Button>
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
    </Panel>
  )
}

function savedTracking(f) {
  return {
    carrier: f.carrier || '',
    trackingNumber: f.trackingNumber || '',
    trackingUrl: f.trackingUrl || '',
  }
}

function ShipmentCard({ order, busy, onSave }) {
  const f = order.fulfillment || {}
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(() => savedTracking(f))
  const [error, setError] = useState('')

  const startEditing = () => {
    setValue(savedTracking(f))
    setError('')
    setEditing(true)
  }

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
    <Panel
      title="Shipment"
      action={
        !editing && (
          <Button type="button" variant="outline" size="sm" onClick={startEditing}>
            Edit
          </Button>
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="quiet" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={save}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
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
    </Panel>
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
    <Panel title="Shipping label">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="mx-auto w-full max-w-[15rem] shrink-0 border border-[#e2dbcf] bg-white shadow-sm sm:mx-0">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" disabled={downloading} aria-busy={downloading} onClick={download}>
              {downloading ? 'Preparing…' : 'Download PDF'}
            </Button>
            <Button type="button" variant="quiet" onClick={() => printLabel(svgRef.current)}>
              Print
            </Button>
          </div>
          {error && <p className="text-[#6e1118]">{error}</p>}
        </div>
      </div>
    </Panel>
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

  useEffect(() => {
    let cancelled = false
    setOrder(null)
    setError('')
    adminFetchOrder(id)
      .then((data) => {
        if (!cancelled) setOrder(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiClientError ? err.message : 'Could not load order.')
      })
    return () => {
      cancelled = true
    }
  }, [id])

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
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to="/admin/orders">
            <ArrowLeftIcon />
            Back to orders
          </Link>
        </Button>
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
    [pricing.discountLabel || 'Discount', pricing.discountPaise, order.discount, false, true],
  ].filter(([, paise, legacy, always]) => always || (paise ?? legacy ?? 0) > 0)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Button asChild variant="outline" size="sm">
        <Link to="/admin/orders">
          <ArrowLeftIcon />
          Back to orders
        </Link>
      </Button>

      <header className="admin-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-6">
        <div className="min-w-0">
          <h2 className="admin-title break-all">{order.orderNumber}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] admin-muted">
            <span className={orderStatusBadgeClass(order.status)}>{orderStatusLabel(order.status)}</span>
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="border-t border-[#ebe4d6] pt-3 sm:border-0 sm:pt-0 sm:text-right">
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
        <Panel title="Customer">
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
        </Panel>

        <Panel title="Delivery address">
          <dl>
            <Row label="Deliver to">{addr.fullName || customer.name}</Row>
            <Row label="Phone">{addr.phone || customer.phone}</Row>
            {addr.houseNumber ? (
              <>
                <Row label="Flat / house no.">{addr.houseNumber}</Row>
                <Row label="Building">{addr.building}</Row>
                <Row label="Street / area">{addr.area}</Row>
              </>
            ) : (
              <Row label="Address">
                {[addr.addressLine1 || addr.line1, addr.addressLine2 || addr.line2].filter(Boolean).join(', ')}
              </Row>
            )}
            {addr.landmark && <Row label="Landmark">{addr.landmark}</Row>}
            <Row label="City">{addr.city}</Row>
            <Row label="State">{addr.state}</Row>
            <Row label="PIN code">{addr.postalCode}</Row>
            <Row label="Country">{addr.country || 'India'}</Row>
          </dl>
        </Panel>
      </div>

      <Panel title={`Items (${itemCount})`}>
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
                <p className="shrink-0 text-[15px]">
                  {rupees(item.subtotalPaise ?? item.totalPaise, item.lineTotal)}
                </p>
              </li>
            )
          })}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-[#ece5da] pt-3 text-[15px]">
          {bill.map(([label, paise, legacy, , negative]) => (
            <div key={label} className="flex justify-between">
              <dt className="admin-muted">{label}</dt>
              <dd>
                {negative ? '− ' : ''}
                {rupees(paise, legacy)}
              </dd>
            </div>
          ))}
          <div className="flex justify-between pt-1 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Payment">
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {canMarkCodPaid && (
              <Button
                type="button"
                disabled={busy}
                onClick={() => run(() => adminMarkCodPaid(id, {}), 'Cash payment marked as received.')}
              >
                Mark cash received
              </Button>
            )}
            {canRefund && (
              <Button type="button" variant="danger" disabled={busy} onClick={() => setConfirmRefund(true)}>
                Refund
              </Button>
            )}
          </div>
        )}
      </Panel>

      {hasShipment && <ShipmentCard key={order.updatedAt} order={order} busy={busy} onSave={(body) => run(() => adminUpdateShipping(id, body), 'Shipment details saved.')} />}

      <Panel title="History">
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
      </Panel>

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
