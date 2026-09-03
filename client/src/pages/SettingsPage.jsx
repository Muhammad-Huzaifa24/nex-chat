import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Bell,
  Sun,
  Moon,
  Palette,
  Shield,
  HelpCircle,
  LogOut,
  User,
  Play,
  Check,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { Avatar } from '../components/ui/Avatar'
import { playNotificationSound } from '../utils/sound'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme, setTheme } = useThemeStore()
  const {
    soundEnabled,
    toggleSound,
    pushEnabled,
    togglePush,
    wallpaper,
    setWallpaper,
  } = useSettingsStore()
  const { addToast } = useToastStore()

  const handleTestSound = () => {
    playNotificationSound()
    addToast('Playing notification preview', 'info', 2000)
  }

  const handlePushToggle = async () => {
    if (!pushEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        togglePush()
        addToast('Push notifications enabled', 'success')
      } else {
        addToast('Notification permission denied in browser', 'error')
      }
    } else {
      togglePush()
    }
  }

  const wallpapers = [
    { id: 'default', name: 'Default Dark', color: '#0b141a' },
    { id: 'whatsapp', name: 'WhatsApp Doodle', color: '#0c1317' },
    { id: 'midnight', name: 'Midnight Navy', color: '#0f172a' },
    { id: 'emerald', name: 'Deep Emerald', color: '#062820' },
    { id: 'charcoal', name: 'Charcoal Black', color: '#18181b' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100vw',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        overflowY: 'auto',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          height: 'var(--header-height, 60px)',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="btn-icon"
          title="Back to chats"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, margin: 0 }}>
          Settings
        </h1>
      </div>

      <div
        style={{
          maxWidth: 680,
          width: '100%',
          margin: '0 auto',
          padding: '20px 16px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* User Card */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
        >
          <Avatar
            src={user?.avatar}
            name={user?.displayName || 'Me'}
            size="lg"
            isOnline={true}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: '0 0 4px 0' }} className="truncate">
              {user?.displayName}
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0 }} className="truncate">
              {user?.bio || `@${user?.username}`}
            </p>
          </div>
        </div>

        {/* Section: Notifications & Sounds */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--primary-color)' }}>
            Notifications & Sounds
          </div>

          {/* Sound Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {soundEnabled ? <Volume2 size={20} color="var(--primary-color)" /> : <VolumeX size={20} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Message Sounds</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Play tone for incoming messages</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {soundEnabled && (
                <button
                  type="button"
                  onClick={handleTestSound}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(0, 168, 132, 0.1)',
                    border: '1px solid rgba(0, 168, 132, 0.25)',
                    color: 'var(--primary-color)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title="Test sound"
                >
                  <Play size={12} /> Test
                </button>
              )}
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={toggleSound}
                style={{ width: 18, height: 18, accentColor: 'var(--primary-color)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Web Push Notification Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Bell size={20} color={pushEnabled ? 'var(--primary-color)' : 'var(--text-muted)'} />
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Push Notifications</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Receive alerts even when app is closed</div>
              </div>
            </div>

            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={handlePushToggle}
              style={{ width: 18, height: 18, accentColor: 'var(--primary-color)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Section: Appearance */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--primary-color)' }}>
            Appearance
          </div>

          {/* Theme Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {theme === 'dark' ? <Moon size={20} color="var(--primary-color)" /> : <Sun size={20} color="var(--primary-color)" />}
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Theme Mode</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Currently using {theme} theme</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: theme === 'dark' ? 'var(--primary-color)' : 'var(--bg-app)',
                  color: theme === 'dark' ? '#ffffff' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: theme === 'light' ? 'var(--primary-color)' : 'var(--bg-app)',
                  color: theme === 'light' ? '#ffffff' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Light
              </button>
            </div>
          </div>

          {/* Chat Wallpaper Presets */}
          <div style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <Palette size={20} color="var(--primary-color)" />
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Chat Wallpaper</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select conversation background style</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {wallpapers.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => {
                    setWallpaper(wp.id)
                    addToast(`Wallpaper changed to ${wp.name}`, 'success', 2000)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: wp.color,
                    color: '#ffffff',
                    border: wallpaper === wp.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: wallpaper === wp.id ? '0 0 0 2px rgba(0, 168, 132, 0.4)' : 'none',
                  }}
                >
                  {wallpaper === wp.id && <Check size={14} color="var(--primary-color)" />}
                  <span>{wp.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Account Actions */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              padding: '16px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--accent-red)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
