/**
 * Admin product form - checkout fees charged when this product is in the cart.
 * Values are rupee strings here; AdminProductForm converts them to paise on save.
 */
import { MAX_FEE_RUPEES } from '../../lib/productFees'

function Toggle({ id, label, description, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#1b1917]"
      />
      <span>
        <span className="block text-[15px] font-medium text-[#1b1917]">{label}</span>
        {description && <span className="block text-[13px] admin-muted">{description}</span>}
      </span>
    </label>
  )
}

function MoneyField({ id, label, value, onChange, error, disabled }) {
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <label htmlFor={id} className="admin-label">
        {label}
      </label>
      <div className="relative mt-1.5 max-w-[12rem]">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] admin-muted"
          aria-hidden
        >
          ₹
        </span>
        <input
          id={id}
          className="admin-input"
          style={{ marginTop: 0, paddingLeft: '1.75rem' }}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[13px] text-[#6e1118]">
          {error}
        </p>
      )}
    </div>
  )
}

function FeeCard({ title, children }) {
  return (
    <div className="space-y-3 border border-[#e0d6c4] bg-[#fffcf7] p-4">
      <p className="text-[13px] font-semibold tracking-wide text-[#4a4136] uppercase">{title}</p>
      {children}
    </div>
  )
}

export default function ProductFeesEditor({ value, onChange, errors = {} }) {
  const update = (section, key) => (next) =>
    onChange({ ...value, [section]: { ...value[section], [key]: next } })

  return (
    <div className="space-y-4">
      <div>
        <span className="admin-label">Fees and charges</span>
        <p className="mt-1 text-[13px] admin-muted">
          Charges added at checkout when this perfume is in the cart. Leave a fee off if you
          don&apos;t want it on this product. Convenience and COD fees are charged once per
          product (not per bottle); shipping is charged once per order, using the highest
          shipping fee in the cart. Max ₹{MAX_FEE_RUPEES.toLocaleString('en-IN')} per fee.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FeeCard title="Convenience fee">
          <Toggle
            id="fee-convenience-enabled"
            label="Charge a convenience fee"
            checked={value.convenience.enabled}
            onChange={update('convenience', 'enabled')}
          />
          <MoneyField
            id="fee-convenience-amount"
            label="Amount"
            value={value.convenience.amount}
            onChange={update('convenience', 'amount')}
            error={errors.convenience}
            disabled={!value.convenience.enabled}
          />
          <div
            className={`flex flex-wrap gap-5 ${value.convenience.enabled ? '' : 'opacity-50'}`}
          >
            <Toggle
              id="fee-convenience-prepaid"
              label="On online payment"
              checked={value.convenience.applyToPrepaid}
              onChange={update('convenience', 'applyToPrepaid')}
            />
            <Toggle
              id="fee-convenience-cod"
              label="On COD"
              checked={value.convenience.applyToCod}
              onChange={update('convenience', 'applyToCod')}
            />
          </div>
        </FeeCard>

        <FeeCard title="Shipping fee">
          <Toggle
            id="fee-shipping-enabled"
            label="Charge shipping"
            description="When off, this perfume ships free."
            checked={value.shipping.enabled}
            onChange={update('shipping', 'enabled')}
          />
          <MoneyField
            id="fee-shipping-amount"
            label="Amount"
            value={value.shipping.amount}
            onChange={update('shipping', 'amount')}
            error={errors.shipping}
            disabled={!value.shipping.enabled}
          />
        </FeeCard>

        <FeeCard title="Cash on delivery">
          <Toggle
            id="fee-cod-allowed"
            label="Allow cash on delivery"
            description="When off, carts containing this perfume must pay online."
            checked={value.codAllowed}
            onChange={(next) => onChange({ ...value, codAllowed: next })}
          />
          <div className={value.codAllowed ? 'space-y-3' : 'space-y-3 opacity-50'}>
            <Toggle
              id="fee-cod-enabled"
              label="Charge a COD fee"
              description="Only charged on cash-on-delivery orders."
              checked={value.cod.enabled}
              onChange={update('cod', 'enabled')}
            />
            <MoneyField
              id="fee-cod-amount"
              label="Amount"
              value={value.cod.amount}
              onChange={update('cod', 'amount')}
              error={errors.cod}
              disabled={!value.cod.enabled || !value.codAllowed}
            />
          </div>
        </FeeCard>
      </div>
    </div>
  )
}
