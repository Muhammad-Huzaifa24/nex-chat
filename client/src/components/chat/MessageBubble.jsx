import React, { useState } from 'react'
import {
  Check,
  CheckCheck,
  FileText,
  Download,
  Reply,
  Smile,
  Trash2,
  Clock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { ReactionPicker } from './ReactionPicker'
import { LinkPreviewCard } from './LinkPreviewCard'

export const MessageBubble = ({
  message,
  currentUserId,
  isGroup,
  onReply,
  onReact,
  onDelete,
  onRetry,
  onImageClick,
  onScrollToMessage,
  isHighlighted = false,
  isFirstInGroup = true,
  isLastInGroup = true,
}) => {
  const [showOptions, setShowOptions] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [imageHovered, setImageHovered] = useState(false)

  const isOutgoing = message.senderId?._id === currentUserId || message.senderId === currentUserId
  const isDeleted = message.isDeletedForEveryone
  const isPending = message.status === 'pending'
  const isFailed = message.status === 'failed'

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

  // Detect 1-3 solo emojis sent without text
  const getSoloEmojiInfo = (content, type) => {
    if (type !== 'text' || !content) return null
    const trimmed = content.trim()
    const emojiOnlyRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|\u20E3)+$/u
    if (!emojiOnlyRegex.test(trimmed)) return null

    let count = 1
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
      count = Array.from(segmenter.segment(trimmed)).length
    } else {
      count = Array.from(trimmed).length
    }

    if (count > 3) return null
    const fontSize = count === 1 ? 52 : count === 2 ? 40 : 32
    return { isSolo: true, count, fontSize }
  }

  const soloEmojiInfo = getSoloEmojiInfo(message.content, message.type)

  // Extract URL for OpenGraph rich link previews
  const extractFirstUrl = (text) => {
    if (!text || typeof text !== 'string') return null
    const match = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i)
    if (!match) return null
    return match[0].startsWith('http') ? match[0] : `https://${match[0]}`
  }
  const detectedUrl = message.type === 'text' && !isDeleted ? extractFirstUrl(message.content) : null

  // Render message text with clickable WhatsApp-blue links
  const renderFormattedContent = (text) => {
    if (!text || typeof text !== 'string') return null

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
    const parts = text.split(urlRegex)

    if (parts.length === 1) {
      return text
    }

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const href = part.startsWith('http') ? part : `https://${part}`
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: '#53bdeb',
              textDecoration: 'underline',
              wordBreak: 'break-all',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#79d2f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#53bdeb'
            }}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  // Swipe Right to Reply (Mobile touch gesture)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const touchStartRef = React.useRef({ x: 0, y: 0 })
  const hasVibratedRef = React.useRef(false)
  const isSwipingRef = React.useRef(false)

  const handleBubbleTouchStart = (e) => {
    if (e.touches.length !== 1) return
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
    hasVibratedRef.current = false
    isSwipingRef.current = false
  }

  const handleBubbleTouchMove = (e) => {
    if (e.touches.length !== 1) return
    const deltaX = e.touches[0].clientX - touchStartRef.current.x
    const deltaY = e.touches[0].clientY - touchStartRef.current.y

    if (deltaX > 10 && deltaX > Math.abs(deltaY) * 1.3) {
      isSwipingRef.current = true
      const capped = Math.min(Math.max(0, deltaX), 75)
      setSwipeOffset(capped)

      if (capped >= 50 && !hasVibratedRef.current) {
        hasVibratedRef.current = true
        if (navigator.vibrate) navigator.vibrate(25)
      }
    }
  }

  const handleBubbleTouchEnd = () => {
    if (swipeOffset >= 50 && onReply && !isDeleted) {
      onReply(message)
    }
    setSwipeOffset(0)
    isSwipingRef.current = false
  }

  const [showImageActions, setShowImageActions] = useState(false)
  const touchTimerRef = React.useRef(null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40)
      setShowImageActions(true)
    }, 450)
  }

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
      touchTimerRef.current = null
    }
  }

  const handleDownload = (e, url, filename = 'image.jpg') => {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOutgoing ? 'flex-end' : 'flex-start',
        marginBottom: isLastInGroup ? '8px' : '2px',
        padding: '0 16px',
        position: 'relative',
      }}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        setShowOptions(false)
        setShowImageActions(false)
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: isOutgoing ? 'row-reverse' : 'row',
          gap: 8,
          maxWidth: isMobile ? '88%' : '70%',
          width: 'fit-content',
          position: 'relative',
        }}
      >
        {/* Failed Retry Icon on side of bubble */}
        {isFailed && isOutgoing && (
          <button
            onClick={() => onRetry && onRetry(message)}
            title="Failed to send. Click to retry"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--accent-red)',
              color: 'var(--accent-red)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <RotateCcw size={15} />
          </button>
        )}

        {/* Swipe-to-Reply Indicator (WhatsApp Style) */}
        {swipeOffset > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--primary-color)',
              opacity: Math.min(1, swipeOffset / 40),
              transform: `scale(${Math.min(1, swipeOffset / 40)})`,
              transition: isSwipingRef.current ? 'none' : 'all 0.2s ease',
              boxShadow: 'var(--shadow-md)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <Reply size={17} />
          </div>
        )}

        {/* Message Bubble Box */}
        <div
          className={`${isHighlighted ? 'highlight-flash' : ''} ${
            message.status === 'pending' || (Date.now() - new Date(message.createdAt).getTime() < 8000)
              ? 'animate-message-in'
              : ''
          }`}
          onTouchStart={handleBubbleTouchStart}
          onTouchMove={handleBubbleTouchMove}
          onTouchEnd={handleBubbleTouchEnd}
          onTouchCancel={handleBubbleTouchEnd}
          style={{
            backgroundColor: soloEmojiInfo
              ? 'transparent'
              : isOutgoing
                ? 'var(--bubble-outgoing)'
                : 'var(--bubble-incoming)',
            color: isOutgoing ? 'var(--bubble-outgoing-text)' : 'var(--bubble-incoming-text)',
            borderRadius: 'var(--radius-md)',
            borderTopRightRadius: isFirstInGroup && isOutgoing && !soloEmojiInfo ? 0 : 'var(--radius-md)',
            borderTopLeftRadius: isFirstInGroup && !isOutgoing && !soloEmojiInfo ? 0 : 'var(--radius-md)',
            marginRight: isFirstInGroup && isOutgoing && !soloEmojiInfo ? 6 : 0,
            marginLeft: isFirstInGroup && !isOutgoing && !soloEmojiInfo ? 6 : 0,
            padding: soloEmojiInfo
              ? '2px 6px'
              : message.type === 'image' && !message.content
                ? '3px'
                : '6px 9px',
            boxShadow: soloEmojiInfo ? 'none' : '0 1px 0.5px rgba(11,20,26,0.13)',
            position: 'relative',
            minWidth: soloEmojiInfo ? 'auto' : 70,
            width: detectedUrl ? (isMobile ? 'min(380px, 85vw)' : '420px') : 'fit-content',
            maxWidth: '100%',
            boxSizing: 'border-box',
            wordBreak: 'break-word',
            flexShrink: 0,
            border: isFailed ? '1px solid var(--accent-red)' : 'none',
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwipingRef.current
              ? 'none'
              : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {/* Outgoing Speech Bubble Tail (WhatsApp Web SVG) */}
          {isFirstInGroup && isOutgoing && !soloEmojiInfo && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: -8,
                width: 8,
                height: 13,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <svg viewBox="0 0 8 13" width="8" height="13" style={{ display: 'block' }}>
                <path
                  fill="var(--bubble-outgoing)"
                  d="M5.188,1H0v11.193l6.467-8.625 C7.526,2.156,6.958,1,5.188,1z"
                />
              </svg>
            </span>
          )}

          {/* Incoming Speech Bubble Tail (WhatsApp Web SVG) */}
          {isFirstInGroup && !isOutgoing && !soloEmojiInfo && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: -8,
                width: 8,
                height: 13,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <svg viewBox="0 0 8 13" width="8" height="13" style={{ display: 'block' }}>
                <path
                  fill="var(--bubble-incoming)"
                  d="M2.812,1h5.188v11.193l-6.467-8.625C0.474,2.156,1.042,1,2.812,1z"
                />
              </svg>
            </span>
          )}
          {/* Sender Name in Groups */}
          {isGroup && !isOutgoing && (
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--primary-color)',
                marginBottom: 4,
                padding: message.type === 'image' && !message.content ? '4px 8px 0 8px' : 0,
              }}
            >
              {message.senderId?.displayName || message.senderId?.username}
            </div>
          )}

          {/* Quoted / Replied Message Preview — Click to jump to original message */}
          {message.replyTo && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                const targetId = message.replyTo?._id || message.replyTo
                if (targetId && onScrollToMessage) {
                  onScrollToMessage(targetId)
                }
              }}
              title="Click to view original message"
              style={{
                backgroundColor: 'rgba(0,0,0,0.07)',
                borderLeft: '3px solid var(--primary-color)',
                borderRadius: 'var(--radius-xs)',
                padding: '4px 8px',
                marginBottom: 6,
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, transform 0.15s ease',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,168,132,0.18)'
                e.currentTarget.style.transform = 'translateX(2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.07)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                {message.replyTo.senderId?.displayName || message.replyTo.senderId?.username || 'User'}
              </div>
              <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {message.replyTo.content || (message.replyTo.type !== 'text' ? `[${message.replyTo.type}]` : '')}
              </div>
            </div>
          )}

          {/* Deleted Message State */}
          {isDeleted ? (
            <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>🚫</span> This message was deleted
            </div>
          ) : (
            <>
              {/* Media: Image with Click/Hover and Touch-Hold Action Icons */}
              {message.type === 'image' && message.attachmentUrl && (
                <div
                  style={{
                    position: 'relative',
                    marginBottom: message.content ? 6 : 0,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    maxWidth: isMobile ? 'min(330px, 80vw)' : 340,
                    minWidth: isMobile ? 'min(240px, 65vw)' : 260,
                  }}
                  onMouseEnter={() => setImageHovered(true)}
                  onMouseLeave={() => {
                    setImageHovered(false)
                  }}
                  onClick={(e) => {
                    if (imageHovered || showImageActions) {
                      setShowImageActions(!showImageActions)
                    } else if (onImageClick) {
                      onImageClick(message.attachmentUrl)
                    }
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  <img
                    src={message.attachmentUrl}
                    alt="attachment"
                    style={{
                      maxHeight: isMobile ? 360 : 420,
                      minHeight: 180,
                      width: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: 'var(--radius-md)',
                      transition: 'opacity 0.2s ease',
                      opacity: (imageHovered || showImageActions) ? 0.88 : 1,
                    }}
                  />

                  {/* Action Buttons Overlay (on hover, on left click, or on mobile touch hold) */}
                  {(imageHovered || showImageActions) && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.35)',
                        backdropFilter: 'blur(2px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        animation: 'fadeIn 0.15s ease forwards',
                        zIndex: 2,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setShowReactionPicker(!showReactionPicker)}
                        title="React"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <Smile size={16} />
                      </button>

                      <button
                        onClick={() => onReply(message)}
                        title="Reply"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <Reply size={16} />
                      </button>

                      <button
                        onClick={(e) => handleDownload(e, message.attachmentUrl, message.attachmentMeta?.filename || 'image.jpg')}
                        title="Download image"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <Download size={16} />
                      </button>

                      <button
                        onClick={() => onDelete(message)}
                        title="Delete"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(239, 68, 68, 0.65)',
                          color: 'white',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  {/* WhatsApp-Style Photo Overlay Timestamp (when no description/caption) */}
                  {!message.content && !isDeleted && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 7px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(3px)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 500,
                        lineHeight: 1.2,
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {isOutgoing && (
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {isPending ? (
                            <Clock size={12} color="#ffffff" style={{ opacity: 0.8 }} />
                          ) : message.status === 'read' ? (
                            <CheckCheck size={13} color="#53bdeb" />
                          ) : message.status === 'delivered' ? (
                            <CheckCheck size={13} color="#ffffff" />
                          ) : (
                            <Check size={13} color="#ffffff" />
                          )}
                        </span>
                      )}
                    </div>
                  )}
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
              {message.type === 'file' && (
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
                  {message.attachmentUrl && (
                    <a
                      href={message.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      style={{ color: 'var(--primary-color)', padding: 4 }}
                    >
                      <Download size={18} />
                    </a>
                  )}
                </div>
              )}

              {/* Rich OpenGraph Link Preview Card */}
              {detectedUrl && (
                <div style={{ width: '100%', minWidth: isMobile ? 'min(240px, 75vw)' : 260, boxSizing: 'border-box' }}>
                  <LinkPreviewCard url={detectedUrl} />
                </div>
              )}

              {/* Text Content */}
              {message.content && (
                <div
                  style={{
                    fontSize: soloEmojiInfo ? `${soloEmojiInfo.fontSize}px` : 'var(--font-size-base)',
                    lineHeight: soloEmojiInfo ? 1.15 : 1.4,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    padding: message.type === 'image' ? '4px 6px' : soloEmojiInfo ? '0 2px' : 0,
                    textAlign: soloEmojiInfo ? (isOutgoing ? 'right' : 'left') : 'left',
                    filter: soloEmojiInfo ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : 'none',
                  }}
                >
                  <span>{renderFormattedContent(message.content)}</span>
                  {!soloEmojiInfo && (
                    <span
                      style={{
                        float: 'right',
                        marginLeft: 10,
                        marginTop: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: '11px',
                        color: isFailed
                          ? 'var(--accent-red)'
                          : isOutgoing
                            ? 'var(--bubble-outgoing-meta)'
                            : 'var(--bubble-incoming-meta)',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'bottom',
                      }}
                    >
                      {isFailed ? (
                        <span
                          onClick={() => onRetry && onRetry(message)}
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 500 }}
                        >
                          <AlertCircle size={12} /> Not sent · Tap to retry
                        </span>
                      ) : (
                        <>
                          <span>{formatTime(message.createdAt)}</span>
                          {isOutgoing && !isDeleted && (
                            <span>
                              {isPending ? (
                                <Clock size={12} style={{ opacity: 0.75 }} />
                              ) : message.status === 'read' ? (
                                <CheckCheck size={14} color="var(--tick-read)" />
                              ) : message.status === 'delivered' ? (
                                <CheckCheck size={14} color="var(--tick-delivered)" />
                              ) : (
                                <Check size={14} color="var(--tick-sent)" />
                              )}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Fallback Bottom Timestamp for non-text attachments (audio, video, file) or solo emojis */}
          {!(message.type === 'image' && !message.content) && (!message.content || soloEmojiInfo) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4,
                marginTop: soloEmojiInfo ? 4 : 2,
                fontSize: 'var(--font-size-xs)',
                color: isFailed
                  ? 'var(--accent-red)'
                  : isOutgoing
                    ? 'var(--bubble-outgoing-meta)'
                    : 'var(--bubble-incoming-meta)',
                padding: soloEmojiInfo ? '2px 8px' : 0,
                backgroundColor: soloEmojiInfo ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
                borderRadius: soloEmojiInfo ? '999px' : '0',
                backdropFilter: soloEmojiInfo ? 'blur(4px)' : 'none',
                width: 'fit-content',
                marginLeft: isOutgoing ? 'auto' : 0,
              }}
            >
              {isFailed ? (
                <span
                  onClick={() => onRetry && onRetry(message)}
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                >
                  <AlertCircle size={12} /> Not sent · Tap to retry
                </span>
              ) : (
                <>
                  <span>{formatTime(message.createdAt)}</span>
                  {isOutgoing && !isDeleted && (
                    <span>
                      {isPending ? (
                        <Clock size={13} style={{ opacity: 0.75 }} />
                      ) : message.status === 'read' ? (
                        <CheckCheck size={14} color="var(--tick-read)" />
                      ) : message.status === 'delivered' ? (
                        <CheckCheck size={14} color="var(--tick-delivered)" />
                      ) : (
                        <Check size={14} color="var(--tick-sent)" />
                      )}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Controls for Non-Image messages (Reply, React, Delete) */}
        {showOptions && !isDeleted && message.type !== 'image' && !isFailed && !isPending && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              [isOutgoing ? 'right' : 'left']: 'calc(100% + 6px)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '20px',
              padding: '2px 4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color)',
              zIndex: 10,
              whiteSpace: 'nowrap',
              animation: 'fadeIn 0.15s ease',
            }}
          >
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
              className="btn-icon hover-danger"
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
        <ReactionPicker
          isOutgoing={isOutgoing}
          onSelectEmoji={(emoji) => {
            onReact(message._id, emoji)
            setShowReactionPicker(false)
          }}
          onClose={() => setShowReactionPicker(false)}
        />
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
              (r) =>
                (r.userId?._id || r.userId)?.toString() === currentUserId?.toString() &&
                r.emoji === emoji
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
