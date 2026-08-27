import React, { useEffect, useState } from 'react'
import { useLoaderStore } from '../../store/loaderStore'

export const GlobalLoader = () => {
  const activeRequests = useLoaderStore((state) => state.activeRequests)
  const isLoading = activeRequests > 0
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let interval = null

    if (isLoading) {
      setVisible(true)
      setProgress((prev) => (prev === 0 ? 25 : prev))

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) return prev
          return prev + Math.random() * 12
        })
      }, 200)
    } else {
      // Completed
      setProgress(100)
      const timeout = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 350)
      return () => clearTimeout(timeout)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 99999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: 'var(--primary-color)',
          boxShadow: '0 0 10px var(--primary-color), 0 0 5px var(--primary-color)',
          transition: progress === 100 ? 'width 0.2s ease-out, opacity 0.3s ease' : 'width 0.3s ease-out',
          opacity: progress === 100 ? 0 : 1,
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  )
}
