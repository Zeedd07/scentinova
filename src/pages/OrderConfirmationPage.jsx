import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatPrice } from '../data/products'
import { fetchOrderConfirmation } from '../services/checkoutApi'
import { ApiClientError } from '../services/apiClient'
import { getSavedTrackingToken, saveTrackingToken } from '../services/trackingStorage'

function paiseOrRupee(paise, rupeeFallback = 0) {
  if (paise != null) return paise / 100
  return rupeeFallback
}

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams()
  const [params] = useSearchParams()
  const token = params.get('token') || getSavedTrackingToken(orderNumber)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchOrderConfirmation(orderNumber, token || undefined)
        if (!cancelled) {
          saveTrackingToken(data.orderNumber, token)
          setOrder(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Could not load order confirmation.',
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orderNumber, token])

  if (error) {
    return (
      <div className="bg-ivory px-6 pt-[calc(7rem+var(--offer-h))] pb-20 text-center">
        <h1 className="font-display text-3xl text-charcoal">Order not found</h1>
        <p className="mt-3 text-sm text-muted">{error}</p>
        <Link
          to="/shop"
          className="mt-8 inline-block text-[11px] tracking-[0.28em] text-scent-red uppercase"
        >
          Continue shopping
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-ivory px-6 pt-[calc(7rem+var(--offer-h))] pb-20 text-center text-muted">
        Confirming your order…
      </div>
    )
  }

  const isCod = order.paymentMethod === 'COD'
  const payStatus = String(order.paymentStatus || order.payment?.status || '').toUpperCase()
  const isPaid =
    payStatus === 'PAID' ||
    payStatus === 'CAPTURED' ||
    (!isCod && order.status === 'CONFIRMED')

  const pricing = order.pricing || {}
  const rows = [
    {
      label: 'Subtotal',
      value: paiseOrRupee(pricing.subtotalPaise, order.subtotal),
    },
    {
      label: 'Shipping',
      value: paiseOrRupee(pricing.shippingPaise, order.shipping),
      complimentary: paiseOrRupee(pricing.shippingPaise, order.shipping) === 0,
    },
    {
      label: 'Convenience fee',
      value: paiseOrRupee(pricing.convenienceFeePaise, order.convenienceFee),
    },
    {
      label: 'COD fee',
      value: paiseOrRupee(pricing.codFeePaise, order.codFee),
      hidden: !isCod,
    },
    {
      label: 'Discount',
      value: paiseOrRupee(pricing.discountPaise, order.discount),
      hideIfZero: true,
    },
    {
      label: 'Total',
      value: paiseOrRupee(pricing.totalPaise, order.total),
      emphasize: true,
    },
  ]

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-ivory px-6 pt-[calc(6rem+var(--offer-h))] pb-20">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] tracking-[0.42em] text-muted uppercase"
      >
        SCENTINOVA
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-center font-display text-4xl text-charcoal sm:text-6xl"
      >
        {isCod || isPaid ? (
          <>
            Order <span className="text-bronze">confirmed</span>
          </>
        ) : (
          <>
            Order <span className="text-bronze">received</span>
          </>
        )}
      </motion.h1>

      <div className="mt-8 w-full max-w-md border border-stone bg-warm-white p-6 text-left">
        <p className="text-[11px] tracking-[0.28em] text-muted uppercase">Order number</p>
        <p className="mt-1 font-display text-2xl text-charcoal">{order.orderNumber}</p>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Payment method</dt>
            <dd className="text-charcoal">
              {isCod ? 'Cash on Delivery' : 'Prepaid'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Payment status</dt>
            <dd className="text-charcoal">
              {isCod
                ? isPaid
                  ? 'Paid'
                  : 'Payment due on delivery'
                : isPaid
                  ? 'Paid'
                  : order.payment?.status || order.status}
            </dd>
          </div>
          {rows.map((row) => {
            if (row.hidden || (row.hideIfZero && !row.value)) return null
            return (
              <div
                key={row.label}
                className={`flex justify-between gap-4 ${
                  row.emphasize ? 'border-t border-stone pt-3' : ''
                }`}
              >
                <dt
                  className={
                    row.emphasize ? 'font-display text-lg text-charcoal' : 'text-muted'
                  }
                >
                  {row.label}
                </dt>
                <dd
                  className={
                    row.emphasize ? 'font-display text-xl text-bronze' : 'text-charcoal'
                  }
                >
                  {row.complimentary ? 'Complimentary' : formatPrice(row.value)}
                </dd>
              </div>
            )
          })}
        </dl>

        {order.shippingAddress?.city && (
          <p className="mt-6 text-sm text-muted">
            Shipping to {order.shippingAddress.city}
            {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {token && (
          <Link
            to={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
            className="btn-luxury inline-flex border border-charcoal px-8 py-3.5 text-charcoal"
          >
            Track order
          </Link>
        )}
        <Link
          to="/shop"
          className="inline-flex px-8 py-3.5 text-[11px] tracking-[0.28em] text-muted uppercase hover:text-scent-red"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
