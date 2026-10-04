/**
 * Checkout — server quote + PREPAID (Razorpay) or COD.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { saveTrackingToken } from '../services/trackingStorage'
import FieldLabel from '../components/forms/FieldLabel'
import IndiaStateCityFields from '../components/forms/IndiaStateCityFields'
import { COUNTRY_NAME } from '../lib/indiaLocations'

const IDEMPOTENCY_STORAGE_KEY = 'scentinova-checkout-idempotency'
const PIN_CODE = /^[1-9][0-9]{5}$/
const PIN_MESSAGE = 'Enter a valid 6-digit PIN code.'
const ADDRESS_FIELDS = ['state', 'city', 'postalCode']

const inputBase = 'w-full border bg-ivory px-4 py-3 text-base outline-none focus:border-scent-red'
const inputClass = `${inputBase} border-stone`

function cartFingerprint(items, paymentMethod) {
  return `${items
    .map((i) => `${i.id}:${i.qty}`)
    .sort()
    .join('|')}|${paymentMethod}`
}

function getOrCreateIdempotencyKey(fingerprint) {
  try {
    const raw = sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.fingerprint === fingerprint && parsed?.key) return parsed.key
    }
  } catch {
    /* ignore */
  }
  const key =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  try {
    sessionStorage.setItem(
      IDEMPOTENCY_STORAGE_KEY,
      JSON.stringify({ fingerprint, key }),
    )
  } catch {
    /* ignore */
  }
  return key
}

