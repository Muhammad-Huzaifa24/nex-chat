import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useConversationStore } from '../../store/conversationStore'
import { Avatar } from '../ui/Avatar'
import { SearchBar } from './SearchBar'
import { ConversationItem } from './ConversationItem'
import { SidebarFAB } from './SidebarFAB'
import {
  LogOut,
  Settings,
  MoreVertical,
  User,
} from 'lucide-react'

import { useDebounce } from '../../hooks/useDebounce'

export const Sidebar = ({ onOpenNewChat, onOpenNewGroup }) => {
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const debouncedSearch = useDebounce(searchVal, 250)

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

  const { user, logout } = useAuthStore()
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    setActivePanel,
    typingUsers,
  } = useConversationStore()

  // Filter conversations by debounced search input
  const filteredConversations = conversations.filter((c) => {
    if (!debouncedSearch.trim()) return true
    const term = debouncedSearch.toLowerCase()
    if (c.isGroup) {
      return c.groupName?.toLowerCase().includes(term)
    }
    const other = c.participants?.find((p) => (p._id?.toString() || p.toString()) !== user?._id?.toString())
    return (
      other?.displayName?.toLowerCase().includes(term) ||
      other?.username?.toLowerCase().includes(term)
    )
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar Header — Clean & Uncluttered */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          height: 'var(--header-height, 60px)',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        {/* User Avatar + Name */}
        <div
          onClick={() => setActivePanel('editProfile')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }}
          title="Edit Profile"
        >
          <Avatar
            src={user?.avatar}
            name={user?.displayName || 'Me'}
            size="sm"
            isOnline={true}
          />
          <span
            style={{
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-primary)',
            }}
            className="truncate"
          >
            {user?.displayName}
          </span>
        </div>

        {/* Menu (⋮) */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="btn-icon"
            title="Menu"
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
                  setActivePanel('editProfile')
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
                <User size={18} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
                <span style={{ textAlign: 'left' }}>Profile</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false)
                  navigate('/settings')
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
                <Settings size={18} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
                <span style={{ textAlign: 'left' }}>Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false)
                  logout()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 14,
                  width: '100%',
                  padding: '10px 20px',
                  fontSize: '14.5px',
                  color: 'var(--accent-red)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  border: 'none',
                  lineHeight: 1.4,
                  borderTop: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={18} style={{ flexShrink: 0, color: 'var(--accent-red)' }} />
                <span style={{ textAlign: 'left' }}>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar searchVal={searchVal} onSearchChange={setSearchVal} />

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredConversations.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div>{searchVal ? `No chats found for "${searchVal}"` : 'No conversations yet.'}</div>
            <button
              onClick={onOpenNewChat}
              style={{
                color: 'var(--primary-color)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const rawTyping = typingUsers[conv._id] || {}
            const typingEntries = Object.entries(rawTyping).filter(
              ([id]) => id.toString() !== user?._id?.toString()
            )
            const isTyping = typingEntries.length > 0
            const typingText = typingEntries.map(([, name]) => name).join(', ') + ' typing...'

            return (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                currentUserId={user?._id}
                isActive={activeConversation?._id === conv._id}
                onClick={() => setActiveConversation(conv)}
                isTyping={isTyping}
                typingText={typingText}
              />
            )
          })
        )}
      </div>

      {/* WhatsApp-Style Floating Action Button (+ at bottom right) */}
      <SidebarFAB
        onOpenNewChat={onOpenNewChat}
        onOpenNewGroup={onOpenNewGroup}
      />
    </div>
  )
}
