/**
 * Cart & checkout — editorial maison layout.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { formatPrice } from '../data/products'

export default function CartPage() {
  const { items, subtotal, hasPricedItems, count, setQty, removeItem, clearCart } =
    useCart()
  const { placeOrder } = useCatalog()
  const [placed, setPlaced] = useState(false)

  const shipping = !hasPricedItems || subtotal >= 250 || subtotal === 0 ? 0 : 18
  const total = hasPricedItems ? subtotal + shipping : null

  const checkout = (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    placeOrder({
      email: String(data.get('email') || ''),
      name: String(data.get('name') || ''),
      address: String(data.get('address') || ''),
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
      })),
      total,
    })
    setPlaced(true)
    clearCart()
  }

  if (placed) {
    return (
      <div className="relative flex min-h-[80vh] flex-col items-center justify-center bg-ivory px-6 pt-24 pb-20 text-center">
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
          transition={{ delay: 0.1 }}
          className="mt-4 font-display text-4xl text-charcoal sm:text-6xl"
        >
          Order <span className="italic text-gold">received</span>
        </motion.h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
          A mock boutique receipt — no payment was taken. Your cart is clear for
          the next visit.
        </p>
        <Link
          to="/shop"
          className="btn-luxury mt-12 inline-flex border border-charcoal px-10 py-3.5 text-charcoal"
        >
          Continue shopping
        </Link>
      </div>
    )
  }

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
            Cart & <span className="italic text-gold">Checkout</span>
          </motion.h1>
          <p className="mt-4 text-sm text-muted">
            {count === 0
              ? 'No fragrances selected yet.'
              : `${count} ${count === 1 ? 'piece' : 'pieces'} · Atelier packing`}
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
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                Explore the collection and set aside a fragrance that stays.
              </p>
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
                        {formatPrice(
                          item.price == null ? null : item.price * item.qty,
                        )}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-5 pt-6">
                      <div className="flex items-center border border-stone">
                        <button
                          type="button"
                          className="px-3.5 py-2 text-muted transition hover:text-charcoal"
                          onClick={() => setQty(item.id, item.qty - 1)}
                          aria-label="Decrease quantity"
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
                          aria-label="Increase quantity"
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
                <dd className="text-charcoal">
                  {formatPrice(hasPricedItems ? subtotal : null)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="text-charcoal">
                  {!hasPricedItems
                    ? '—'
                    : shipping === 0
                      ? 'Complimentary'
                      : formatPrice(shipping)}
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
              Prices on request for house signatures. Place a mock enquiry below.
            </p>

            <form onSubmit={checkout} className="mt-8 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Email
                </span>
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="you@atelier.com"
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm text-charcoal outline-none placeholder:text-muted/70 focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Full name
                </span>
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="Name on the order"
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm text-charcoal outline-none placeholder:text-muted/70 focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase">
                  Address
                </span>
                <input
                  required
                  name="address"
                  type="text"
                  placeholder="Delivery address"
                  className="w-full border border-stone bg-ivory px-4 py-3 text-sm text-charcoal outline-none placeholder:text-muted/70 focus:border-gold"
                />
              </label>
              <button
                type="submit"
                disabled={items.length === 0}
                className="btn-luxury mt-4 w-full border border-charcoal py-4 text-charcoal disabled:cursor-not-allowed disabled:opacity-40"
              >
                Place mock order
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  )
}
