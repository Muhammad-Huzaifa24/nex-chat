import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  Info,
  Trash2,
  X,
} from 'lucide-react'
import { BottomDrawer } from '../ui/BottomDrawer'
import { useToastStore } from '../../store/toastStore'

export const ChatHeader = ({
  conversation,
  currentUserId,
  onBack,
  onOpenInfo,
  typingUsers,
}) => {
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [showMenu, setShowMenu] = useState(false)
  const [showCallDrawer, setShowCallDrawer] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showMenu])

  const otherParticipant = !conversation.isGroup
    ? conversation.participants?.find(
        (p) => (p?._id?.toString() || p?.toString()) !== currentUserId?.toString()
      )
    : null

  const title = conversation.isGroup
    ? conversation.groupName
    : otherParticipant?.displayName || otherParticipant?.username || 'User'

  const avatarSrc = conversation.isGroup ? conversation.groupAvatar : otherParticipant?.avatar
  const isOnline = !conversation.isGroup && otherParticipant?.isOnline

  // Subtitle / status line (filtered to ensure current user is never shown as typing to themselves)
  const rawTyping = typingUsers[conversation._id] || {}
  const typingEntries = Object.entries(rawTyping).filter(
    ([id]) => id.toString() !== currentUserId?.toString()
  )
  const isTyping = typingEntries.length > 0

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'offline'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'offline'

    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 1) return 'last seen just now'

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (isToday) {
      return `last seen today at ${timeStr}`
    } else if (isYesterday) {
      return `last seen yesterday at ${timeStr}`
    } else {
      return `last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`
    }
  }

  const getSubtitle = () => {
    if (isTyping) {
      const names = typingEntries.map(([, name]) => name).join(', ')
      return (
        <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>
          {names} typing...
        </span>
      )
    }

    if (conversation.isGroup) {
      const names = conversation.participants?.map((p) => p.displayName || p.username).join(', ')
      return <span className="truncate">{names}</span>
    }

    if (isOnline) {
      return <span style={{ color: 'var(--primary-color)' }}>online</span>
    }

    if (otherParticipant?.lastSeen) {
      return formatLastSeen(otherParticipant.lastSeen)
    }

    return 'offline'
  }

  const handleCallOption = (type) => {
    setShowCallDrawer(false)
    addToast(`${type === 'video' ? 'Video' : 'Voice'} call connecting...`, 'info', 3000)
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          height: 'var(--header-height, 60px)',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Mobile Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="btn-icon"
              style={{ marginRight: -4 }}
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {/* Avatar & Title (clickable to open info panel) */}
          <div
            onClick={onOpenInfo}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }}
          >
            <Avatar
              src={avatarSrc}
              name={title}
              size="sm"
              isOnline={isOnline}
            />
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
                className="truncate"
              >
                {title}
              </h3>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-secondary)',
                }}
                className="truncate"
              >
                {getSubtitle()}
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Phone+ Call Button (opens call drawer) */}
          <button
            onClick={() => setShowCallDrawer(true)}
            className="btn-icon"
            title="Start call"
            style={{ position: 'relative' }}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              <line x1="19" y1="2" x2="19" y2="8" />
              <line x1="16" y1="5" x2="22" y2="5" />
            </svg>
          </button>

          {/* More Menu Dropdown */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn-icon"
              title="More options"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div
                className="animate-scale-up"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  width: 185,
                  padding: '6px 0',
                  zIndex: 60,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onOpenInfo()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 14,
                    width: '100%',
                    padding: '10px 20px',
                    fontSize: '14.5px',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    border: 'none',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Info size={18} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
                  <span style={{ textAlign: 'left' }}>{conversation.isGroup ? 'Group info' : 'Contact info'}</span>
                </button>

                {onBack && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      onBack()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 14,
                      width: '100%',
                      padding: '10px 20px',
                      fontSize: '14.5px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      border: 'none',
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <X size={18} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
                    <span style={{ textAlign: 'left' }}>Close chat</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call Type Drawer (WhatsApp Style) */}
      <BottomDrawer
        isOpen={showCallDrawer}
        onClose={() => setShowCallDrawer(false)}
        title="Select call type"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => handleCallOption('audio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
              padding: '12px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: 400,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Phone size={22} style={{ color: 'var(--text-secondary, #8696a0)', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Voice call</span>
          </button>

          <button
            onClick={() => handleCallOption('video')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
              padding: '12px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: 400,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Video size={22} style={{ color: 'var(--text-secondary, #8696a0)', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Video call</span>
          </button>
        </div>
      </BottomDrawer>
    </>
  )
}
