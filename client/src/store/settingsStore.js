import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      soundEnabled: true,
      pushEnabled: true,
      wallpaper: 'default', // 'default' | 'whatsapp' | 'midnight' | 'emerald' | 'charcoal'
      notificationTone: 'whatsapp_classic', // 'whatsapp_classic' | 'gentle_pop' | 'crystal_bell' | 'subtle_pip'

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
      togglePush: () => set((state) => ({ pushEnabled: !state.pushEnabled })),

      setWallpaper: (wallpaper) => set({ wallpaper }),
      setNotificationTone: (notificationTone) => set({ notificationTone }),
    }),
    {
      name: 'nexchat_settings',
    }
  )
)
