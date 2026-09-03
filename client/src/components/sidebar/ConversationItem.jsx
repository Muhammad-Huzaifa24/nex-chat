import React from 'react'
import { Avatar } from '../ui/Avatar'
import { Check, CheckCheck, Users } from 'lucide-react'
import { useDraftStore } from '../../store/draftStore'

export const ConversationItem = ({
  conversation,
  currentUserId,
  isActive,
  onClick,
  isTyping,
  typingText,
}) => {
  const draft = useDraftStore((state) => state.drafts[conversation._id])
  const hasDraft = Boolean(draft && draft.trim())

  // Get other participant for 1-to-1 chats
  const otherParticipant = !conversation.isGroup
    ? conversation.participants?.find((p) => (p._id?.toString() || p.toString()) !== currentUserId?.toString())
    : null

  const title = conversation.isGroup
    ? conversation.groupName
    : otherParticipant?.displayName || otherParticipant?.username || 'User'

  const avatarSrc = conversation.isGroup ? conversation.groupAvatar : otherParticipant?.avatar
  const isOnline = !conversation.isGroup && otherParticipant?.isOnline

  // Format timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    const isThisWeek = now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000
    if (isThisWeek) {
      return date.toLocaleDateString([], { weekday: 'short' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Last message preview text
  const getLastMessagePreview = () => {
    if (hasDraft) {
      return (
        <span>
          <span style={{ color: 'var(--status-online, #25d366)', fontWeight: 600 }}>Draft: </span>
          <span>{draft}</span>
        </span>
      )
    }

    if (isTyping) {
      return <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>{typingText || 'typing...'}</span>
    }

    const lastMsg = conversation.lastMessage
    if (!lastMsg) return 'No messages yet'

    if (lastMsg.isDeletedForEveryone) {
      return <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>This message was deleted</span>
    }

    let prefix = ''
    if (conversation.isGroup && lastMsg.senderId) {
      const senderName =
        lastMsg.senderId._id === currentUserId
          ? 'You'
          : lastMsg.senderId.displayName || lastMsg.senderId.username
      prefix = `${senderName}: `
    }

    if (lastMsg.type === 'image') return `${prefix}📷 Photo`
    if (lastMsg.type === 'video') return `${prefix}🎥 Video`
    if (lastMsg.type === 'audio') return `${prefix}🎵 Audio`
    if (lastMsg.type === 'file') return `${prefix}📄 ${lastMsg.attachmentMeta?.filename || 'Document'}`

    return `${prefix}${lastMsg.content || ''}`
  }

  // Unread count
  const unreadCount =
    conversation.unreadCounts?.get?.(currentUserId) ||
    conversation.unreadCounts?.[currentUserId] ||
    0

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        cursor: 'pointer',
        backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
        transition: 'background-color var(--transition-fast)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {/* Avatar */}
      <Avatar
        src={avatarSrc}
        name={title}
        size="md"
        isOnline={isOnline}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 'var(--font-size-base)',
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
            {formatTime(conversation.lastMessageAt || conversation.updatedAt)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Status tick if current user was sender and no draft */}
            {!hasDraft &&
              conversation.lastMessage &&
              conversation.lastMessage.senderId?._id === currentUserId &&
              !isTyping && (
                <span>
                  {conversation.lastMessage.status === 'read' ? (
                    <CheckCheck size={15} color="var(--tick-read)" />
                  ) : conversation.lastMessage.status === 'delivered' ? (
                    <CheckCheck size={15} color="var(--tick-delivered)" />
                  ) : (
                    <Check size={15} color="var(--tick-sent)" />
                  )}
                </span>
              )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getLastMessagePreview()}
            </span>
          </div>

          {/* WhatsApp Unread Pill Badge */}
          {unreadCount > 0 && !isActive && (
            <div
              style={{
                backgroundColor: 'var(--status-online, #25d366)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                marginLeft: 8,
                flexShrink: 0,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
