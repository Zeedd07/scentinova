/**
 * Searchable single-select combobox (WAI-ARIA 1.2 "editable combobox with list
 * autocomplete"). The input doubles as the search box; only values from
 * `options` can be committed, so free text like "MumbaiXYZ" is never accepted.
 */
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import FieldLabel from './FieldLabel'
import { findOption, rankMatches } from '../../lib/indiaLocations'

const MAX_VISIBLE = 100
const PANEL_ROOM = 280

const identity = (o) => o
const noAliases = () => []

function Chevron({ open }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-4 w-4 text-muted transition-transform duration-200 motion-reduce:transition-none ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-scent-red">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const Combobox = forwardRef(function Combobox(
  {
    id: idProp,
    label,
    required = false,
    name,
    autoComplete = 'off',
    options,
    value,
    onChange,
    onInvalid,
    getLabel = identity,
    getAliases = noAliases,
    placeholder,
    disabled = false,
    disabledPlaceholder,
    loading = false,
    loadingText = 'Loading…',
    loadError = '',
    onRetry,
    emptyText = 'No matches found.',
    invalidText = 'Please choose an option from the list.',
    error = '',
  },
  forwardedRef,
) {
  const autoId = useId()
  const id = idProp || `combobox-${autoId}`
  const listId = `${id}-listbox`
  const errorId = `${id}-error`
  const reduceMotion = useReducedMotion()

  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const [dirty, setDirty] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [openUp, setOpenUp] = useState(false)
  const pendingTextRef = useRef('')

  const setInputRef = useCallback(
    (node) => {
      inputRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  // Reflect external value changes (e.g. city cleared when the state changes).
  useEffect(() => {
    if (!dirty) setQuery(value || '')
  }, [value, dirty])

  const selected = useMemo(
    () => (value ? findOption(options, value, { getLabel }) : null),
    [options, value, getLabel],
  )

  const { visible, truncated } = useMemo(() => {
    const ranked = rankMatches(options, dirty ? query : '', { limit: MAX_VISIBLE + 1, getLabel })
    let list = ranked.slice(0, MAX_VISIBLE)
    if (!dirty && selected && !list.includes(selected)) list = [selected, ...list.slice(0, MAX_VISIBLE - 1)]
    return { visible: list, truncated: ranked.length > MAX_VISIBLE }
  }, [options, query, dirty, selected, getLabel])

  const select = (option) => {
    const text = getLabel(option)
    setQuery(text)
    setDirty(false)
    setOpen(false)
    setActiveIndex(-1)
    pendingTextRef.current = ''
    onChange(option)
  }

  /** Accept typed/autofilled text only if it exactly matches an option. */
  const commit = (text) => {
    setOpen(false)
    setActiveIndex(-1)
    setDirty(false)
    const trimmed = text.trim()
    if (!trimmed) {
      setQuery('')
      if (value) onChange(null)
      return
    }
    if (loading) {
      // Options not here yet (e.g. autofill right after choosing a state): retry once they load.
      pendingTextRef.current = trimmed
      setQuery(trimmed)
      return
    }
    const match = findOption(options, trimmed, { getLabel, getAliases })
    if (match) {
      select(match)
    } else {
      setQuery('')
      if (value) onChange(null)
      onInvalid?.(invalidText)
    }
  }

  useEffect(() => {
    if (loading || !pendingTextRef.current) return
    const text = pendingTextRef.current
    pendingTextRef.current = ''
    const match = findOption(options, text, { getLabel, getAliases })
    if (match) {
      setQuery(getLabel(match))
      onChange(match)
    } else {
      setQuery('')
      onInvalid?.(invalidText)
    }
    // Only re-run when the options finish loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, options])

  const openList = () => {
    if (disabled || open) return
    const rect = inputRef.current?.getBoundingClientRect()
    if (rect) {
      const below = window.innerHeight - rect.bottom
      setOpenUp(below < PANEL_ROOM && rect.top > below)
    }
    setOpen(true)
    setActiveIndex(selected ? Math.max(0, visible.indexOf(selected)) : 0)
  }

  const closeList = () => {
    setOpen(false)
    setActiveIndex(-1)
    if (dirty) commit(query)
  }

  // Close on pointer down outside (touch devices don't always blur the input).
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) closeList()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  })

  useEffect(() => {
    if (!open || activeIndex < 0) return
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const onInputChange = (e) => {
    const text = e.target.value
    setQuery(text)
    setDirty(true)
    // Browser autofill changes the value without focusing the field.
    if (document.activeElement !== inputRef.current) {
      commit(text)
      return
    }
    if (!open) openList()
    setActiveIndex(0)
  }

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) openList()
        else setActiveIndex((i) => Math.min(i + 1, visible.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) openList()
        else setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setActiveIndex(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setActiveIndex(visible.length - 1)
        }
        break
      case 'Enter':
        if (open) {
          e.preventDefault()
          if (visible[activeIndex]) select(visible[activeIndex])
        } else if (dirty) {
          e.preventDefault()
          commit(query)
        }
        break
      case 'Escape':
        if (open || dirty) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(false)
          setActiveIndex(-1)
          setDirty(false)
          setQuery(value || '')
        }
        break
      default:
    }
  }

  const activeId = open && activeIndex >= 0 && visible[activeIndex] ? `${id}-opt-${activeIndex}` : undefined
  const describedBy = error ? errorId : undefined
  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, y: openUp ? 4 : -4, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: openUp ? 4 : -4, scale: 0.98 },
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
      }

  let status = null
  if (loadError) {
    status = (
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-charcoal">
        <span>{loadError}</span>
        {onRetry && (
          <button
            type="button"
            className="text-[11px] tracking-[0.2em] text-scent-red uppercase underline underline-offset-4"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    )
  } else if (loading) {
    status = (
      <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-muted" role="status">
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border border-stone border-t-scent-red motion-reduce:animate-none"
        />
        {loadingText}
      </div>
    )
  } else if (!visible.length) {
    status = <p className="px-4 py-3 text-sm text-muted">{emptyText}</p>
  }

  return (
    <div ref={wrapperRef} className="relative">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        <input
          ref={setInputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={disabled ? disabledPlaceholder : placeholder}
          value={query}
          onChange={onInputChange}
          onFocus={openList}
          onClick={openList}
          onBlur={closeList}
          onKeyDown={onKeyDown}
          className={`w-full border bg-ivory py-3 pr-10 pl-4 text-base text-charcoal outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted/70 focus:border-scent-red focus:ring-1 focus:ring-scent-red/20 disabled:cursor-not-allowed disabled:bg-stone/25 disabled:text-muted ${
            error ? 'border-scent-red' : 'border-stone'
          }`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <Chevron open={open} />
        </span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            {...motionProps}
            style={{ transformOrigin: openUp ? 'bottom center' : 'top center' }}
            className={`absolute right-0 left-0 z-30 border border-stone bg-warm-white shadow-[0_12px_32px_-12px_rgba(23,21,18,0.25)] ${
              openUp ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
            onMouseDown={(e) => e.preventDefault()}
          >
            {status}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={label}
              className="max-h-[min(16rem,45vh)] overflow-y-auto overscroll-contain py-1"
              hidden={Boolean(status)}
            >
              {visible.map((option, index) => {
                const text = getLabel(option)
                const isSelected = option === selected
                const isActive = index === activeIndex
                return (
                  <li
                    key={text}
                    id={`${id}-opt-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => select(option)}
                    onPointerMove={() => setActiveIndex(index)}
                    className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[15px] text-charcoal ${
                      isSelected
                        ? isActive
                          ? 'bg-scent-red/[0.14]'
                          : 'bg-scent-red/10'
                        : isActive
                          ? 'bg-scent-red/[0.06]'
                          : ''
                    }`}
                  >
                    <span className="min-w-0 break-words">{text}</span>
                    {isSelected && <Check />}
                  </li>
                )
              })}
            </ul>
            {truncated && !status && (
              <p className="border-t border-stone px-4 py-2 text-[12px] text-muted">
                Keep typing to narrow the list.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p id={errorId} className="mt-1.5 text-[12px] text-scent-red">
          {error}
        </p>
      )}
    </div>
  )
})

export default Combobox
