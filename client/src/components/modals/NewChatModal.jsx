import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Search, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { useConversationStore } from '../../store/conversationStore'
import { getSocket } from '../../socket/socket'
import { useAuthStore } from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'

export const NewChatModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 1500)
  const { setActiveConversation, addOrUpdateConversation } = useConversationStore()
  const { token } = useAuthStore()

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setLoading(false)
      return
    }

    if (!debouncedQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    const searchUsers = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
        setResults(res.data.users || [])
      } catch (err) {
        console.error('User search error', err)
      } finally {
        setLoading(false)
      }
    }

    searchUsers()
  }, [debouncedQuery, isOpen])

  const handleSelectUser = async (user) => {
    try {
      const res = await api.post('/conversations/direct', { recipientId: user._id })
      const conversation = res.data.conversation
      addOrUpdateConversation(conversation)
      setActiveConversation(conversation)

      const socket = getSocket(token)
      if (socket) {
        socket.emit('conversation:join', conversation._id)
      }

      onClose()
    } catch (err) {
      console.error('Failed to create direct conversation', err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Chat">
      {/* Search Field */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-app)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          gap: 10,
          border: '1px solid var(--border-color)',
          marginBottom: 16,
        }}
      >
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username or email..."
          style={{
            width: '100%',
            fontSize: 'var(--font-size-base)',
            color: 'var(--text-primary)',
          }}
          autoFocus
        />
      </div>

      {/* User Results */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Loader2 size={24} className="animate-spin" color="var(--primary-color)" />
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            <div
              key={user._id}
              onClick={() => handleSelectUser(user)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                gap: 12,
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Avatar
                src={user.avatar}
                name={user.displayName || user.username}
                size="md"
                isOnline={user.isOnline}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>
                  {user.displayName}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  @{user.username} {user.bio ? `· ${user.bio}` : ''}
                </div>
              </div>
            </div>
          ))
        ) : query.trim() ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
            No users found matching "{query}"
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Type to find registered users to chat with
          </div>
        )}
      </div>
    </Modal>
  )
}
