/** 3D PNG from thiings.co. Decorative callers pass an empty alt. */
export default function ThiingsIcon({ name, alt = '', className = '' }) {
  return (
    <img
      src={`/icons/${name}.png`}
      alt={alt}
      draggable={false}
      className={`pointer-events-none object-contain select-none ${className}`}
    />
  )
}
