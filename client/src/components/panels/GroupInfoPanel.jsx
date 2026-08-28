import React, { useState } from 'react'
import { Avatar } from '../ui/Avatar'
import { ArrowLeft, X, Users, UserPlus, LogOut, Shield, Trash2, Camera, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { useConversationStore } from '../../store/conversationStore'
import { useToastStore } from '../../store/toastStore'
import { AddMemberModal } from '../modals/AddMemberModal'

export const GroupInfoPanel = ({ conversation, currentUserId, onClose }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [groupName, setGroupName] = useState(conversation.groupName || '')
  const [groupDesc, setGroupDesc] = useState(conversation.groupDescription || '')
  const [loading, setLoading] = useState(false)

  const { addOrUpdateConversation, setActiveConversation, fetchConversations } = useConversationStore()
  const { addToast } = useToastStore()

  const isAdmin = conversation.groupAdmins?.some((a) => (a._id || a) === currentUserId)

  const handleUpdateInfo = async () => {
    setLoading(true)
    try {
      const res = await api.put(`/conversations/group/${conversation._id}`, {
        groupName,
        groupDescription: groupDesc,
      })
      addOrUpdateConversation(res.data.conversation)
      setIsEditing(false)
      addToast('Group details updated', 'success')
    } catch (err) {
      addToast('Failed to update group details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    try {
      await api.post(`/conversations/group/${conversation._id}/leave`)
      addToast('You left the group', 'info')
      setActiveConversation(null)
      fetchConversations()
      onClose()
    } catch (err) {
      addToast('Failed to leave group', 'error')
    }
  }

  const handleRemoveMember = async (memberId, memberName = 'Member') => {
    try {
      const res = await api.delete(`/conversations/group/${conversation._id}/members/${memberId}`)
      addOrUpdateConversation(res.data.conversation)
      addToast(`${memberName} removed from group`, 'info')
    } catch (err) {
      addToast('Failed to remove member', 'error')
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="side-panel">
        {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 'var(--header-height)',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <button onClick={onClose} className="btn-icon" style={{ width: 36, height: 36 }} title="Close Group Info">
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
          Group Info
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Group Avatar & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Avatar src={conversation.groupAvatar} name={conversation.groupName} size="xl" />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginTop: 12 }}>
            {conversation.groupName}
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 2 }}>
            Group · {conversation.participants?.length || 0} participants
          </div>
        </div>

        {/* Description Section */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            GROUP DESCRIPTION
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
            {conversation.groupDescription || 'No description added yet.'}
          </div>
        </div>

        {/* Participants List */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} /> {conversation.participants?.length || 0} PARTICIPANTS
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface-hover)',
                color: 'var(--primary-color)',
                border: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <UserPlus size={13} /> Add Member
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {conversation.participants?.map((participant) => {
              const pId = participant._id || participant
              const isPAdmin = conversation.groupAdmins?.some((a) => (a._id || a) === pId)
              const isSelf = pId === currentUserId

              return (
                <div
                  key={pId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar
                      src={participant.avatar}
                      name={participant.displayName || participant.username || 'User'}
                      size="sm"
                      isOnline={participant.isOnline}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }} className="truncate">
                        {isSelf ? 'You' : participant.displayName || participant.username}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                        {participant.bio || ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isPAdmin && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Admin
                      </span>
                    )}
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(pId, participant.displayName || participant.username)}
                        className="btn-icon"
                        style={{ width: 28, height: 28 }}
                        title="Remove member"
                      >
                        <Trash2 size={14} color="var(--accent-red)" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Leave Group Button */}
        <button
          onClick={handleLeaveGroup}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px',
            backgroundColor: 'transparent',
            color: 'var(--accent-red)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            marginTop: 'auto',
          }}
        >
          <LogOut size={16} /> Leave Group
        </button>
      </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        conversation={conversation}
      />
    </>
  )
}
