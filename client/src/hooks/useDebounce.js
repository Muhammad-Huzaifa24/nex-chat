import { useState, useEffect } from 'react'

/**
 * Custom hook to debounce any fast-changing value (e.g. search query)
 * @param {*} value - The input value to debounce
 * @param {number} delay - Delay in milliseconds (default 1500ms / 1.5 sec)
 * @returns {*} The debounced value
 */
export const useDebounce = (value, delay = 1500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
