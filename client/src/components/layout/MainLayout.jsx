import React, { useState, useEffect } from 'react'
import { Sidebar } from '../sidebar/Sidebar'
import { ChatArea } from '../chat/ChatArea'
import { UserProfilePanel } from '../panels/UserProfilePanel'
import { GroupInfoPanel } from '../panels/GroupInfoPanel'
import { EditProfilePanel } from '../panels/EditProfilePanel'
import { NewChatModal } from '../modals/NewChatModal'
import { NewGroupModal } from '../modals/NewGroupModal'
import { ImageLightbox } from '../media/ImageLightbox'
import { useAuthStore } from '../../store/authStore'
import { useConversationStore } from '../../store/conversationStore'
import { useMessageStore } from '../../store/messageStore'
import { getSocket, disconnectSocket } from '../../socket/socket'

export const MainLayout = () => {
  const { user, token } = useAuthStore()
  const {
    activeConversation,
    setActiveConversation,
    activePanel,
    setActivePanel,
    fetchConversations,
    updateLastMessage,
    setUserOnline,
    setTyping,
    addOrUpdateConversation,
  } = useConversationStore()

  const { addMessage, updateReaction, deleteMessageLocal, updateMessageStatus } = useMessageStore()

  const [showNewChat, setShowNewChat] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Track responsive screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize data and Socket.IO
  useEffect(() => {
    if (!token) return

    fetchConversations()
    const socket = getSocket(token)

    if (socket) {
      // New incoming message
      socket.on('message:new', ({ message, conversationId }) => {
        addMessage(conversationId, message)
        updateLastMessage(conversationId, message)
      })

      // Online status update
      socket.on('user:online', ({ userId }) => {
        setUserOnline(userId, true)
      })

      socket.on('user:offline', ({ userId }) => {
        setUserOnline(userId, false)
      })

      // Typing indicators
      socket.on('typing:start', ({ conversationId, user: typingUser }) => {
        setTyping(conversationId, typingUser, true)
      })

      socket.on('typing:stop', ({ conversationId, userId }) => {
        setTyping(conversationId, userId, false)
      })

      // Read receipts
      socket.on('message:status_update', ({ conversationId, status }) => {
        updateMessageStatus(conversationId, status)
      })

      // Message reaction
      socket.on('message:reaction_update', ({ messageId, reactions, conversationId }) => {
        updateReaction(conversationId, messageId, reactions)
      })

      // Message deleted
      socket.on('message:deleted', ({ messageId, conversationId, deleteFor }) => {
        deleteMessageLocal(conversationId, messageId, deleteFor)
      })

      // Group updated
      socket.on('group:updated', ({ updatedConversation }) => {
        addOrUpdateConversation(updatedConversation)
      })
    }

    return () => {
      // Don't disconnect on layout re-render, keep session alive
    }
  }, [token])

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Sidebar (Full screen on mobile if no active conversation) */}
      {(!isMobile || !activeConversation) && (
        <div
          style={{
            width: isMobile ? '100%' : 'var(--sidebar-width)',
            height: '100%',
            flexShrink: 0,
          }}
        >
          <Sidebar
            onOpenNewChat={() => setShowNewChat(true)}
            onOpenNewGroup={() => setShowNewGroup(true)}
          />
        </div>
      )}

      {/* Chat Area (Full screen on mobile if active conversation is selected) */}
      {(!isMobile || activeConversation) && (
        <div style={{ flex: 1, height: '100%', display: 'flex', overflow: 'hidden', minWidth: 0, position: 'relative' }}>
          <ChatArea
            onBack={isMobile ? () => setActiveConversation(null) : null}
            onImageClick={(src) => setLightboxSrc(src)}
          />

          {/* Contact Profile Panel */}
          {activePanel === 'profile' && activeConversation && (
            <UserProfilePanel
              conversation={activeConversation}
              currentUserId={user?._id}
              onClose={() => setActivePanel(null)}
            />
          )}

          {/* Group Info Panel */}
          {activePanel === 'group' && activeConversation && (
            <GroupInfoPanel
              conversation={activeConversation}
              currentUserId={user?._id}
              onClose={() => setActivePanel(null)}
            />
          )}
        </div>
      )}

      {/* Edit Profile Panel */}
      {activePanel === 'editProfile' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: isMobile ? 0 : 'var(--sidebar-width)',
            width: isMobile ? '100%' : 'auto',
            height: '100%',
            zIndex: 100,
          }}
        >
          <EditProfilePanel onClose={() => setActivePanel(null)} />
        </div>
      )}

      {/* Modals */}
      <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
      <NewGroupModal isOpen={showNewGroup} onClose={() => setShowNewGroup(false)} />

      {/* Lightbox */}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  )
}
