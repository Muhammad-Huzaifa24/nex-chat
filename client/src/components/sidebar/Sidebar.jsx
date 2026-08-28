import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { useConversationStore } from '../../store/conversationStore'
import { Avatar } from '../ui/Avatar'
import { SearchBar } from './SearchBar'
import { ConversationItem } from './ConversationItem'
import {
  MessageSquarePlus,
  Users,
  Sun,
  Moon,
  LogOut,
  Settings,
  MoreVertical,
} from 'lucide-react'

import { useDebounce } from '../../hooks/useDebounce'

export const Sidebar = ({ onOpenNewChat, onOpenNewGroup }) => {
  const [searchVal, setSearchVal] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const debouncedSearch = useDebounce(searchVal, 250)

  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
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
    const other = c.participants?.find((p) => p._id !== user?._id)
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
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          height: 'var(--header-height)',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {/* User Avatar + Name */}
        <div
          onClick={() => setActivePanel('editProfile')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          title="Edit Profile"
        >
          <Avatar
            src={user?.avatar}
            name={user?.displayName || 'Me'}
            size="sm"
            isOnline={true}
          />
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
            {user?.displayName}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-icon"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* New Chat */}
          <button
            onClick={onOpenNewChat}
            className="btn-icon"
            title="New Chat"
          >
            <MessageSquarePlus size={20} />
          </button>

          {/* New Group */}
          <button
            onClick={onOpenNewGroup}
            className="btn-icon"
            title="New Group"
          >
            <Users size={20} />
          </button>

          {/* Settings / Menu */}
          <div style={{ position: 'relative' }}>
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
                  marginTop: 4,
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)',
                  width: 160,
                  zIndex: 50,
                  overflow: 'hidden',
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
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Settings size={16} /> Profile
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    logout()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--accent-red)',
                    textAlign: 'left',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar searchVal={searchVal} onSearchChange={setSearchVal} />

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredConversations.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            {searchVal ? `No chats found for "${searchVal}"` : 'No conversations yet. Start a new chat!'}
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
    </div>
  )
}
