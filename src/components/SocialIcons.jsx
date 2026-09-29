export function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20l1.2-3.9A8.3 8.3 0 1 1 8.3 19L4 20Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 8.3c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.6 1.4c.1.3 0 .5-.1.7l-.4.5c-.1.1-.2.3-.1.5.3.6.8 1.2 1.3 1.6.5.4 1 .7 1.6 1 .2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.3.3.6-.1.5-.3.9-.7 1.2-.5.3-1 .4-1.6.3-1.2-.2-2.3-.8-3.2-1.6-.9-.8-1.7-1.8-2.2-2.9-.3-.8-.3-1.5.2-2.1Z"
        fill="currentColor"
      />
    </svg>
  )
}
