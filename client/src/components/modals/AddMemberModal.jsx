import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Search, Loader2, UserPlus } from 'lucide-react'
import api from '../../services/api'
import { useConversationStore } from '../../store/conversationStore'
import { useToastStore } from '../../store/toastStore'
import { useDebounce } from '../../hooks/useDebounce'

export const AddMemberModal = ({ isOpen, onClose, conversation }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingUserId, setAddingUserId] = useState(null)

  const debouncedQuery = useDebounce(query, 1500)
  const { addOrUpdateConversation } = useConversationStore()
  const { addToast } = useToastStore()

  const existingParticipantIds = (conversation?.participants || []).map(
    (p) => (p._id || p).toString()
  )

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setIsSearching(false)
      setAddingUserId(null)
      return
    }

    if (!debouncedQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    const searchUsers = async () => {
      setIsSearching(true)
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
        // Filter out users already in the group
        const filtered = (res.data.users || []).filter(
          (u) => !existingParticipantIds.includes(u._id.toString())
        )
        setResults(filtered)
      } catch (err) {
        console.error('Search error', err)
      } finally {
        setIsSearching(false)
      }
    }

    searchUsers()
  }, [debouncedQuery, isOpen])

  const handleAddMember = async (user) => {
    if (!conversation?._id || addingUserId) return

    setAddingUserId(user._id)
    try {
      const res = await api.post(`/conversations/group/${conversation._id}/members`, {
        memberId: user._id,
      })
      addOrUpdateConversation(res.data.conversation)
      addToast(`${user.displayName || user.username} added to group`, 'success')
      onClose()
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add member'
      addToast(errorMsg, 'error')
    } finally {
      setAddingUserId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Group Member">
      {/* Search Input */}
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
        {isSearching && <Loader2 size={16} className="animate-spin" color="var(--primary-color)" />}
      </div>

      {/* User Results */}
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {isSearching && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
            Searching users...
          </div>
        )}

        {!isSearching && debouncedQuery.trim() && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
            No users found or all matching users are already in the group.
          </div>
        )}

        {!query.trim() && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
            Type to search registered users to add to <strong>{conversation?.groupName}</strong>
          </div>
        )}

        {results.map((user) => (
          <div
            key={user._id}
            onClick={() => handleAddMember(user)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              gap: 12,
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <Avatar src={user.avatar} name={user.displayName} size="md" isOnline={user.isOnline} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }} className="truncate">
                  {user.displayName}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }} className="truncate">
                  @{user.username} {user.bio ? `· ${user.bio}` : ''}
                </div>
              </div>
            </div>

            <button
              disabled={addingUserId === user._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-color)',
                color: '#ffffff',
                border: 'none',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {addingUserId === user._id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={14} /> Add
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  )
}
