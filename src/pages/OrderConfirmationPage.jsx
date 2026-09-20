import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatPrice } from '../data/products'
import { fetchOrderConfirmation } from '../services/checkoutApi'
import { ApiClientError } from '../services/apiClient'

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams()
  const [params] = useSearchParams()
  const token =
    params.get('token') ||
    sessionStorage.getItem(`scentinova-track-${orderNumber}`) ||
    ''
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchOrderConfirmation(orderNumber, token || undefined)
        if (!cancelled) setOrder(data)
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
      <div className="bg-ivory px-6 pt-28 pb-20 text-center">
        <h1 className="font-display text-3xl text-charcoal">Order not found</h1>
        <p className="mt-3 text-sm text-muted">{error}</p>
        <Link
          to="/shop"
          className="mt-8 inline-block text-[11px] tracking-[0.28em] text-gold uppercase"
        >
          Continue shopping
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-ivory px-6 pt-28 pb-20 text-center text-muted">
        Confirming your order…
      </div>
    )
  }

  const paid =
    order.payment?.status === 'CAPTURED' || order.status === 'CONFIRMED'

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-ivory px-6 pt-24 pb-20 text-center">
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
        className="mt-4 font-display text-4xl text-charcoal sm:text-6xl"
      >
        {paid ? (
          <>
            Order <span className="italic text-gold">confirmed</span>
          </>
        ) : (
          <>
            Order <span className="italic text-gold">received</span>
          </>
        )}
      </motion.h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
        Order <span className="text-charcoal">{order.orderNumber}</span>
        {paid ? ' · Payment: Paid' : ` · Status: ${order.status}`}
        <br />
        Total:{' '}
        {formatPrice(
          order.pricing?.totalPaise != null
            ? order.pricing.totalPaise / 100
            : order.total,
        )}
        {order.shippingAddress?.city
          ? ` · Shipping to ${order.shippingAddress.city}`
          : ''}
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {token && (
          <Link
            to={`/track-order?token=${encodeURIComponent(token)}`}
            className="btn-luxury inline-flex border border-charcoal px-8 py-3.5 text-charcoal"
          >
            Track order
          </Link>
        )}
        <Link
          to="/shop"
          className="inline-flex px-8 py-3.5 text-[11px] tracking-[0.28em] text-muted uppercase hover:text-gold"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
