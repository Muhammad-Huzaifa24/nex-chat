import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('nexchat_theme') || 'dark', // default to sleek modern dark theme
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('nexchat_theme', nextTheme)
      document.documentElement.setAttribute('data-theme', nextTheme)
      return { theme: nextTheme }
    }),
  setTheme: (theme) => {
    localStorage.setItem('nexchat_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },
}))
