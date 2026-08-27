import { create } from 'zustand'

export const useToastStore = create((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3500) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration, isExiting: false }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },
  removeToast: (id) => {
    // Mark as exiting for smooth slide-out animation
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, isExiting: true } : t)),
    }))

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 280)
  },
}))
