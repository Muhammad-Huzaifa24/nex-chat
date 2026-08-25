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
        gap: 10,
        maxWidth: 380,
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

        return (
          <div
            key={toast.id}
            className="animate-slide-left"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 16px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${borderColor}`,
              boxShadow: 'var(--shadow-lg)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={18} color={borderColor} />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
