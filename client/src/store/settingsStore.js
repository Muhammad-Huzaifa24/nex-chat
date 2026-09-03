import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      soundEnabled: true,
      pushEnabled: true,
      wallpaper: 'default', // 'default' | 'whatsapp' | 'midnight' | 'emerald' | 'charcoal'

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
      togglePush: () => set((state) => ({ pushEnabled: !state.pushEnabled })),

      setWallpaper: (wallpaper) => set({ wallpaper }),
    }),
    {
      name: 'nexchat_settings',
    }
  )
)
