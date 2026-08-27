import React from 'react'
import { useToastStore } from '../../store/toastStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 390,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        let Icon = Info
        let borderColor = 'var(--accent-blue)'

        if (toast.type === 'success') {
          Icon = CheckCircle2
          borderColor = 'var(--primary-color)'
        } else if (toast.type === 'error') {
          Icon = AlertCircle
          borderColor = 'var(--accent-red)'
        }

        const duration = toast.duration || 3500

        return (
          <div
            key={toast.id}
            className={toast.isExiting ? 'animate-toast-out' : 'animate-toast-in'}
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${borderColor}`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)',
              fontSize: 'var(--font-size-sm)',
              overflow: 'hidden',
              transformOrigin: 'top right',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Icon size={19} color={borderColor} style={{ flexShrink: 0 }} />
                <span style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-full)',
                  transition: 'color var(--transition-fast)',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Bottom Progress countdown line */}
            {duration > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: borderColor,
                    animation: `toastProgressBar ${duration}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
