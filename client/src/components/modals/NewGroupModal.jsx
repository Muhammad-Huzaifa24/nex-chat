import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Search, X, Camera, Loader2, ArrowRight } from 'lucide-react'
import api from '../../services/api'
import { useConversationStore } from '../../store/conversationStore'
import { getSocket } from '../../socket/socket'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { useDebounce } from '../../hooks/useDebounce'

export const NewGroupModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1) // 1 = select participants, 2 = group info
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupAvatarFile, setGroupAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 1500)
  const { setActiveConversation, addOrUpdateConversation } = useConversationStore()
  const { token } = useAuthStore()
  const { addToast } = useToastStore()

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setQuery('')
      setResults([])
      setSelectedUsers([])
      setGroupName('')
      setGroupDescription('')
      setGroupAvatarFile(null)
      setAvatarPreview(null)
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
        setResults(res.data.users || [])
      } catch (err) {
        console.error('Search error', err)
      } finally {
        setIsSearching(false)
      }
    }

    searchUsers()
  }, [debouncedQuery, isOpen])

  const toggleUser = (user) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setGroupAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      addToast('Group name is required', 'error')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('groupName', groupName.trim())
    formData.append('groupDescription', groupDescription.trim())
    formData.append(
      'participants',
      JSON.stringify(selectedUsers.map((u) => u._id))
    )
    if (groupAvatarFile) {
      formData.append('groupAvatar', groupAvatarFile)
    }

    try {
      const res = await api.post('/conversations/group', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const group = res.data.conversation
      addOrUpdateConversation(group)
      setActiveConversation(group)

      const socket = getSocket(token)
      if (socket) {
        socket.emit('conversation:join', group._id)
      }

      addToast('Group created successfully!', 'success')
      onClose()
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create group', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Add Group Members' : 'New Group Info'}
    >
      {step === 1 ? (
        <div>
          {/* Selected Chips */}
          {selectedUsers.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '8px 0',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 12,
              }}
            >
              {selectedUsers.map((user) => (
                <div
                  key={user._id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'var(--bg-surface-hover)',
                    borderRadius: 'var(--radius-full)',
                    padding: '3px 8px 3px 4px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 500,
                  }}
                >
                  <Avatar src={user.avatar} name={user.displayName} size="xs" />
                  <span>{user.displayName}</span>
                  <button
                    onClick={() => toggleUser(user)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Box */}
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
              placeholder="Search people to add..."
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
          <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
            {isSearching && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                Searching users...
              </div>
            )}

            {!isSearching && debouncedQuery.trim() && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                No user found for "{debouncedQuery}"
              </div>
            )}

            {results.map((user) => {
              const isSelected = selectedUsers.some((u) => u._id === user._id)
              return (
                <div
                  key={user._id}
                  onClick={() => toggleUser(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    gap: 12,
                    backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                  }}
                >
                  <Avatar src={user.avatar} name={user.displayName} size="md" isOnline={user.isOnline} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>{user.displayName}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>@{user.username}</div>
                  </div>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 'var(--radius-full)',
                      border: isSelected ? 'none' : '2px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--primary-color)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <span style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Next Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setStep(2)}
              disabled={selectedUsers.length === 0}
              className="btn-primary"
              style={{ gap: 6 }}
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Group Avatar & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label
              style={{
                position: 'relative',
                cursor: 'pointer',
                display: 'inline-block',
              }}
            >
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              <Avatar src={avatarPreview} name={groupName || 'Group'} size="lg" />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Camera size={20} />
              </div>
            </label>

            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group Subject / Name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <textarea
              rows={3}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Group description (optional)..."
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-primary)',
                resize: 'none',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <button
              onClick={() => setStep(1)}
              style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}
            >
              Back
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={loading || !groupName.trim()}
              className="btn-primary"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Group'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
