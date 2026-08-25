/**
 * Mock orders — from seed data + storefront checkouts.
 */
import { useCatalog } from '../../context/CatalogContext'
import { formatPrice } from '../../data/products'

const STATUSES = ['New', 'Packed', 'Shipped']

export default function AdminOrders() {
  const { orders, updateOrderStatus } = useCatalog()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.32em] text-bronze uppercase">
          Commerce
        </p>
        <h2 className="mt-1 font-display text-3xl text-cream">
          Mock <span className="gold-text italic">orders</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-bronze">
          Demo orders plus any “Place mock order” checkouts from the cart page.
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="text-bronze">No orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="border border-gold/15 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl text-cream">{o.name}</p>
                  <p className="mt-1 text-sm text-bronze">{o.email}</p>
                  <p className="mt-1 text-sm text-bronze">{o.address}</p>
                  <p className="mt-2 text-[11px] tracking-[0.2em] text-bronze uppercase">
                    {o.id} · {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl gold-text">
                    {formatPrice(o.total)}
                  </p>
                  <select
                    value={o.status}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    className="mt-2 border border-gold/25 bg-ink px-3 py-1.5 text-[11px] tracking-[0.18em] text-cream uppercase outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ul className="mt-4 space-y-1 border-t border-gold/10 pt-4 text-sm">
                {o.items?.map((item, i) => (
                  <li
                    key={`${o.id}-${item.id}-${i}`}
                    className="flex justify-between text-bronze"
                  >
                    <span className="text-cream">
                      {item.name} × {item.qty}
                    </span>
                    <span>{formatPrice(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
