import React from 'react'
import { Modal } from '../ui/Modal'

export const DeleteMessageModal = ({ isOpen, onClose, message, currentUserId, onDeleteConfirm }) => {
  if (!isOpen || !message) return null

  const isSender =
    (message.senderId?._id || message.senderId) === currentUserId ||
    (typeof message.senderId === 'string' && message.senderId === currentUserId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth={360}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 0' }}>
        <h3
          style={{
            fontSize: 'var(--font-size-md, 16px)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Delete message?
        </h3>

        {/* WhatsApp styled action buttons (stacked/right aligned) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 12,
            marginTop: 8,
          }}
        >
          {isSender && (
            <button
              onClick={() => {
                onDeleteConfirm('everyone')
                onClose()
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color, #00a884)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 'var(--radius-xs)',
                transition: 'opacity var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Delete for everyone
            </button>
          )}

          <button
            onClick={() => {
              onDeleteConfirm('me')
              onClose()
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color, #00a884)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Delete for me
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color, #00a884)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
