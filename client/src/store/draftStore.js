import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useDraftStore = create(
  persist(
    (set, get) => ({
      drafts: {}, // { [conversationId]: string }

      setDraft: (conversationId, text) => {
        if (!conversationId) return
        set((state) => {
          if (!text || !text.trim()) {
            const copy = { ...state.drafts }
            delete copy[conversationId]
            return { drafts: copy }
          }
          return {
            drafts: {
              ...state.drafts,
              [conversationId]: text,
            },
          }
        })
      },

      clearDraft: (conversationId) => {
        if (!conversationId) return
        set((state) => {
          const copy = { ...state.drafts }
          delete copy[conversationId]
          return { drafts: copy }
        })
      },

      getDraft: (conversationId) => {
        if (!conversationId) return ''
        return get().drafts[conversationId] || ''
      },
    }),
    {
      name: 'nexchat_drafts',
    }
  )
)
