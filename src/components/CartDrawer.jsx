/**
 * Slide-over cart drawer — mock checkout.
 */
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/products'

export default function CartDrawer() {
  const {
    items,
    subtotal,
    drawerOpen,
    setDrawerOpen,
    setQty,
    removeItem,
    clearCart,
  } = useCart()

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-gold/20 bg-panel shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-gold/15 px-6 py-5">
              <h2 className="font-display text-2xl text-cream">Your Cart</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-bronze transition hover:text-cream"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-display text-xl text-cream">Empty for now</p>
                  <p className="mt-2 text-sm text-bronze">
                    Discover a scent that stays.
                  </p>
                  <Link
                    to="/shop"
                    onClick={() => setDrawerOpen(false)}
                    className="btn-shimmer gold-border mt-8 inline-block rounded-sm px-8 py-3 text-[11px] tracking-[0.28em] text-cream uppercase"
                  >
                    Browse Shop
                  </Link>
                </div>
              ) : (
                <ul className="space-y-5">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4">
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="h-24 w-20 shrink-0 overflow-hidden bg-ink"
                      >
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              to={`/product/${item.slug}`}
                              onClick={() => setDrawerOpen(false)}
                              className="font-display text-lg text-cream hover:text-gold-light"
                            >
                              {item.name}
                            </Link>
                            <p className="text-[11px] text-bronze">{item.size}</p>
                          </div>
                          <p className="text-sm text-gold-light">
                            {formatPrice(item.price * item.qty)}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center border border-gold/25">
                            <button
                              type="button"
                              className="px-2.5 py-1 text-bronze hover:text-cream"
                              onClick={() => setQty(item.id, item.qty - 1)}
                              aria-label="Decrease"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-xs tabular-nums">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              className="px-2.5 py-1 text-bronze hover:text-cream"
                              onClick={() => setQty(item.id, item.qty + 1)}
                              aria-label="Increase"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-[11px] tracking-wider text-bronze uppercase hover:text-cream"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gold/15 px-6 py-5">
                <div className="mb-4 flex justify-between text-sm">
                  <span className="text-bronze">Subtotal</span>
                  <span className="font-display text-xl text-cream">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mb-4 text-[11px] text-bronze">
                  Shipping calculated at checkout · Mock store — no payment
                  processed.
                </p>
                <Link
                  to="/cart"
                  onClick={() => setDrawerOpen(false)}
                  className="btn-shimmer gold-border mb-3 block w-full rounded-sm py-3.5 text-center text-[11px] tracking-[0.28em] text-cream uppercase"
                >
                  View Cart & Checkout
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full text-[11px] tracking-wider text-bronze uppercase hover:text-cream"
                >
                  Clear cart
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
