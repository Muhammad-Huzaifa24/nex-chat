import React, { useState, useEffect } from 'react'
import { EmptyChat } from './EmptyChat'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { DeleteMessageModal } from '../modals/DeleteMessageModal'
import { useAuthStore } from '../../store/authStore'
import { useConversationStore } from '../../store/conversationStore'
import { useMessageStore } from '../../store/messageStore'
import { useToastStore } from '../../store/toastStore'
import api from '../../services/api'
import { getSocket } from '../../socket/socket'

export const ChatArea = ({ onBack, onImageClick }) => {
  const { user, token } = useAuthStore()
  const {
    activeConversation,
    setActivePanel,
    typingUsers,
    updateLastMessage,
  } = useConversationStore()

  const {
    messages,
    fetchMessages,
    addMessage,
    addOptimisticMessage,
    confirmOptimisticMessage,
    failOptimisticMessage,
    updateReaction,
    deleteMessageLocal,
    replyingTo,
    setReplyingTo,
    isLoading,
  } = useMessageStore()

  const [deleteTargetMessage, setDeleteTargetMessage] = useState(null)

  const socket = getSocket(token)
  const currentMessages = activeConversation ? messages[activeConversation._id] || [] : []

  // Fetch messages when conversation changes & mark as read
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id)
      // Call REST endpoint so server updates DB and triggers Pusher read status
      api.put(`/messages/read/${activeConversation._id}`).catch(() => {})
      if (socket) {
        socket.emit('message:read', { conversationId: activeConversation._id })
      }
    }
  }, [activeConversation?._id])

  if (!activeConversation) {
    return <EmptyChat />
  }

  const handleSendMessage = async ({ content, file, type, replyTo, retryTempId }) => {
    const tempId = retryTempId || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    // Optimistic Preview Setup
    let optimisticAttachmentUrl = ''
    let optimisticAttachmentMeta = {}

    if (file) {
      if (type === 'image' || type === 'video') {
        optimisticAttachmentUrl = URL.createObjectURL(file)
      }
      optimisticAttachmentMeta = {
        filename: file.name || 'Attachment',
        size: file.size || 0,
        mimeType: file.type || '',
      }
    }

    const optimisticMsg = {
      _id: tempId,
      tempId,
      conversationId: activeConversation._id,
      senderId: {
        _id: user._id,
        displayName: user.displayName,
        username: user.username,
        avatar: user.avatar,
      },
      content: content ? content.trim() : '',
      type: type || 'text',
      attachmentUrl: optimisticAttachmentUrl,
      attachmentMeta: optimisticAttachmentMeta,
      replyTo: replyTo || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reactions: [],
      deletedFor: [],
      isDeletedForEveryone: false,
      _originalData: { content, file, type, replyTo },
    }

    if (!retryTempId) {
      addOptimisticMessage(activeConversation._id, optimisticMsg)
      updateLastMessage(activeConversation._id, optimisticMsg)
    }

    if (file) {
      const formData = new FormData()
      formData.append('conversationId', activeConversation._id)
      formData.append('content', content || '')
      formData.append('type', type)
      formData.append('file', file)
      if (replyTo) formData.append('replyTo', replyTo)

      try {
        const res = await api.post('/messages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const newMsg = res.data.message
        confirmOptimisticMessage(activeConversation._id, tempId, newMsg)
        updateLastMessage(activeConversation._id, newMsg)
      } catch (err) {
        console.error('Failed to send file message', err)
        const errorMsg = err.response?.data?.message || 'Failed to upload media.'
        failOptimisticMessage(activeConversation._id, tempId, errorMsg)
        useToastStore.getState().addToast(errorMsg, 'error', 4500)
      }
    } else {
      // Text message
      try {
        const res = await api.post('/messages', {
          conversationId: activeConversation._id,
          content,
          type: 'text',
          replyTo,
        })
        const newMsg = res.data.message
        confirmOptimisticMessage(activeConversation._id, tempId, newMsg)
        updateLastMessage(activeConversation._id, newMsg)
      } catch (err) {
        console.error('Failed to send text message', err)
        const errorMsg = err.response?.data?.message || 'Failed to send message.'
        failOptimisticMessage(activeConversation._id, tempId, errorMsg)
      }
    }
  }

  const handleRetry = (msg) => {
    if (msg._originalData) {
      handleSendMessage({
        ...msg._originalData,
        retryTempId: msg.tempId || msg._id,
      })
    } else {
      handleSendMessage({
        content: msg.content,
        type: msg.type || 'text',
        replyTo: msg.replyTo?._id || msg.replyTo,
        retryTempId: msg.tempId || msg._id,
      })
    }
  }

  const handleTypingStart = () => {
    if (activeConversation) {
      if (socket) {
        socket.emit('typing:start', { conversationId: activeConversation._id })
      }
      api.post('/messages/typing', { conversationId: activeConversation._id, isTyping: true }).catch(() => {})
    }
  }

  const handleTypingStop = () => {
    if (activeConversation) {
      if (socket) {
        socket.emit('typing:stop', { conversationId: activeConversation._id })
      }
      api.post('/messages/typing', { conversationId: activeConversation._id, isTyping: false }).catch(() => {})
    }
  }

  const handleReact = async (messageId, emoji) => {
    // Optimistic local update for instantaneous UI feedback
    const currentMsg = currentMessages.find((m) => m._id === messageId)
    if (currentMsg) {
      const existingIdx = (currentMsg.reactions || []).findIndex(
        (r) => (r.userId?._id || r.userId)?.toString() === user?._id?.toString() && r.emoji === emoji
      )
      let newReactions = [...(currentMsg.reactions || [])]
      if (existingIdx > -1) {
        newReactions.splice(existingIdx, 1)
      } else {
        newReactions = newReactions.filter(
          (r) => (r.userId?._id || r.userId)?.toString() !== user?._id?.toString()
        )
        newReactions.push({ userId: user?._id, emoji })
      }
      updateReaction(activeConversation._id, messageId, newReactions)
    }

    try {
      const res = await api.post(`/messages/${messageId}/react`, { emoji })
      // Server Pusher event already broadcasts the update to all conversation members.
      // Update local state with the fully-populated server response.
      updateReaction(activeConversation._id, messageId, res.data.reactions)
    } catch (err) {
      console.error('Reaction error', err)
    }
  }

  const handleConfirmDelete = async (deleteFor) => {
    if (!deleteTargetMessage) return
    const msg = deleteTargetMessage

    try {
      await api.delete(`/messages/${msg._id}?deleteFor=${deleteFor}`)
      deleteMessageLocal(activeConversation._id, msg._id, deleteFor)
      if (socket && deleteFor === 'everyone') {
        socket.emit('message:delete', {
          messageId: msg._id,
          conversationId: activeConversation._id,
          deleteFor: 'everyone',
        })
      }
    } catch (err) {
      console.error('Delete error', err)
    } finally {
      setDeleteTargetMessage(null)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-chat)',
        backgroundImage: 'var(--bg-chat-pattern)',
        backgroundSize: '20px 20px',
      }}
    >
      <ChatHeader
        conversation={activeConversation}
        currentUserId={user?._id}
        onBack={onBack}
        onOpenInfo={() =>
          setActivePanel(activeConversation.isGroup ? 'group' : 'profile')
        }
        typingUsers={typingUsers}
      />

      <MessageList
        messages={currentMessages}
        currentUserId={user?._id}
        isGroup={activeConversation.isGroup}
        onReply={(msg) => setReplyingTo(msg)}
        onReact={handleReact}
        onDelete={(msg) => setDeleteTargetMessage(msg)}
        onRetry={handleRetry}
        onImageClick={onImageClick}
        isLoading={isLoading}
      />

      <MessageInput
        activeConversationId={activeConversation._id}
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Custom Delete Confirmation Modal */}
      <DeleteMessageModal
        isOpen={Boolean(deleteTargetMessage)}
        onClose={() => setDeleteTargetMessage(null)}
        message={deleteTargetMessage}
        currentUserId={user?._id}
        onDeleteConfirm={handleConfirmDelete}
      />
    </div>
  )
}
