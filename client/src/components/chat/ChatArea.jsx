import React, { useEffect } from 'react'
import { EmptyChat } from './EmptyChat'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
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
    updateReaction,
    deleteMessageLocal,
    replyingTo,
    setReplyingTo,
    isLoading,
  } = useMessageStore()

  const socket = getSocket(token)
  const currentMessages = activeConversation ? messages[activeConversation._id] || [] : []

  // Fetch messages when conversation changes & mark as read
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id)
      if (socket) {
        socket.emit('message:read', { conversationId: activeConversation._id })
      }
    }
  }, [activeConversation?._id])

  if (!activeConversation) {
    return <EmptyChat />
  }

  const handleSendMessage = async ({ content, file, type, replyTo }) => {
    if (file) {
      // Send via multipart upload endpoint
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
        addMessage(activeConversation._id, newMsg)
        updateLastMessage(activeConversation._id, newMsg)

        // Also emit to socket so recipients get realtime notification
        if (socket) {
          socket.emit('message:new', { message: newMsg, conversationId: activeConversation._id })
        }
      } catch (err) {
        console.error('Failed to send file message', err)
        const errorMsg = err.response?.data?.message || 'Failed to upload media. Please try again.'
        useToastStore.getState().addToast(errorMsg, 'error', 5000)
      }
    } else {
      // Direct text via Socket or API
      if (socket) {
        socket.emit(
          'message:send',
          {
            conversationId: activeConversation._id,
            content,
            type: 'text',
            replyTo,
          },
          (res) => {
            if (res && res.message) {
              addMessage(activeConversation._id, res.message)
              updateLastMessage(activeConversation._id, res.message)
            }
          }
        )
      } else {
        const res = await api.post('/messages', {
          conversationId: activeConversation._id,
          content,
          type: 'text',
          replyTo,
        })
        addMessage(activeConversation._id, res.data.message)
        updateLastMessage(activeConversation._id, res.data.message)
      }
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
    try {
      const res = await api.post(`/messages/${messageId}/react`, { emoji })
      updateReaction(activeConversation._id, messageId, res.data.reactions)
      if (socket) {
        socket.emit('message:react', {
          messageId,
          emoji,
          conversationId: activeConversation._id,
        })
      }
    } catch (err) {
      console.error('Reaction error', err)
    }
  }

  const handleDelete = async (msg) => {
    const isSender = msg.senderId?._id === user?._id
    let deleteFor = 'me'

    if (isSender) {
      const confirmForEveryone = window.confirm('Delete for everyone? (Cancel to delete for me only)')
      deleteFor = confirmForEveryone ? 'everyone' : 'me'
    }

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
        onDelete={handleDelete}
        onImageClick={onImageClick}
        isLoading={isLoading}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  )
}
