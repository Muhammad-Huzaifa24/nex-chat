import { create } from 'zustand'
import api from '../services/api'

export const useConversationStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  activePanel: null, // 'profile' | 'group' | 'editProfile' | null
  isLoading: false,
  onlineUsers: new Set(),
  typingUsers: {}, // { [conversationId]: { [userId]: username } }

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation, activePanel: null })
  },

  setActivePanel: (panel) => set({ activePanel: panel }),

  fetchConversations: async () => {
    set({ isLoading: true })
    try {
      const res = await api.get('/conversations')
      set({ conversations: res.data.conversations, isLoading: false })
    } catch (err) {
      console.error('Failed to fetch conversations', err)
      set({ isLoading: false })
    }
  },

  addOrUpdateConversation: (conversation) => {
    set((state) => {
      const exists = state.conversations.find((c) => c._id === conversation._id)
      if (exists) {
        return {
          conversations: state.conversations.map((c) => (c._id === conversation._id ? conversation : c)),
          activeConversation:
            state.activeConversation?._id === conversation._id ? conversation : state.activeConversation,
        }
      }
      return { conversations: [conversation, ...state.conversations] }
    })
  },

  updateLastMessage: (conversationId, message) => {
    set((state) => {
      const updated = state.conversations.map((c) => {
        if (c._id === conversationId) {
          return {
            ...c,
            lastMessage: message,
            lastMessageAt: message.createdAt || new Date(),
          }
        }
        return c
      })
      // Sort so most recent conversation is at the top
      updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
      return { conversations: updated }
    })
  },

  setUserOnline: (userId, isOnline) => {
    set((state) => {
      const online = new Set(state.onlineUsers)
      if (isOnline) {
        online.add(userId)
      } else {
        online.delete(userId)
      }

      // Update in conversation participants
      const updatedConversations = state.conversations.map((c) => ({
        ...c,
        participants: c.participants.map((p) => (p._id === userId ? { ...p, isOnline } : p)),
      }))

      let updatedActive = state.activeConversation
      if (updatedActive) {
        updatedActive = {
          ...updatedActive,
          participants: updatedActive.participants.map((p) => (p._id === userId ? { ...p, isOnline } : p)),
        }
      }

      return {
        onlineUsers: online,
        conversations: updatedConversations,
        activeConversation: updatedActive,
      }
    })
  },

  setTyping: (conversationId, user, isTyping) => {
    set((state) => {
      const current = { ...(state.typingUsers[conversationId] || {}) }
      if (isTyping) {
        current[user._id] = user.displayName || user.username
      } else {
        delete current[user._id || user]
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: current,
        },
      }
    })
  },
}))
