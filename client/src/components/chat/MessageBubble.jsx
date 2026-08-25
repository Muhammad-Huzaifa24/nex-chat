import React, { useState } from 'react'
import { Check, CheckCheck, FileText, Download, Reply, Smile, Trash2, MoreHorizontal } from 'lucide-react'
import { ReactionPicker } from './ReactionPicker'

export const MessageBubble = ({
  message,
  currentUserId,
  isGroup,
  onReply,
  onReact,
  onDelete,
  onImageClick,
}) => {
  const [showOptions, setShowOptions] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const isOutgoing = message.senderId?._id === currentUserId
  const isDeleted = message.isDeletedForEveryone

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Format file size
  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOutgoing ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
        padding: '0 16px',
        position: 'relative',
      }}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        setShowOptions(false)
        setShowReactionPicker(false)
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: isOutgoing ? 'row-reverse' : 'row',
          gap: 6,
          maxWidth: '75%',
        }}
      >
        {/* Message Bubble Box */}
        <div
          style={{
            backgroundColor: isOutgoing ? 'var(--bubble-outgoing)' : 'var(--bubble-incoming)',
            color: isOutgoing ? 'var(--bubble-outgoing-text)' : 'var(--bubble-incoming-text)',
            borderRadius: 'var(--radius-md)',
            borderTopRightRadius: isOutgoing ? 0 : 'var(--radius-md)',
            borderTopLeftRadius: !isOutgoing ? 0 : 'var(--radius-md)',
            padding: '8px 12px',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            minWidth: 90,
            wordBreak: 'break-word',
          }}
        >
          {/* Sender Name in Groups */}
          {isGroup && !isOutgoing && (
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--primary-color)',
                marginBottom: 4,
              }}
            >
              {message.senderId?.displayName || message.senderId?.username}
            </div>
          )}

          {/* Quoted / Replied Message Preview */}
          {message.replyTo && (
            <div
              style={{
                backgroundColor: 'rgba(0,0,0,0.06)',
                borderLeft: '3px solid var(--primary-color)',
                borderRadius: 'var(--radius-xs)',
                padding: '4px 8px',
                marginBottom: 6,
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                {message.replyTo.senderId?.displayName || 'User'}
              </div>
              <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {message.replyTo.content || (message.replyTo.type !== 'text' ? `[${message.replyTo.type}]` : '')}
              </div>
            </div>
          )}

          {/* Deleted Message State */}
          {isDeleted ? (
            <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              🚫 This message was deleted
            </div>
          ) : (
            <>
              {/* Media: Image */}
              {message.type === 'image' && message.attachmentUrl && (
                <div style={{ marginBottom: 6, borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer' }}>
                  <img
                    src={message.attachmentUrl}
                    alt="attachment"
                    style={{ maxHeight: 280, width: '100%', objectFit: 'cover' }}
                    onClick={() => onImageClick && onImageClick(message.attachmentUrl)}
                  />
                </div>
              )}

              {/* Media: Video */}
              {message.type === 'video' && message.attachmentUrl && (
                <div style={{ marginBottom: 6, borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxWidth: 300 }}>
                  <video controls style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}>
                    <source src={message.attachmentUrl} type={message.attachmentMeta?.mimeType || 'video/mp4'} />
                    Your browser does not support HTML video.
                  </video>
                </div>
              )}

              {/* Media: Audio */}
              {message.type === 'audio' && message.attachmentUrl && (
                <div style={{ marginBottom: 6, maxWidth: 280 }}>
                  <audio controls style={{ width: '100%', height: 36 }}>
                    <source src={message.attachmentUrl} type={message.attachmentMeta?.mimeType || 'audio/mp3'} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {/* Media: File / Document */}
              {message.type === 'file' && message.attachmentUrl && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    backgroundColor: 'rgba(0,0,0,0.06)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 6,
                  }}
                >
                  <FileText size={28} color="var(--primary-color)" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }} className="truncate">
                      {message.attachmentMeta?.filename || 'Document'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      {formatBytes(message.attachmentMeta?.size)}
                    </div>
                  </div>
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    style={{ color: 'var(--primary-color)', padding: 4 }}
                  >
                    <Download size={18} />
                  </a>
                </div>
              )}

              {/* Text Content */}
              {message.content && (
                <div
                  style={{
                    fontSize: 'var(--font-size-base)',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </div>
              )}
            </>
          )}

          {/* Timestamp & Status ticks */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              marginTop: 2,
              fontSize: 'var(--font-size-xs)',
              color: isOutgoing ? 'var(--bubble-outgoing-meta)' : 'var(--bubble-incoming-meta)',
            }}
          >
            <span>{formatTime(message.createdAt)}</span>
            {isOutgoing && !isDeleted && (
              <span>
                {message.status === 'read' ? (
                  <CheckCheck size={14} color="var(--tick-read)" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck size={14} color="var(--tick-delivered)" />
                ) : (
                  <Check size={14} color="var(--tick-sent)" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls (Reply, React, Delete) */}
        {showOptions && !isDeleted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="btn-icon"
              style={{ width: 28, height: 28 }}
              title="React"
            >
              <Smile size={15} />
            </button>
            <button
              onClick={() => onReply(message)}
              className="btn-icon"
              style={{ width: 28, height: 28 }}
              title="Reply"
            >
              <Reply size={15} />
            </button>
            <button
              onClick={() => onDelete(message)}
              className="btn-icon"
              style={{ width: 28, height: 28 }}
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Floating Reaction Picker */}
      {showReactionPicker && (
        <div style={{ marginTop: 4 }}>
          <ReactionPicker
            onSelectEmoji={(emoji) => {
              onReact(message._id, emoji)
              setShowReactionPicker(false)
            }}
          />
        </div>
      )}

      {/* Emoji Reactions List below bubble */}
      {message.reactions && message.reactions.length > 0 && !isDeleted && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: -6,
            marginLeft: isOutgoing ? 0 : 8,
            marginRight: isOutgoing ? 8 : 0,
            zIndex: 1,
          }}
        >
          {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji) => {
            const count = message.reactions.filter((r) => r.emoji === emoji).length
            const isUserReacted = message.reactions.some(
              (r) => r.userId === currentUserId && r.emoji === emoji
            )
            return (
              <button
                key={emoji}
                onClick={() => onReact(message._id, emoji)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: 'var(--bg-surface)',
                  border: isUserReacted ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 6px',
                  fontSize: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                }}
              >
                <span>{emoji}</span>
                {count > 1 && <span style={{ fontWeight: 600, fontSize: 10 }}>{count}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
