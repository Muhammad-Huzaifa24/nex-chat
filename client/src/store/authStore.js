import { create } from 'zustand'
import api from '../services/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('nexchat_token') || null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  fetchMe: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data.user, isAuthenticated: true, isLoading: false })
      return res.data.user
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return null
    }
  },

  login: async (emailOrUsername, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.post('/auth/login', { emailOrUsername, password })
      const { user, token } = res.data
      if (token) localStorage.setItem('nexchat_token', token)
      set({ user, token, isAuthenticated: true, isLoading: false })
      return { success: true, user }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      set({ error: msg, isLoading: false })
      return { success: false, message: msg }
    }
  },

  register: async ({ username, displayName, email, password }) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.post('/auth/register', { username, displayName, email, password })
      const { user, token } = res.data
      if (token) localStorage.setItem('nexchat_token', token)
      set({ user, token, isAuthenticated: true, isLoading: false })
      return { success: true, user }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      set({ error: msg, isLoading: false })
      return { success: false, message: msg }
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('nexchat_token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  updateUser: (updatedUser) => {
    set((state) => ({ user: { ...state.user, ...updatedUser } }))
  },
}))
