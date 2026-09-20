import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { trackOrder } from '../services/checkoutApi'
import { ApiClientError } from '../services/apiClient'

const STEPS = [
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

export default function TrackOrderPage() {
  const [params, setParams] = useSearchParams()
  const [tokenInput, setTokenInput] = useState(params.get('token') || '')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = params.get('token') || ''

  useEffect(() => {
    if (!token) {
      setOrder(null)
      return undefined
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await trackOrder(token)
        if (!cancelled) setOrder(data)
      } catch (err) {
        if (!cancelled) {
          setOrder(null)
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Could not find that order.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const activeIndex = useMemo(() => {
    if (!order) return -1
    const idx = STEPS.indexOf(order.status)
    if (idx >= 0) return idx
    if (order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_FAILED') {
      return -1
    }
    return 0
  }, [order])

  const onSubmit = (e) => {
    e.preventDefault()
    const value = tokenInput.trim()
    if (!value) return
    setParams({ token: value })
  }

  return (
    <div className="bg-ivory px-6 pt-28 pb-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] tracking-[0.42em] text-muted uppercase">
          Order tracking
        </p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">
          Track your order
        </h1>

        <form onSubmit={onSubmit} className="mt-8 flex flex-wrap gap-3">
          <input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste your tracking token"
            className="min-w-[16rem] flex-1 border border-stone bg-warm-white px-4 py-3 text-sm outline-none focus:border-gold"
          />
          <button
            type="submit"
            className="btn-luxury border border-charcoal px-6 py-3 text-charcoal"
          >
            Track
          </button>
        </form>

        {loading && <p className="mt-8 text-sm text-muted">Loading…</p>}
        {error && (
          <p className="mt-8 border border-[#6e1118]/30 bg-[#6e1118]/5 px-3 py-2 text-sm text-[#6e1118]">
            {error}
          </p>
        )}

        {order && (
          <div className="mt-10 border border-stone bg-warm-white p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-muted uppercase">
                  {order.orderNumber}
                </p>
                <p className="mt-2 font-display text-2xl text-charcoal">
                  {order.status}
                </p>
              </div>
              <p className="font-display text-xl text-gold">
                {formatPrice(
                  order.pricing?.totalPaise != null
                    ? order.pricing.totalPaise / 100
                    : order.total,
                )}
              </p>
            </div>

            <ol className="mt-10 space-y-4">
              {STEPS.map((step, i) => {
                const done = activeIndex >= i
                const current = activeIndex === i
                return (
                  <li key={step} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                        done
                          ? 'border-gold bg-gold text-charcoal'
                          : 'border-stone text-muted'
                      }`}
                    >
                      {done ? '✓' : '○'}
                    </span>
                    <div>
                      <p className={current ? 'text-charcoal' : 'text-muted'}>
                        {step.replaceAll('_', ' ')}
                      </p>
                      {order.statusHistory
                        ?.filter((h) => h.status === step)
                        .slice(-1)
                        .map((h) => (
                          <p
                            key={`${step}-${h.createdAt}`}
                            className="text-[12px] text-muted"
                          >
                            {h.createdAt
                              ? new Date(h.createdAt).toLocaleString()
                              : ''}
                            {h.note ? ` · ${h.note}` : ''}
                          </p>
                        ))}
                    </div>
                  </li>
                )
              })}
            </ol>

            {order.fulfillment?.trackingNumber && (
              <div className="mt-8 border-t border-stone pt-6 text-sm">
                <p className="text-muted">
                  Carrier: {order.fulfillment.carrier || '—'}
                </p>
                <p className="mt-1 text-charcoal">
                  Tracking: {order.fulfillment.trackingNumber}
                </p>
                {order.fulfillment.trackingUrl && (
                  <a
                    href={order.fulfillment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-[11px] tracking-[0.28em] text-gold uppercase"
                  >
                    Track shipment →
                  </a>
                )}
              </div>
            )}

            <Link
              to="/shop"
              className="mt-8 inline-block text-[11px] tracking-[0.28em] text-muted uppercase hover:text-gold"
            >
              ← Continue shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
