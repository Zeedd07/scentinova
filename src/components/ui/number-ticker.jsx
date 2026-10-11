import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"

function defaultFormat(value, decimalPlaces) {
  return Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value)
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  formatValue,
  ...props
}) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })
  const format = (n) =>
    formatValue ? formatValue(n) : defaultFormat(n, decimalPlaces)

  useEffect(() => {
    let timer = null

    if (isInView && !reduceMotion) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value)
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [motionValue, isInView, delay, value, direction, startValue, reduceMotion])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          const n = Number(latest.toFixed(decimalPlaces))
          ref.current.textContent = formatValue ? formatValue(n) : defaultFormat(n, decimalPlaces)
        }
      }),
    [springValue, decimalPlaces, formatValue]
  )

  const finalValue = direction === "down" ? startValue : value

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-wider text-black tabular-nums dark:text-white",
        className
      )}
      {...props}
    >
      {format(reduceMotion ? finalValue : direction === "down" ? value : startValue)}
    </span>
  )
}
