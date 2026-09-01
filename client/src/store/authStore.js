import { create } from 'zustand'
import api from '../services/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('nexchat_token') || null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  pendingEmail: null, // email awaiting verification

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
      set({ isLoading: false, pendingEmail: res.data.email || email })
      return { success: true, requiresVerification: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      set({ error: msg, isLoading: false })
      return { success: false, message: msg }
    }
  },

  verifyEmail: async (email, otp) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.post('/auth/verify-email', { email, otp })
      const { user, token } = res.data
      if (token) localStorage.setItem('nexchat_token', token)
      set({ user, token, isAuthenticated: true, isLoading: false, pendingEmail: null })
      return { success: true, user }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed'
      set({ error: msg, isLoading: false })
      return { success: false, message: msg }
    }
  },

  resendOtp: async (email) => {
    try {
      const res = await api.post('/auth/resend-otp', { email })
      return { success: true, message: res.data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code'
      return { success: false, message: msg }
    }
  },

  forgotPassword: async (emailOrUsername) => {
    try {
      const res = await api.post('/auth/forgot-password', { emailOrUsername })
      return { success: true, message: res.data.message, email: res.data.email }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request password reset'
      return { success: false, message: msg }
    }
  },

  verifyResetOtp: async (email, otp) => {
    try {
      const res = await api.post('/auth/verify-reset-otp', { email, otp })
      return { success: true, message: res.data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code'
      return { success: false, message: msg }
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword })
      return { success: true, message: res.data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password'
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
