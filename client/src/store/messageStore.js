import { create } from 'zustand'
import api from '../services/api'

export const useMessageStore = create((set, get) => ({
  messages: {}, // { [conversationId]: Message[] }
  replyingTo: null,
  isLoading: false,
  hasMore: {},

  setReplyingTo: (message) => set({ replyingTo: message }),

  fetchMessages: async (conversationId, page = 1) => {
    set({ isLoading: true })
    try {
      const res = await api.get(`/messages/${conversationId}?page=${page}&limit=50`)
      set((state) => {
        const existing = state.messages[conversationId] || []
        const merged = page === 1 ? res.data.messages : [...res.data.messages, ...existing]
        return {
          messages: {
            ...state.messages,
            [conversationId]: merged,
          },
          hasMore: {
            ...state.hasMore,
            [conversationId]: res.data.hasMore,
          },
          isLoading: false,
        }
      })
    } catch (err) {
      console.error('Failed to fetch messages', err)
      set({ isLoading: false })
    }
  },

  addMessage: (conversationId, message) => {
    set((state) => {
      const current = state.messages[conversationId] || []
      // Check if already in list
      if (current.some((m) => m._id === message._id)) {
        return state
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...current, message],
        },
      }
    })
  },

  updateReaction: (conversationId, messageId, reactions) => {
    set((state) => {
      const current = state.messages[conversationId] || []
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
        },
      }
    })
  },

  updateMessageStatus: (conversationId, status) => {
    set((state) => {
      const current = state.messages[conversationId] || []
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.map((m) => ({ ...m, status })),
        },
      }
    })
  },

  deleteMessageLocal: (conversationId, messageId, deleteFor) => {
    set((state) => {
      const current = state.messages[conversationId] || []
      if (deleteFor === 'everyone') {
        return {
          messages: {
            ...state.messages,
            [conversationId]: current.map((m) =>
              m._id === messageId
                ? { ...m, isDeletedForEveryone: true, content: 'This message was deleted', attachmentUrl: '' }
                : m
            ),
          },
        }
      }
      // Delete for me
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.filter((m) => m._id !== messageId),
        },
      }
    })
  },
}))
