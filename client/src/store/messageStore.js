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
      // Check if already in list by _id
      if (current.some((m) => m._id === message._id)) {
        return state
      }

      // Check if matching optimistic message by tempId or pending content/sender match
      const pendingIndex = current.findIndex(
        (m) =>
          m.tempId &&
          (m.tempId === message.tempId ||
            (m.status === 'pending' &&
              m.content === message.content &&
              (m.senderId?._id || m.senderId)?.toString() === (message.senderId?._id || message.senderId)?.toString()))
      )

      if (pendingIndex > -1) {
        const updated = [...current]
        updated[pendingIndex] = { ...message, tempId: null }
        return {
          messages: {
            ...state.messages,
            [conversationId]: updated,
          },
        }
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...current, message],
        },
      }
    })
  },

  addOptimisticMessage: (conversationId, optimisticMessage) => {
    set((state) => {
      const current = state.messages[conversationId] || []
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...current, optimisticMessage],
        },
      }
    })
  },

  confirmOptimisticMessage: (conversationId, tempId, confirmedMessage) => {
    set((state) => {
      const current = state.messages[conversationId] || []
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.map((m) =>
            m._id === tempId || m.tempId === tempId ? { ...confirmedMessage, tempId: null } : m
          ),
        },
      }
    })
  },

  failOptimisticMessage: (conversationId, tempId, errorText = '') => {
    set((state) => {
      const current = state.messages[conversationId] || []
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.map((m) =>
            m._id === tempId || m.tempId === tempId
              ? { ...m, status: 'failed', errorMessage: errorText }
              : m
          ),
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

  updateMessageStatus: (conversationId, status, readBy = null) => {
    set((state) => {
      const current = state.messages[conversationId] || []
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.map((m) => {
            if (readBy) {
              const senderId = (m.senderId?._id || m.senderId)?.toString()
              // Messages sent by anyone other than reader (i.e. the sender) are marked as read
              if (senderId && senderId !== readBy.toString()) {
                return { ...m, status }
              }
              return m
            }
            return { ...m, status }
          }),
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
          [conversationId]: current.filter((m) => m._id !== messageId && m.tempId !== messageId),
        },
      }
    })
  },
}))
