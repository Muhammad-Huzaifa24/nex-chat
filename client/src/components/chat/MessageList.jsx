import React, { useRef, useEffect, useState, useCallback } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChevronDown } from 'lucide-react'
import { MessageListSkeleton } from '../ui/Skeleton'

export const MessageList = ({
  messages = [],
  currentUserId,
  isGroup,
  onReply,
  onReact,
  onDelete,
  onRetry,
  onImageClick,
  isLoading,
}) => {
  const containerRef = useRef(null)
  const bottomRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const prevMessagesCountRef = useRef(0)
  const isInitialLoadRef = useRef(true)

  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState(null)
  const highlightTimeoutRef = useRef(null)

  // Track scroll position to decide whether to show the "scroll down" arrow
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    const nearBottom = distanceFromBottom < 140
    isNearBottomRef.current = nearBottom
    setShowScrollBottom(!nearBottom)
  }, [])

  // Smart scroll on message changes (avoids auto-scrolling on window focus if scrolled up)
  useEffect(() => {
    if (!messages || messages.length === 0) {
      prevMessagesCountRef.current = 0
      return
    }

    const isNewMessageAdded = messages.length > prevMessagesCountRef.current
    const lastMsg = messages[messages.length - 1]
    const isSentByMe = lastMsg && (lastMsg.senderId?._id === currentUserId || lastMsg.senderId === currentUserId)

    if (isInitialLoadRef.current) {
      // First load of conversation: jump straight to bottom without animation
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      isInitialLoadRef.current = false
    } else if (isNewMessageAdded) {
      // If user sent a message, always scroll down smoothly
      // If someone else sent a message and user is already near bottom, scroll down
      if (isSentByMe || isNearBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    prevMessagesCountRef.current = messages.length
  }, [messages, currentUserId])

  // Reset initial load flag when loading starts
  useEffect(() => {
    if (isLoading) {
      isInitialLoadRef.current = true
    }
  }, [isLoading])

  // Scroll to bottom manually (button click)
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollBottom(false)
  }

  // Jump to specific message (e.g. on reply click) and trigger highlight pulse
  const scrollToMessage = useCallback((targetId) => {
    if (!targetId) return
    const el = document.getElementById(`msg-${targetId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMessageId(targetId)

      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId(null)
      }, 1800)
    }
  }, [])

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
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <style>{`
        @keyframes message-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scrollBtnIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      {/* Main Scrollable Messages Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading && messages.length === 0 && <MessageListSkeleton />}

        {isLoading && messages.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '12px 0',
              width: '100%',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '2px dashed var(--border-subtle)',
                borderTop: '2px solid var(--primary-color)',
                borderRadius: '50%',
                animation: 'message-spin 0.75s linear infinite',
              }}
            />
          </div>
        )}

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
              <div id={`msg-${msg._id}`}>
                <MessageBubble
                  message={msg}
                  currentUserId={currentUserId}
                  isGroup={isGroup}
                  onReply={onReply}
                  onReact={onReact}
                  onDelete={onDelete}
                  onRetry={onRetry}
                  onImageClick={onImageClick}
                  onScrollToMessage={scrollToMessage}
                  isHighlighted={highlightedMessageId === msg._id}
                />
              </div>
            </React.Fragment>
          )
        })}

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Floating Scroll-To-Bottom Down Arrow Button (WhatsApp Style) */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          title="Scroll to bottom"
          style={{
            position: 'absolute',
            bottom: 16,
            right: 18,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            animation: 'scrollBtnIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
            e.currentTarget.style.color = 'var(--primary-color)'
            e.currentTarget.style.transform = 'scale(1.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface)'
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <ChevronDown size={20} />
        </button>
      )}
    </div>
  )
}
