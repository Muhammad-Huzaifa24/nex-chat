import React, { useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'

export const MessageList = ({
  messages = [],
  currentUserId,
  isGroup,
  onReply,
  onReact,
  onDelete,
  onImageClick,
  isLoading,
}) => {
  const bottomRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Group messages by date
  const renderDateSeparator = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    let label = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })

    if (date.toDateString() === now.toDateString()) {
      label = 'Today'
    } else {
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      if (date.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday'
      }
    }

    return (
      <div
        key={`date-${dateStr}`}
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '16px 0',
        }}
      >
        <span
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {label}
        </span>
      </div>
    )
  }

  let lastDate = ''

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.length === 0 && !isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          No messages here yet. Say hello! 👋
        </div>
      )}

      {messages.map((msg) => {
        const msgDate = new Date(msg.createdAt).toDateString()
        const showDate = msgDate !== lastDate
        lastDate = msgDate

        return (
          <React.Fragment key={msg._id}>
            {showDate && renderDateSeparator(msg.createdAt)}
            <MessageBubble
              message={msg}
              currentUserId={currentUserId}
              isGroup={isGroup}
              onReply={onReply}
              onReact={onReact}
              onDelete={onDelete}
              onImageClick={onImageClick}
            />
          </React.Fragment>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}
