import React, { useEffect } from 'react'

export const BottomDrawer = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.2s ease forwards',
        }}
      />

      {/* Drawer Card */}
      <div
        className="animate-slide-up"
        style={{
          position: 'relative',
          backgroundColor: 'var(--bg-surface)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          padding: '12px 20px 28px',
          borderTop: '1px solid var(--border-color)',
          boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto',
        }}
      >
        {/* Handle Bar */}
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'var(--text-muted)',
            borderRadius: '999px',
            margin: '4px auto 16px',
            opacity: 0.6,
          }}
        />

        {/* Title */}
        {title && (
          <h3
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 16px 0',
              paddingLeft: '4px',
            }}
          >
            {title}
          </h3>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  )
}
