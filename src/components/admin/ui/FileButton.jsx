/**
 * Button that opens the native file chooser (shadcn has no file input of its own).
 */
import { useRef } from 'react'
import { Button } from '@/components/ui/button'

export default function FileButton({
  accept,
  multiple = false,
  disabled = false,
  onChange,
  variant = 'quiet',
  className,
  children,
}) {
  const inputRef = useRef(null)
  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {children}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </>
  )
}
