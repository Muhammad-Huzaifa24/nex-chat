import React, { useEffect, useState } from 'react'
import { useLoaderStore } from '../../store/loaderStore'

export const GlobalLoader = () => {
  const activeRequests = useLoaderStore((state) => state.activeRequests)
  const isLoading = activeRequests > 0
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setVisible(true)
    } else {
      const timeout = setTimeout(() => {
        setVisible(false)
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes whatsapp-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          pointerEvents: 'auto',
          transition: 'opacity 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: '24px 36px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3.5px solid var(--border-subtle)',
              borderTopColor: 'var(--primary-color)',
              borderRadius: '50%',
              animation: 'whatsapp-spin 0.95s linear infinite',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}
          >
            Connecting...
          </span>
        </div>
      </div>
    </>
  )
}
