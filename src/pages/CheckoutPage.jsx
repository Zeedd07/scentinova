/**
 * Prepaid checkout — server quote + Razorpay Checkout.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/products'
import { ApiClientError } from '../services/apiClient'
import {
  createPaymentOrder,
  quoteCheckout,
  reportPaymentFailed,
  verifyPayment,
} from '../services/checkoutApi'
import { trackEvent } from '../services/analyticsApi'

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout.'))
    document.body.appendChild(script)
  })
}

const STATES = [
  'IDLE',
  'VALIDATING',
  'CREATING_ORDER',
  'OPENING_PAYMENT',
  'PAYMENT_PROCESSING',
  'VERIFYING_PAYMENT',
  'SUCCESS',
  'FAILED',
]

export default function CheckoutPage() {
  const { items, clearCart, count } = useCart()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(null)
  const [state, setState] = useState('IDLE')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  })

  const cartPayload = useMemo(
    () =>
      items.map((i) => ({
        productId: i.id,
        quantity: i.qty,
        unitPricePaise:
          i.pricePaise != null
            ? i.pricePaise
            : i.price != null
              ? Math.round(Number(i.price) * 100)
              : undefined,
      })),
    [items],
  )

  useEffect(() => {
    if (!items.length) {
      setQuote(null)
      return undefined
    }
    let cancelled = false
    ;(async () => {
      setState('VALIDATING')
      setError('')
      try {
        const data = await quoteCheckout({ items: cartPayload })
        if (!cancelled) {
          setQuote(data)
          setState('IDLE')
        }
      } catch (err) {
        if (!cancelled) {
          setQuote(null)
          setState('FAILED')
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Could not validate your cart.',
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items, cartPayload])

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const busy = !STATES.includes(state)
    ? false
    : ['VALIDATING', 'CREATING_ORDER', 'OPENING_PAYMENT', 'PAYMENT_PROCESSING', 'VERIFYING_PAYMENT'].includes(
        state,
      )

  const onPay = async (e) => {
    e.preventDefault()
    if (!items.length || !quote) return
    setError('')
    setState('CREATING_ORDER')

    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `checkout-${Date.now()}`

    try {
      trackEvent('checkout_started').catch(() => {})
      const paymentOrder = await createPaymentOrder(
        {
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone || null,
          },
          shippingAddress: {
            fullName: form.name,
            phone: form.phone || null,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2 || null,
            landmark: form.landmark || null,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country || 'India',
          },
          items: cartPayload,
        },
        { idempotencyKey },
      )

      if (paymentOrder.trackingToken) {
        sessionStorage.setItem(
          `scentinova-track-${paymentOrder.orderNumber}`,
          paymentOrder.trackingToken,
        )
      }

      setState('OPENING_PAYMENT')
      const Razorpay = await loadRazorpayScript()

      await new Promise((resolve, reject) => {
        const rzp = new Razorpay({
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency || 'INR',
          name: 'Scentinova',
          description: `Order ${paymentOrder.orderNumber}`,
          order_id: paymentOrder.razorpayOrderId,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone || undefined,
          },
          theme: { color: '#b4975a' },
          handler: async (response) => {
            try {
              setState('VERIFYING_PAYMENT')
              await verifyPayment({
                orderNumber: paymentOrder.orderNumber,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              clearCart()
              setState('SUCCESS')
              navigate(
                `/order-confirmation/${paymentOrder.orderNumber}?token=${encodeURIComponent(
                  paymentOrder.trackingToken || '',
                )}`,
                { replace: true },
              )
              resolve()
            } catch (err) {
              setState('FAILED')
              setError(
                err instanceof ApiClientError
                  ? err.message
                  : 'Payment verification failed.',
              )
              reject(err)
            }
          },
          modal: {
            ondismiss: async () => {
              setState('FAILED')
              setError('Payment was not completed. Your order has not been confirmed.')
              try {
                await reportPaymentFailed({
                  orderNumber: paymentOrder.orderNumber,
                  reason: 'Checkout dismissed',
                })
              } catch {
                /* ignore */
              }
              resolve()
            },
          },
        })
        setState('PAYMENT_PROCESSING')
        rzp.open()
      })
    } catch (err) {
      setState('FAILED')
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Could not start payment. Please try again.',
      )
    }
  }

  if (!count) {
    return (
      <div className="bg-ivory px-6 pt-28 pb-20 text-center">
        <h1 className="font-display text-4xl text-charcoal">Your bag is empty</h1>
        <Link to="/shop" className="mt-6 inline-block text-[11px] tracking-[0.28em] text-gold uppercase">
          Browse fragrances →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-ivory pt-16">
      <section className="px-6 pt-14 pb-8 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] tracking-[0.42em] text-muted uppercase"
          >
            Secure prepaid checkout
          </motion.p>
          <h1 className="mt-3 font-display text-4xl text-charcoal sm:text-5xl">
            Checkout
          </h1>
        </div>
      </section>

      <form
        onSubmit={onPay}
        className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14 lg:px-16"
      >
        <div className="space-y-8">
          <section className="border border-stone bg-warm-white p-6">
            <h2 className="font-display text-2xl text-charcoal">Contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Full name
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Email
                </span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Phone
                </span>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>
          </section>

          <section className="border border-stone bg-warm-white p-6">
            <h2 className="font-display text-2xl text-charcoal">Shipping address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Address line 1
                </span>
                <input
                  required
                  value={form.addressLine1}
                  onChange={(e) => setField('addressLine1', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Address line 2
                </span>
                <input
                  value={form.addressLine2}
                  onChange={(e) => setField('addressLine2', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  City
                </span>
                <input
                  required
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  State
                </span>
                <input
                  required
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Postal code
                </span>
                <input
                  required
                  value={form.postalCode}
                  onChange={(e) => setField('postalCode', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Country
                </span>
                <input
                  required
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit border border-stone bg-warm-white p-6 lg:sticky lg:top-28">
          <p className="text-[11px] tracking-[0.42em] text-muted uppercase">Order summary</p>
          <ul className="mt-6 space-y-4 border-b border-stone pb-6">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-charcoal">
                  {item.name} × {item.qty}
                </span>
                <span className="text-gold">{formatPrice(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(quote?.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>
                {quote?.shipping === 0 ? 'Complimentary' : formatPrice(quote?.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-stone pt-4">
              <dt className="font-display text-xl">Total</dt>
              <dd className="font-display text-2xl text-gold">
                {formatPrice(quote?.total)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Secure prepaid payment via Razorpay. No cash on delivery.
          </p>
          {error && (
            <p className="mt-4 border border-[#6e1118]/30 bg-[#6e1118]/5 px-3 py-2 text-sm text-[#6e1118]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !quote}
            className="btn-luxury mt-6 w-full border border-charcoal py-4 text-charcoal disabled:opacity-40"
          >
            {busy
              ? 'Processing…'
              : `Pay ${quote ? formatPrice(quote.total) : ''}`}
          </button>
          <Link
            to="/cart"
            className="mt-4 block text-center text-[11px] tracking-[0.28em] text-muted uppercase"
          >
            ← Back to bag
          </Link>
        </aside>
      </form>
    </div>
  )
}