function clearIdempotencyKey() {
  try {
    sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

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
  const payLockRef = useRef(false)
  const [quote, setQuote] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('PREPAID')
  const [paymentOptions, setPaymentOptions] = useState(null)
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
    stateCode: '',
    postalCode: '',
    country: COUNTRY_NAME,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const stateRef = useRef(null)
  const cityRef = useRef(null)
  const postalRef = useRef(null)

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

  // Fee hints and COD availability come from the server quote (fees are set per product)
  const codEnabled = paymentOptions?.cod?.enabled !== false
  const codBlockedBy = paymentOptions?.cod?.blockedBy || []
  const codFeePaise = paymentOptions?.cod?.codFeePaise ?? 0
  const codConveniencePaise = paymentOptions?.cod?.convenienceFeePaise ?? 0
  const codShippingPaise = paymentOptions?.cod?.shippingPaise ?? 0
  const prepaidShipsFree = codShippingPaise > 0 && paymentOptions?.prepaid?.shippingPaise === 0

  /** COD rejected for this cart: remember which products block it and fall back to online payment. */
  const handleCodBlocked = useCallback((err) => {
    const blockedBy = Array.isArray(err.fields?.blockedBy) ? err.fields.blockedBy : []
    setPaymentOptions((prev) => ({
      ...(prev || {}),
      cod: { ...(prev?.cod || {}), enabled: false, blockedBy },
    }))
    setPaymentMethod('PREPAID')
  }, [])

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
        const data = await quoteCheckout({
          items: cartPayload,
          paymentMethod,
        })
        if (!cancelled) {
          setQuote(data)
          if (data.paymentOptions) setPaymentOptions(data.paymentOptions)
          setState('IDLE')
        }
      } catch (err) {
        if (cancelled) return
        setQuote(null)
        if (
          err instanceof ApiClientError &&
          err.code === 'PAYMENT_METHOD_DISABLED' &&
          paymentMethod === 'COD'
        ) {
          handleCodBlocked(err)
          return
        }
        setState('FAILED')
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Could not validate your cart.',
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items, cartPayload, paymentMethod, handleCodBlocked])

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const setFieldError = (key, message) =>
    setFieldErrors((errs) => {
      if ((errs[key] || '') === (message || '')) return errs
      const next = { ...errs }
      if (message) next[key] = message
      else delete next[key]
      return next
    })

  const onStateChange = (option) => {
    setForm((f) => {
      const code = option?.code || ''
      return {
        ...f,
        state: option?.name || '',
        stateCode: code,
        // A city only belongs to the state it was picked from.
        city: code && code === f.stateCode ? f.city : '',
      }
    })
    if (option) setFieldError('state', '')
  }

  const onCityChange = (name) => {
    setField('city', name)
    if (name) setFieldError('city', '')
  }

  const onPostalChange = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6)
    setField('postalCode', digits)
    if (PIN_CODE.test(digits)) setFieldError('postalCode', '')
  }

  /** Client-side address checks; the server re-validates everything. */
  const validateAddress = () => {
    const errs = {}
    if (!form.state || !form.stateCode) errs.state = 'Please select your state.'
    if (!form.city) errs.city = 'Please select your city.'
    if (!PIN_CODE.test(form.postalCode)) errs.postalCode = PIN_MESSAGE
    setFieldErrors(errs)
    const first = ADDRESS_FIELDS.find((key) => errs[key])
    if (first) {
      const ref = { state: stateRef, city: cityRef, postalCode: postalRef }[first]
      ref.current?.focus({ preventScroll: true })
      ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    return !first
  }

  /** Show server-side address errors ("shippingAddress.city" etc.) under their fields. */
  const applyServerFieldErrors = (fields) => {
    if (!fields) return
    const errs = {}
    for (const [key, message] of Object.entries(fields)) {
      const field = key.replace(/^shippingAddress\./, '')
      if (ADDRESS_FIELDS.includes(field)) errs[field] = message
    }
    if (Object.keys(errs).length) setFieldErrors((prev) => ({ ...prev, ...errs }))
  }

  const busy = !STATES.includes(state)
    ? false
    : [
        'VALIDATING',
        'CREATING_ORDER',
        'OPENING_PAYMENT',
        'PAYMENT_PROCESSING',
        'VERIFYING_PAYMENT',
      ].includes(state)

  const pricing = quote?.pricing || {}
  const display = {
    subtotal:
      pricing.subtotalPaise != null
        ? pricing.subtotalPaise / 100
        : quote?.subtotal,
    shipping:
      pricing.shippingPaise != null
        ? pricing.shippingPaise / 100
        : quote?.shipping,
    discount:
      pricing.discountPaise != null
        ? pricing.discountPaise / 100
        : quote?.discount || 0,
    convenienceFee:
      pricing.convenienceFeePaise != null
        ? pricing.convenienceFeePaise / 100
        : quote?.convenienceFee,
    codFee:
      pricing.codFeePaise != null ? pricing.codFeePaise / 100 : quote?.codFee,
    total:
      pricing.totalPaise != null ? pricing.totalPaise / 100 : quote?.total,
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!items.length || !quote) return
    if (payLockRef.current || busy) return
    if (!validateAddress()) return
    payLockRef.current = true
    setError('')
    setState('CREATING_ORDER')

    const idempotencyKey = getOrCreateIdempotencyKey(
      cartFingerprint(items, paymentMethod),
    )

    try {
      trackEvent('checkout_started').catch(() => {})
      const paymentOrder = await createPaymentOrder(
        {
          paymentMethod,
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
        saveTrackingToken(paymentOrder.orderNumber, paymentOrder.trackingToken)
      }

      if (
        paymentOrder.paymentMethod === 'COD' ||
        paymentOrder.requiresRazorpay === false
      ) {
        clearCart()
        clearIdempotencyKey()
        setState('SUCCESS')
        navigate(
          `/order-confirmation/${paymentOrder.orderNumber}?token=${encodeURIComponent(
            paymentOrder.trackingToken || '',
          )}`,
          { replace: true },
        )
        return
      }

      // Order was priced at submit time; show exactly what Razorpay will charge
      if (paymentOrder.pricing) {
        setQuote((q) => (q ? { ...q, pricing: paymentOrder.pricing } : q))
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
          theme: { color: '#962D2E' },
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
              clearIdempotencyKey()
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
              setError(
                'Payment was not completed. Your order has not been confirmed.',
              )
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
          : 'Could not place your order. Please try again.',
      )
      if (err instanceof ApiClientError) applyServerFieldErrors(err.fields)
      if (
        err instanceof ApiClientError &&
        err.code === 'PAYMENT_METHOD_DISABLED' &&
        paymentMethod === 'COD'
      ) {
        handleCodBlocked(err)
      }
    } finally {
      payLockRef.current = false
    }
  }

  if (!count) {
    return (
      <div className="bg-ivory px-6 pt-[calc(7rem+var(--offer-h))] pb-20 text-center">
        <h1 className="font-display text-4xl text-charcoal">Your bag is empty</h1>
        <Link
          to="/shop"
          className="mt-6 inline-block text-[11px] tracking-[0.28em] text-scent-red uppercase"
        >
          Browse fragrances →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-ivory pt-[calc(4rem+var(--offer-h))]">
      <section className="px-6 pt-14 pb-8 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] tracking-[0.42em] text-muted uppercase"
          >
            Secure checkout
          </motion.p>
          <h1 className="mt-3 font-display text-4xl text-charcoal sm:text-5xl">
            Checkout
          </h1>
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14 lg:px-16"
      >
        <div className="space-y-8">
          <section className="border border-stone bg-warm-white p-6">
            <h2 className="font-display text-2xl text-charcoal">Contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <FieldLabel required>Full name</FieldLabel>
                <input
                  required
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <FieldLabel required>Email</FieldLabel>
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <FieldLabel required>Phone</FieldLabel>
                <input
                  required
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="border border-stone bg-warm-white p-6">
            <h2 className="font-display text-2xl text-charcoal">Shipping address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <FieldLabel required>Address line 1</FieldLabel>
                <input
                  required
                  name="address-line1"
                  autoComplete="address-line1"
                  value={form.addressLine1}
                  onChange={(e) => setField('addressLine1', e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2">
                <FieldLabel>Address line 2</FieldLabel>
                <input
                  name="address-line2"
                  autoComplete="address-line2"
                  value={form.addressLine2}
                  onChange={(e) => setField('addressLine2', e.target.value)}
                  className={inputClass}
                />
              </label>
              <IndiaStateCityFields
                state={form.state}
                stateCode={form.stateCode}
                city={form.city}
                errors={fieldErrors}
                onStateChange={onStateChange}
                onCityChange={onCityChange}
                onError={setFieldError}
                stateRef={stateRef}
                cityRef={cityRef}
              />
              <div>
                <FieldLabel htmlFor="checkout-postal" required>
                  Postal code
                </FieldLabel>
                <input
                  ref={postalRef}
                  id="checkout-postal"
                  required
                  name="postal-code"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit PIN"
                  aria-invalid={fieldErrors.postalCode ? true : undefined}
                  aria-describedby={fieldErrors.postalCode ? 'checkout-postal-error' : undefined}
                  value={form.postalCode}
                  onChange={(e) => onPostalChange(e.target.value)}
                  onBlur={() => {
                    if (form.postalCode && !PIN_CODE.test(form.postalCode)) {
                      setFieldError('postalCode', PIN_MESSAGE)
                    }
                  }}
                  className={`${inputBase} placeholder:text-muted/70 ${
                    fieldErrors.postalCode ? 'border-scent-red' : 'border-stone'
                  }`}
                />
                {fieldErrors.postalCode && (
                  <p id="checkout-postal-error" className="mt-1.5 text-[12px] text-scent-red">
                    {fieldErrors.postalCode}
                  </p>
                )}
              </div>
              <label>
                <FieldLabel required>Country</FieldLabel>
                <input
                  readOnly
                  name="country"
                  autoComplete="country-name"
                  aria-required="true"
                  value={form.country}
                  title="We currently ship within India only."
                  className="w-full cursor-default border border-stone bg-stone/20 px-4 py-3 text-base text-charcoal outline-none"
                />
              </label>
            </div>
          </section>

          <section className="border border-stone bg-warm-white p-6">
            <h2 className="font-display text-2xl text-charcoal">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('PREPAID')}
                aria-pressed={paymentMethod === 'PREPAID'}
                className={`relative border px-4 py-4 text-left transition ${
                  paymentMethod === 'PREPAID'
                    ? 'border-scent-red bg-ivory'
                    : 'border-stone bg-warm-white hover:border-charcoal/40'
                }`}
              >
                {paymentMethod === 'PREPAID' && (
                  <span aria-hidden className="absolute top-4 right-4 h-2 w-2 rounded-full bg-scent-red" />
                )}
                <span className="block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Prepaid
                </span>
                <span className="mt-1 block text-sm text-charcoal">
                  Pay securely online using Razorpay
                </span>
                {prepaidShipsFree && (
                  <span className="mt-2 block text-sm text-success">Free shipping</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                disabled={!codEnabled}
                aria-pressed={paymentMethod === 'COD'}
                className={`relative border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  paymentMethod === 'COD'
                    ? 'border-scent-red bg-ivory'
                    : 'border-stone bg-warm-white enabled:hover:border-charcoal/40'
                }`}
              >
                {paymentMethod === 'COD' && (
                  <span aria-hidden className="absolute top-4 right-4 h-2 w-2 rounded-full bg-scent-red" />
                )}
                <span className="block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Cash on delivery
                </span>
                <span className="mt-1 block text-sm text-charcoal">
                  Pay when your order is delivered
                </span>
                {codEnabled && codFeePaise > 0 && (
                  <span className="mt-2 block text-sm text-bronze">
                    + {formatPrice(codFeePaise / 100)} COD fee
                  </span>
                )}
                {codEnabled && prepaidShipsFree && (
                  <span className={`block text-sm text-bronze ${codFeePaise > 0 ? 'mt-0.5' : 'mt-2'}`}>
                    + {formatPrice(codShippingPaise / 100)} shipping
                  </span>
                )}
                {!codEnabled && (
                  <span className="mt-2 block text-sm text-burgundy">
                    {codBlockedBy.length
                      ? `Not available for ${codBlockedBy.join(', ')}`
                      : 'Not available for this bag'}
                  </span>
                )}
              </button>
            </div>
            {paymentMethod === 'COD' && codEnabled && (codFeePaise > 0 || codConveniencePaise > 0) && (
              <p className="mt-4 text-[12px] leading-relaxed text-muted">
                {[
                  codFeePaise > 0 ? `a ${formatPrice(codFeePaise / 100)} COD fee` : null,
                  codConveniencePaise > 0
                    ? `a ${formatPrice(codConveniencePaise / 100)} convenience fee`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' and ')
                  .replace(/^a/, 'A')}{' '}
                {codFeePaise > 0 && codConveniencePaise > 0 ? 'are' : 'is'} included in the
                amount payable on delivery.
              </p>
            )}
          </section>
        </div>

        <aside className="h-fit border border-stone bg-warm-white p-6 lg:sticky lg:top-[calc(7rem+var(--offer-h))]">
          <p className="text-[11px] tracking-[0.42em] text-muted uppercase">
            Order summary
          </p>
          <ul className="mt-6 space-y-4 border-b border-stone pb-6">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-charcoal">
                  {item.name} × {item.qty}
                </span>
                <span className="text-bronze">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(display.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>
                {display.shipping === 0
                  ? 'Complimentary'
                  : formatPrice(display.shipping)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Convenience</dt>
              <dd>{formatPrice(display.convenienceFee ?? 0)}</dd>
            </div>
            {paymentMethod === 'COD' && (
              <div className="flex justify-between">
                <dt className="text-muted">COD Fee</dt>
                <dd>{formatPrice(display.codFee ?? 0)}</dd>
              </div>
            )}
            {display.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd>-{formatPrice(display.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-stone pt-4">
              <dt className="font-display text-xl">Total</dt>
              <dd className="font-display text-2xl text-bronze">
                {formatPrice(display.total)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            {paymentMethod === 'COD'
              ? 'Fees and totals are calculated on the server. Amount shown is payable on delivery.'
              : 'Fees and totals are calculated on the server. You will pay securely via Razorpay.'}
          </p>
          {error && (
            <p className="mt-4 border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !quote}
            className="btn-primary mt-6 w-full py-4"
          >
            {busy
              ? 'Processing…'
              : paymentMethod === 'COD'
                ? `Place COD order · ${quote ? formatPrice(display.total) : ''}`
                : `Pay ${quote ? formatPrice(display.total) : ''}`}
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
