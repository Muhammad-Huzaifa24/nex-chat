import React from 'react'
import { X, CornerUpLeft } from 'lucide-react'

export const ReplyPreview = ({ replyMessage, onCancel }) => {
  if (!replyMessage) return null

  const senderName = replyMessage.senderId?.displayName || replyMessage.senderId?.username || 'User'

  const getContentPreview = () => {
    if (replyMessage.type === 'image') return '📷 Photo'
    if (replyMessage.type === 'video') return '🎥 Video'
    if (replyMessage.type === 'audio') return '🎵 Audio'
    if (replyMessage.type === 'file') return `📄 ${replyMessage.attachmentMeta?.filename || 'Document'}`
    return replyMessage.content
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: 'var(--bg-header)',
        borderLeft: '4px solid var(--primary-color)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CornerUpLeft size={16} color="var(--primary-color)" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--primary-color)' }}>
            Replying to {senderName}
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getContentPreview()}
          </div>
        </div>
      </div>

      <button
        onClick={onCancel}
        className="btn-icon"
        style={{ width: 28, height: 28 }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
