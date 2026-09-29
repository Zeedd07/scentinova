/**
 * Storefront form label: small letter-spaced uppercase text, with a crimson
 * asterisk for required fields. Renders a <label> when `htmlFor` is given,
 * otherwise a <span> for use inside a wrapping <label>.
 */
export default function FieldLabel({ children, required = false, htmlFor, id, className = '' }) {
  const Tag = htmlFor ? 'label' : 'span'
  return (
    <Tag
      id={id}
      htmlFor={htmlFor}
      className={`mb-1.5 block text-[11px] tracking-[0.28em] text-muted uppercase ${className}`}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="ml-1 text-[0.85em] tracking-normal text-scent-red">
          *
        </span>
      )}
    </Tag>
  )
}
