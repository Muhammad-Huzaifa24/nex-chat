import React from 'react'
import { Modal } from '../ui/Modal'
import { Trash2, AlertTriangle } from 'lucide-react'

export const DeleteMessageModal = ({ isOpen, onClose, message, currentUserId, onDeleteConfirm }) => {
  if (!isOpen || !message) return null

  const isSender =
    (message.senderId?._id || message.senderId) === currentUserId ||
    (typeof message.senderId === 'string' && message.senderId === currentUserId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete message?">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trash2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>
              {isSender ? 'Choose how you want to delete this message' : 'Delete message from your chat?'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {isSender
                ? 'Deleting for everyone will remove the message for all participants. Deleting for me removes it from your device only.'
                : 'This message will be removed from your chat history.'}
            </div>
          </div>
        </div>

        {/* Message preview snippet */}
        {message.content && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              borderLeft: '3px solid var(--border-color)',
              maxHeight: 60,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            "{message.content}"
          </div>
        )}

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
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
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-red)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
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
              width: '100%',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-hover)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            Delete for me
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: 'var(--font-size-sm)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
