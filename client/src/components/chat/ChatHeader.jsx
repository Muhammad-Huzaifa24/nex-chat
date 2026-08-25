import React from 'react'
import { Avatar } from '../ui/Avatar'
import { ArrowLeft, MoreVertical, Search } from 'lucide-react'

export const ChatHeader = ({
  conversation,
  currentUserId,
  onBack,
  onOpenInfo,
  typingUsers,
}) => {
  const otherParticipant = !conversation.isGroup
    ? conversation.participants?.find((p) => p._id !== currentUserId)
    : null

  const title = conversation.isGroup
    ? conversation.groupName
    : otherParticipant?.displayName || otherParticipant?.username || 'User'

  const avatarSrc = conversation.isGroup ? conversation.groupAvatar : otherParticipant?.avatar
  const isOnline = !conversation.isGroup && otherParticipant?.isOnline

  // Subtitle / status line
  const typingMap = typingUsers[conversation._id] || {}
  const isTyping = Object.keys(typingMap).length > 0

  const getSubtitle = () => {
    if (isTyping) {
      return (
        <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>
          {Object.values(typingMap).join(', ')} typing...
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
      const lastSeenDate = new Date(otherParticipant.lastSeen)
      return `last seen ${lastSeenDate.toLocaleDateString()} at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    return 'offline'
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-color)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {/* Mobile Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="btn-icon"
            style={{ marginRight: -4 }}
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Avatar & Title (clickable to open info panel) */}
        <div
          onClick={onOpenInfo}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minWidth: 0 }}
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
        <button onClick={onOpenInfo} className="btn-icon" title="View Info">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  )
}
