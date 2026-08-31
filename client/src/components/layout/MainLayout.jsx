import React, { useState, useEffect, useRef } from 'react'
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
import { getSocket } from '../../socket/socket'
import { subscribeChannel, unsubscribeChannel } from '../../socket/pusher'
import api from '../../services/api'

export const MainLayout = () => {
  const { user, token } = useAuthStore()
  const {
    activeConversation,
    setActiveConversation,
    activePanel,
    setActivePanel,
    fetchConversations,
    updateLastMessage,
    updateLastMessageStatus,
    setUserOnline,
    setTyping,
    addOrUpdateConversation,
  } = useConversationStore()

  const { addMessage, updateReaction, deleteMessageLocal, updateMessageStatus } = useMessageStore()

  const [showNewChat, setShowNewChat] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const typingTimeoutsRef = useRef({})

  // Request Push Notification permission & register Service Worker immediately on site open
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SW Registration Error]', err)
      })
    }
  }, [])

  // Helper to trigger native Push Notification when tab is hidden or minimized
  const triggerPushNotification = (senderName, content, avatar) => {
    if (document.visibilityState !== 'hidden') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const title = senderName ? `${senderName} on NexChat` : 'New message on NexChat'
    const options = {
      body: content || 'Sent an attachment',
      icon: avatar || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      tag: 'nexchat-msg',
      renotify: true,
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(title, options)
        })
        .catch(() => {
          new Notification(title, options)
        })
    } else {
      try {
        new Notification(title, options)
      } catch (e) {}
    }
  }

  // Track responsive screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize data, Socket.IO & Pusher channels
  useEffect(() => {
    if (!token) return

    fetchConversations()

    // 1. Socket.IO (Local dev / persistent server fallback)
    const socket = getSocket(token)
    if (socket) {
      socket.on('message:new', ({ message, conversationId }) => {
        addMessage(conversationId, message)
        updateLastMessage(conversationId, message)

        const senderId = (message.senderId?._id || message.senderId)?.toString()
        if (senderId && senderId !== user?._id?.toString()) {
          const senderName = message.senderId?.displayName || message.senderId?.username || 'New message'
          const previewText = message.content || (message.type === 'image' ? '📷 Photo' : '📎 Attachment')
          triggerPushNotification(senderName, previewText, message.senderId?.avatar)
        }
      })

      socket.on('user:online', ({ userId }) => {
        setUserOnline(userId, true)
      })

      socket.on('user:offline', ({ userId }) => {
        setUserOnline(userId, false)
      })

      socket.on('typing:start', ({ conversationId, user: typingUser }) => {
        const typingUserId = (typingUser?._id || typingUser)?.toString()
        if (typingUserId && typingUserId !== user?._id?.toString()) {
          setTyping(conversationId, typingUser, true)
          clearTimeout(typingTimeoutsRef.current[`${conversationId}_${typingUserId}`])
          typingTimeoutsRef.current[`${conversationId}_${typingUserId}`] = setTimeout(() => {
            setTyping(conversationId, typingUserId, false)
          }, 4000)
        }
      })

      socket.on('typing:stop', ({ conversationId, userId }) => {
        const stopUserId = (userId?._id || userId)?.toString()
        if (stopUserId) {
          clearTimeout(typingTimeoutsRef.current[`${conversationId}_${stopUserId}`])
          setTyping(conversationId, stopUserId, false)
        }
      })

      socket.on('message:status_update', ({ conversationId, status, readBy }) => {
        updateMessageStatus(conversationId, status, readBy)
        updateLastMessageStatus(conversationId, status, readBy)
      })

      socket.on('message:reaction_update', ({ messageId, reactions, conversationId }) => {
        updateReaction(conversationId, messageId, reactions)
      })

      socket.on('message:deleted', ({ messageId, conversationId, deleteFor }) => {
        deleteMessageLocal(conversationId, messageId, deleteFor)
      })

      socket.on('group:updated', ({ updatedConversation }) => {
        addOrUpdateConversation(updatedConversation)
      })
    }

    // 2. Pusher User Channel (Serverless Realtime for incoming messages across all chats)
    if (user?._id) {
      const userChannelName = `user-${user._id}`
      const userChannel = subscribeChannel(userChannelName)

      if (userChannel) {
        userChannel.bind('message:new', ({ message, conversationId }) => {
          console.log('[Pusher Debug] userChannel message:new received:', { messageId: message._id, conversationId })
          addMessage(conversationId, message)
          updateLastMessage(conversationId, message)

          const senderId = (message.senderId?._id || message.senderId)?.toString()
          if (senderId && senderId !== user?._id?.toString()) {
            const senderName = message.senderId?.displayName || message.senderId?.username || 'New message'
            const previewText = message.content || (message.type === 'image' ? '📷 Photo' : '📎 Attachment')
            triggerPushNotification(senderName, previewText, message.senderId?.avatar)
          }
        })

        userChannel.bind('message:status_update', ({ conversationId, status, readBy }) => {
          console.log('[Pusher Debug] userChannel message:status_update received:', { conversationId, status, readBy })
          updateMessageStatus(conversationId, status, readBy)
          updateLastMessageStatus(conversationId, status, readBy)
        })

        userChannel.bind('message:reaction_update', ({ messageId, reactions, conversationId }) => {
          console.log('[Pusher Debug] userChannel message:reaction_update received:', { messageId, reactionsCount: reactions?.length, conversationId })
          updateReaction(conversationId, messageId, reactions)
        })

        userChannel.bind('message:deleted', ({ messageId, conversationId, deleteFor }) => {
          console.log('[Pusher Debug] userChannel message:deleted received:', { messageId, conversationId, deleteFor })
          deleteMessageLocal(conversationId, messageId, deleteFor)
        })
      }

      // 3. Global Presence Subscription
      const presenceChannel = subscribeChannel('global-presence')
      if (presenceChannel) {
        presenceChannel.bind('user:status', ({ userId, isOnline, lastSeen }) => {
          console.log('[Pusher Debug] global-presence user:status received:', { userId, isOnline, lastSeen })
          if (userId && userId.toString() !== user?._id?.toString()) {
            setUserOnline(userId, isOnline, lastSeen)
          }
        })
      }

      // 4. Heartbeat (every 30s) & Offline Beacon
      const sendHeartbeat = () => {
        if (document.visibilityState === 'visible') {
          api.post('/users/heartbeat').catch(() => {})
        }
      }

      sendHeartbeat()
      const heartbeatInterval = setInterval(sendHeartbeat, 30000)

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          sendHeartbeat()
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)

      const handleBeforeUnload = () => {
        const url = `${import.meta.env.VITE_API_URL || '/api'}/users/offline`
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url)
        }
      }
      window.addEventListener('beforeunload', handleBeforeUnload)

      return () => {
        clearInterval(heartbeatInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('beforeunload', handleBeforeUnload)
        unsubscribeChannel(userChannelName)
        unsubscribeChannel('global-presence')
      }
    }
  }, [token, user?._id])

  // Pusher Active Conversation Channel Subscription
  useEffect(() => {
    if (!activeConversation?._id) return

    const channelName = `conversation-${activeConversation._id}`
    const channel = subscribeChannel(channelName)

    if (channel) {
      channel.bind('message:new', ({ message, conversationId }) => {
        addMessage(conversationId, message)
        updateLastMessage(conversationId, message)

        const senderId = (message.senderId?._id || message.senderId)?.toString()
        if (senderId && senderId !== user?._id?.toString()) {
          const senderName = message.senderId?.displayName || message.senderId?.username || 'New message'
          const previewText = message.content || (message.type === 'image' ? '📷 Photo' : '📎 Attachment')
          triggerPushNotification(senderName, previewText, message.senderId?.avatar)
        }
      })

      channel.bind('message:status_update', ({ conversationId, status, readBy }) => {
        updateMessageStatus(conversationId, status, readBy)
        updateLastMessageStatus(conversationId, status, readBy)
      })

      channel.bind('message:reaction_update', ({ messageId, reactions, conversationId }) => {
        updateReaction(conversationId, messageId, reactions)
      })

      channel.bind('message:deleted', ({ messageId, conversationId, deleteFor }) => {
        deleteMessageLocal(conversationId, messageId, deleteFor)
      })

      channel.bind('typing:start', ({ conversationId, user: typingUser }) => {
        const typingUserId = (typingUser?._id || typingUser)?.toString()
        // Prevent typing self-echo: only show indicator if someone else is typing
        if (typingUserId && typingUserId !== user?._id?.toString()) {
          setTyping(conversationId, typingUser, true)
          clearTimeout(typingTimeoutsRef.current[`${conversationId}_${typingUserId}`])
          typingTimeoutsRef.current[`${conversationId}_${typingUserId}`] = setTimeout(() => {
            setTyping(conversationId, typingUserId, false)
          }, 4000)
        }
      })

      channel.bind('typing:stop', ({ conversationId, userId }) => {
        const stopUserId = (userId?._id || userId)?.toString()
        if (stopUserId) {
          clearTimeout(typingTimeoutsRef.current[`${conversationId}_${stopUserId}`])
          setTyping(conversationId, stopUserId, false)
        }
      })
    }

    return () => {
      unsubscribeChannel(channelName)
    }
  }, [activeConversation?._id, user?._id])

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
        <EditProfilePanel onClose={() => setActivePanel(null)} />
      )}

      {/* Modals */}
      <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
      <NewGroupModal isOpen={showNewGroup} onClose={() => setShowNewGroup(false)} />

      {/* Lightbox */}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  )
}
