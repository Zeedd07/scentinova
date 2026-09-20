/**
 * Cart bag — checkout happens on /checkout via Razorpay.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/products'

export default function CartPage() {
  const { items, subtotal, count, setQty, removeItem, clearCart } = useCart()

  const shipping = subtotal >= 2500 || subtotal === 0 ? 0 : 99
  const total = subtotal + shipping

  return (
    <div className="bg-ivory pt-16">
      <section className="px-6 pt-14 pb-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] tracking-[0.42em] text-muted uppercase"
          >
            Your selection
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 font-display text-4xl leading-tight text-charcoal sm:text-5xl md:text-6xl"
          >
            Cart & <span className="italic text-gold">Bag</span>
          </motion.h1>
          <p className="mt-4 text-sm text-muted">
            {count === 0
              ? 'No fragrances selected yet.'
              : `${count} ${count === 1 ? 'piece' : 'pieces'} · Prepaid checkout`}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-14 px-6 pb-24 sm:px-10 lg:grid-cols-[1.35fr_0.9fr] lg:gap-16 lg:px-16">
        <div>
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-start border-t border-stone py-16"
            >
              <p className="font-display text-3xl text-charcoal">Your cart is empty</p>
              <Link
                to="/shop"
                className="btn-luxury mt-10 inline-flex border border-charcoal px-8 py-3 text-charcoal"
              >
                Browse the shop
              </Link>
            </motion.div>
          ) : (
            <ul className="border-t border-stone">
              {items.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="grid grid-cols-[7rem_1fr] gap-5 border-b border-stone/80 py-8 sm:grid-cols-[9rem_1fr] sm:gap-8"
                >
                  <Link
                    to={`/product/${item.slug}`}
                    className="relative flex aspect-[3/4] items-center justify-center bg-cream"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="relative z-[1] h-[88%] w-auto max-w-[85%] object-contain"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] tracking-[0.28em] text-muted uppercase">
                          Pure Parfum · {item.size}
                        </p>
                        <Link
                          to={`/product/${item.slug}`}
                          className="mt-1 block font-display text-2xl text-charcoal transition hover:text-gold sm:text-3xl"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-xl text-gold sm:text-2xl">
                        {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-5 pt-6">
                      <div className="flex items-center border border-stone">
                        <button
                          type="button"
                          className="px-3.5 py-2 text-muted transition hover:text-charcoal"
                          onClick={() => setQty(item.id, item.qty - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-xs tracking-wider text-charcoal">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="px-3.5 py-2 text-muted transition hover:text-charcoal"
                          onClick={() => setQty(item.id, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] tracking-[0.28em] text-muted uppercase transition hover:text-gold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/shop"
                className="text-[11px] tracking-[0.32em] text-muted uppercase transition hover:text-gold"
              >
                ← Continue shopping
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] tracking-[0.32em] text-muted uppercase transition hover:text-charcoal"
              >
                Clear bag
              </button>
            </div>
          )}
        </div>

        <aside className="h-fit lg:sticky lg:top-28">
          <div className="border border-stone bg-warm-white px-6 py-8 sm:px-8">
            <p className="text-[11px] tracking-[0.42em] text-muted uppercase">
              Order summary
            </p>
            <h2 className="mt-2 font-display text-3xl text-charcoal">
              Ready to <span className="italic text-gold">seal</span>
            </h2>
            <dl className="mt-8 space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-charcoal">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="text-charcoal">
                  {shipping === 0 ? 'Complimentary' : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-stone pt-4">
                <dt className="font-display text-xl text-charcoal">Total</dt>
                <dd className="font-display text-2xl text-gold">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              Final total is confirmed on the checkout page. Prepaid via Razorpay.
            </p>
            <Link
              to="/checkout"
              className={`btn-luxury mt-8 block w-full border border-charcoal py-4 text-center text-charcoal ${
                items.length === 0 ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              Proceed to checkout
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
