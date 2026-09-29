/**
 * Guest order tracking by order number. Legacy links (?token=) still open directly.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatPrice } from '../data/products'
import { trackOrder, trackOrderByLegacyToken } from '../services/checkoutApi'
import { ApiClientError } from '../services/apiClient'
import { easeOutExpo } from '../lib/motion'

const MSG = {
  emptyOrder: 'Please enter your order number.',
  notFound:
    "We couldn't find an order with that number. Please check your order ID and try again.",
  network: 'Something went wrong while tracking your order. Please try again.',
}

const REFRESH_MS = 60_000

const inputCls =
  'mt-2 w-full border border-stone bg-white px-4 py-3.5 text-base text-charcoal uppercase tracking-[0.08em] placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 outline-none transition-colors focus:border-scent-red aria-[invalid=true]:border-burgundy'

const rupees = (paise) => formatPrice((paise || 0) / 100)

function formatDate(value, withTime = false) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

function errorState(err) {
  if (err instanceof ApiClientError) {
    if (err.status === 404) return { kind: 'not_found', message: MSG.notFound }
    if (err.status === 429) return { kind: 'error', message: err.message, retry: false }
    if (err.status === 400) return { kind: 'invalid', message: err.message }
  }
  return { kind: 'error', message: MSG.network, retry: true }
}

function statusTone(order) {
  if (order.isCancelled || order.hasPaymentIssue) return 'border-burgundy/30 bg-burgundy/5 text-burgundy'
  if (order.isDelivered) return 'border-success bg-success text-warm-white'
  return 'border-scent-red/30 bg-scent-red/5 text-scent-red'
}

function Timeline({ steps }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const done = step.state === 'complete'
        const current = step.state === 'current'
        const skipped = step.state === 'skipped'
        const last = i === steps.length - 1
        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={`absolute top-6 bottom-0 left-[11px] w-px ${done ? 'bg-scent-red' : 'bg-stone'}`}
              />
            )}
            <span
              aria-hidden
              className={`relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                done
                  ? 'border-scent-red bg-scent-red text-warm-white'
                  : current
                    ? 'border-scent-red bg-white text-scent-red ring-4 ring-scent-red/10'
                    : 'border-stone bg-white text-stone'
              }`}
            >
              {done ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : current ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-scent-red motion-reduce:animate-none" />
              ) : null}
            </span>
            <div className="min-w-0">
              <p
                className={`text-[13px] tracking-[0.14em] uppercase ${
                  done || current ? 'text-charcoal' : 'text-muted'
                } ${skipped ? 'line-through decoration-stone' : ''}`}
              >
                {step.label}
                <span className="sr-only">
                  {done ? ' — completed' : current ? ' — current step' : skipped ? ' — not reached' : ' — upcoming'}
                </span>
              </p>
              {step.at && <p className="mt-1 text-[12px] text-muted">{formatDate(step.at, true)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Updates({ updates }) {
  if (!updates?.length) return null
  return (
    <div className="mt-10">
      <h3 className="text-[10px] tracking-[0.34em] text-muted uppercase">Updates</h3>
      <ul className="mt-4 space-y-4 border-l border-stone pl-5">
        {updates.map((u, i) => (
          <li key={`${u.status}-${u.at}-${i}`} className="relative">
            <span
              aria-hidden
              className={`absolute top-1.5 -left-[23.5px] h-2 w-2 rounded-full ${i === updates.length - 1 ? 'bg-scent-red' : 'bg-stone'}`}
            />
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="text-[12px] tracking-[0.14em] text-charcoal uppercase">{u.label}</span>
              {u.at && <span className="text-[12px] text-muted">{formatDate(u.at, true)}</span>}
            </p>
            {u.message && (
              <p className="mt-1.5 text-sm leading-relaxed break-words text-charcoal/90">{u.message}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Row({ label, children, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={strong ? 'font-display text-lg text-charcoal' : 'text-sm text-charcoal text-right'}>{children}</dd>
    </div>
  )
}

function StatusBanner({ order }) {
  let text = null
  if (order.isCancelled) text = 'This order has been cancelled. No payment is due.'
  else if (order.status === 'REFUND_PENDING') text = 'Your refund is being processed.'
  else if (order.status === 'REFUNDED') text = 'This order has been refunded.'
  else if (order.hasPaymentIssue) text = 'Payment for this order was not completed.'
  else if (order.isDelivered) {
    const at = formatDate(order.shipment?.deliveredAt || order.timeline.at(-1)?.at)
    text = `Delivered${at ? ` on ${at}` : ''}. We hope you love it.`
  }
  if (!text) return null
  const tone = order.isDelivered
    ? 'border-success/30 bg-success/5 text-success'
    : 'border-burgundy/25 bg-burgundy/5 text-burgundy'
  return <p className={`mt-6 border px-4 py-3 text-sm ${tone}`}>{text}</p>
}

function OrderResult({ order, onReset }) {
  const isCod = order.paymentMethod === 'COD'
  const destination = [order.destination?.city, order.destination?.state].filter(Boolean).join(', ')

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeOutExpo }}
      className="mt-10 border border-stone bg-warm-white"
      aria-labelledby="tracked-order-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone px-6 py-6 sm:px-8">
        <div>
          <p className="text-[10px] tracking-[0.34em] text-muted uppercase">Order</p>
          <h2 id="tracked-order-heading" className="mt-1 font-display text-xl break-all text-charcoal sm:text-[1.7rem]">
            {order.orderNumber}
          </h2>
          {order.placedAt && <p className="mt-1 text-sm text-muted">Placed on {formatDate(order.placedAt)}</p>}
        </div>
        <span className={`inline-flex items-center border px-3 py-1.5 text-[11px] tracking-[0.22em] uppercase ${statusTone(order)}`}>
          {order.statusLabel}
        </span>
      </div>

      <div className="px-6 sm:px-8">
        <StatusBanner order={order} />
      </div>

      <div className="grid gap-10 px-6 py-8 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-12">
        <div>
          <h3 className="text-[10px] tracking-[0.34em] text-muted uppercase">Progress</h3>
          <div className="mt-5">
            <Timeline steps={order.timeline} />
          </div>
          <Updates updates={order.updates} />
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-[10px] tracking-[0.34em] text-muted uppercase">Payment</h3>
            <dl className="mt-3">
              <Row label="Method">{order.paymentMethodLabel}</Row>
              <Row label="Status">{order.paymentStatusLabel}</Row>
              {isCod ? (
                <Row label="Amount due" strong>
                  {rupees(order.amountDuePaise)}
                </Row>
              ) : (
                <Row label="Order total" strong>
                  {rupees(order.pricing.totalPaise)}
                </Row>
              )}
            </dl>
          </div>

          {order.shipment && (
            <div>
              <h3 className="text-[10px] tracking-[0.34em] text-muted uppercase">Shipment</h3>
              <dl className="mt-3">
                {order.shipment.carrier && <Row label="Carrier">{order.shipment.carrier}</Row>}
                {order.shipment.trackingNumber && (
                  <Row label="Tracking no.">
                    <span className="font-mono text-[13px] tracking-wide break-all">{order.shipment.trackingNumber}</span>
                  </Row>
                )}
                {order.shipment.shippedAt && <Row label="Shipped">{formatDate(order.shipment.shippedAt)}</Row>}
              </dl>
              {order.shipment.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 border border-charcoal px-5 py-3 text-[11px] tracking-[0.28em] text-charcoal uppercase transition-colors hover:border-scent-red hover:bg-scent-red hover:text-warm-white"
                >
                  Track shipment
                  <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          )}

          <div>
            <h3 className="text-[10px] tracking-[0.34em] text-muted uppercase">Items</h3>
            <ul className="mt-3 divide-y divide-stone/70">
              {order.items.map((item, i) => (
                <li key={`${item.name}-${i}`} className="flex items-center gap-4 py-3">
                  <div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden bg-cream">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-[88%] w-auto object-contain" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base text-charcoal">{item.name}</p>
                    <p className="text-[12px] text-muted">
                      {item.size ? `${item.size} · ` : ''}Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-charcoal">{rupees(item.totalPaise)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 border-t border-stone pt-2">
              <Row label="Total" strong>
                {rupees(order.pricing.totalPaise)}
              </Row>
            </dl>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-stone px-6 py-5 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          {destination && <>Shipping to {destination}. </>}
          {order.lastUpdatedAt && <>Last updated {formatDate(order.lastUpdatedAt, true)}.</>}
        </p>
        <div className="flex gap-6">
          <button
            type="button"
            onClick={onReset}
            className="border-0 bg-transparent p-0 text-[11px] tracking-[0.26em] text-charcoal uppercase hover:text-scent-red"
          >
            Track another order
          </button>
          <Link to="/shop" className="text-[11px] tracking-[0.26em] text-muted uppercase hover:text-scent-red">
            Continue shopping
          </Link>
        </div>
      </div>
    </motion.section>
  )
}

function LoadingCard() {
  return (
    <div className="mt-10 animate-pulse border border-stone bg-warm-white p-6 sm:p-8" aria-hidden>
      <div className="h-3 w-24 bg-stone/60" />
      <div className="mt-3 h-7 w-64 max-w-full bg-stone/60" />
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-6 w-6 rounded-full bg-stone/60" />
              <div className="h-3 w-32 bg-stone/60" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-3 w-full bg-stone/60" />
          <div className="h-3 w-5/6 bg-stone/60" />
          <div className="h-3 w-2/3 bg-stone/60" />
        </div>
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  const [params, setParams] = useSearchParams()
  const [orderInput, setOrderInput] = useState(params.get('order') || '')
  const [formError, setFormError] = useState(null)
  const [state, setState] = useState({ kind: 'idle' })
  const lastRequest = useRef(null)
  const requestSeq = useRef(0)

  const load = useCallback(
    async ({ orderNumber, token }) => {
      const seq = ++requestSeq.current
      lastRequest.current = { orderNumber, token }
      setFormError(null)
      setState({ kind: 'loading' })
      try {
        const order = orderNumber
          ? await trackOrder({ orderNumber })
          : await trackOrderByLegacyToken(token)
        if (seq !== requestSeq.current) return
        lastRequest.current = { orderNumber: order.orderNumber }
        setOrderInput(order.orderNumber)
        setState({ kind: 'success', order })
        // Refreshes use the order number; legacy tokens don't stay in the address bar
        setParams({ order: order.orderNumber }, { replace: true })
      } catch (err) {
        if (seq !== requestSeq.current) return
        const next = errorState(err)
        if (next.kind === 'invalid') {
          setFormError({ field: 'order', message: next.message })
          setState({ kind: 'idle' })
        } else {
          setState(next)
        }
      }
    },
    [setParams],
  )

  // Keep an open page current while the order is still moving
  const liveOrder =
    state.kind === 'success' &&
    !state.order.isDelivered &&
    !state.order.isCancelled &&
    state.order.status !== 'REFUNDED'
  useEffect(() => {
    if (!liveOrder) return undefined
    const refresh = async () => {
      const req = lastRequest.current
      if (!req || document.hidden) return
      const seq = requestSeq.current
      try {
        const order = await trackOrder({ orderNumber: req.orderNumber })
        if (seq === requestSeq.current) setState({ kind: 'success', order })
      } catch {
        /* keep showing the last good result */
      }
    }
    const timer = window.setInterval(refresh, REFRESH_MS)
    const onVisible = () => {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [liveOrder])

  // Autoload from links: ?order= (emails, confirmation page) or legacy ?token=
  const autoloaded = useRef(false)
  useEffect(() => {
    if (autoloaded.current) return
    autoloaded.current = true
    const order = (params.get('order') || '').trim()
    const token = (params.get('token') || '').trim()
    if (order) load({ orderNumber: order })
    else if (token) load({ orderNumber: '', token })
  }, [params, load])

  const onSubmit = (e) => {
    e.preventDefault()
    const orderNumber = orderInput.trim()
    if (!orderNumber) {
      setFormError({ field: 'order', message: MSG.emptyOrder })
      return
    }
    load({ orderNumber })
  }

  const reset = () => {
    requestSeq.current += 1
    setState({ kind: 'idle' })
    setOrderInput('')
    setFormError(null)
    setParams({}, { replace: true })
  }

  const loading = state.kind === 'loading'

  return (
    <div className="min-h-[80vh] bg-ivory px-5 pt-[calc(var(--nav-h)+env(safe-area-inset-top,0px)+3rem)] pb-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center"
        >
          <p className="text-[11px] tracking-[0.42em] text-muted uppercase">Order tracking</p>
          <h1 className="mt-3 font-display text-4xl text-charcoal sm:text-5xl">Track Your Order</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            Enter your order number to view the latest status. You&apos;ll find it in your order
            confirmation email.
          </p>
        </motion.div>

        {state.kind !== 'success' && (
          <form
            onSubmit={onSubmit}
            noValidate
            className="mx-auto mt-10 max-w-xl border border-stone bg-warm-white p-6 sm:p-8"
          >
            <label htmlFor="track-order-number" className="text-[10px] tracking-[0.34em] text-muted uppercase">
              Order number
            </label>
            <input
              id="track-order-number"
              value={orderInput}
              onChange={(e) => {
                setOrderInput(e.target.value)
                if (formError?.field === 'order') setFormError(null)
              }}
              placeholder="e.g. SCN-20260921-8F42A19C"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={40}
              aria-invalid={formError?.field === 'order'}
              aria-describedby={formError?.field === 'order' ? 'track-form-error' : undefined}
              className={inputCls}
            />

            {formError && (
              <p id="track-form-error" role="alert" className="mt-5 text-sm text-burgundy">
                {formError.message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-7 flex w-full items-center justify-center gap-3 px-8 py-4 text-[11px] tracking-[0.34em] disabled:cursor-wait disabled:opacity-70"
            >
              {loading && (
                <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border border-warm-white/40 border-t-warm-white" />
              )}
              {loading ? 'Tracking...' : 'Track order'}
            </button>
          </form>
        )}

        <div aria-live="polite" aria-busy={loading}>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span className="sr-only">Tracking your order…</span>
                <LoadingCard />
              </motion.div>
            )}
          </AnimatePresence>

          {(state.kind === 'not_found' || state.kind === 'error') && (
            <div className="mx-auto mt-8 max-w-xl border border-burgundy/25 bg-burgundy/5 px-5 py-4 text-sm text-burgundy">
              <p>{state.message}</p>
              {state.retry && lastRequest.current && (
                <button
                  type="button"
                  onClick={() => load(lastRequest.current)}
                  className="mt-3 border-0 bg-transparent p-0 text-[11px] tracking-[0.26em] text-charcoal uppercase underline-offset-4 hover:underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {state.kind === 'success' && <OrderResult order={state.order} onReset={reset} />}
        </div>
      </div>
    </div>
  )
}
