import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Bell,
  Sun,
  Moon,
  Palette,
  LogOut,
  Play,
  Check,
  Music,
  ChevronDown,
  ChevronRight,
  User,
  Smartphone,
  Shield,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { Avatar } from '../components/ui/Avatar'
import { playNotificationSound } from '../utils/sound'

// ─── Section Nav Items ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications & Sounds', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

// ─── Toggle Switch Component ─────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: checked ? 'var(--primary-color)' : 'var(--bg-surface-active)',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background-color 0.2s ease',
      flexShrink: 0,
      outline: 'none',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: checked ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        transition: 'left 0.2s ease',
      }}
    />
  </button>
)

// ─── Setting Row ─────────────────────────────────────────────────────────────
const SettingRow = ({ icon: Icon, label, desc, right, last }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 24px',
      borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      gap: 16,
      minHeight: 58,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
      {Icon && <Icon size={20} color="var(--primary-color)" style={{ flexShrink: 0 }} />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>}
      </div>
    </div>
    <div style={{ flexShrink: 0 }}>{right}</div>
  </div>
)

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, children }) => (
  <div
    style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 12,
      overflow: 'hidden',
    }}
  >
    {title && (
      <div
        style={{
          padding: '10px 24px',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 600,
          color: 'var(--primary-color)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-header)',
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
)

// ─── Main SettingsPage ────────────────────────────────────────────────────────
export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const {
    soundEnabled,
    toggleSound,
    pushEnabled,
    togglePush,
    wallpaper,
    setWallpaper,
    notificationTone,
    setNotificationTone,
  } = useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)

  const [activeSection, setActiveSection] = useState('notifications')
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const toneDropdownRef = useRef(null)

  // Responsive listener
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Close tone dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(e.target)) {
        setIsToneDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toneOptions = [
    { id: 'whatsapp_classic', name: 'WhatsApp Classic', desc: 'Two-tone chime' },
    { id: 'gentle_pop', name: 'Gentle Pop', desc: 'Warm rounded bubble' },
    { id: 'crystal_bell', name: 'Crystal Bell', desc: 'Harmonic chime' },
    { id: 'subtle_pip', name: 'Subtle Pip', desc: 'Minimalist click' },
  ]

  const wallpapers = [
    { id: 'default', name: 'Default Dark', color: '#0b141a' },
    { id: 'whatsapp', name: 'WA Doodle', color: '#0c1317' },
    { id: 'midnight', name: 'Midnight Navy', color: '#0f172a' },
    { id: 'emerald', name: 'Deep Emerald', color: '#062820' },
    { id: 'charcoal', name: 'Charcoal Black', color: '#18181b' },
  ]

  const handleTestSound = (toneToPlay) => {
    playNotificationSound(typeof toneToPlay === 'string' ? toneToPlay : notificationTone)
  }

  const handlePushToggle = async () => {
    if (!('Notification' in window)) {
      addToast('Push notifications not supported on this browser', 'error')
      return
    }
    if (!pushEnabled) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        togglePush()
        addToast('Push notifications enabled!', 'success')
        new Notification('NexChat', { body: 'Push notifications are now active!', icon: '/favicon.svg' })
      } else {
        addToast('Notification permission denied in browser', 'error')
      }
    } else {
      togglePush()
      addToast('Push notifications disabled', 'info')
    }
  }

  const handleNavClick = (id) => {
    setActiveSection(id)
    if (isMobile) setMobileShowDetail(true)
  }

  // ── Sections content ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (activeSection === 'profile') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
            }}
          >
            <Avatar src={user?.avatar} name={user?.displayName || 'Me'} size="xl" isOnline={true} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {user?.displayName}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                @{user?.username}
              </div>
              {user?.bio && (
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{user.bio}</div>
              )}
            </div>
          </div>
          <SectionCard title="Account">
            <SettingRow
              icon={Smartphone}
              label="Phone"
              desc={user?.phone || 'Not set'}
              right={null}
            />
            <SettingRow
              icon={Shield}
              label="Email"
              desc={user?.email || 'Not set'}
              last
              right={null}
            />
          </SectionCard>
          {/* Logout */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => { logout(); navigate('/login') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                padding: '16px 24px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--accent-red)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(234,67,53,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )
    }

    if (activeSection === 'notifications') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Notifications & Sounds">
            {/* Message Sounds */}
            <SettingRow
              icon={soundEnabled ? Volume2 : VolumeX}
              label="Message Sounds"
              desc="Play tone for incoming messages"
              right={<Toggle checked={soundEnabled} onChange={toggleSound} />}
            />

            {/* Notification Tone – only shown when sounds are on */}
            {soundEnabled && (
              <SettingRow
                icon={Music}
                label="Notification Tone"
                desc={toneOptions.find((t) => t.id === (notificationTone || 'whatsapp_classic'))?.name}
                right={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Play button */}
                    <button
                      type="button"
                      onClick={() => handleTestSound(notificationTone)}
                      title="Preview tone"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(0,168,132,0.12)',
                        border: '1px solid rgba(0,168,132,0.3)',
                        color: 'var(--primary-color)',
                        cursor: 'pointer',
                      }}
                    >
                      <Play size={13} />
                    </button>

                    {/* Dropdown */}
                    <div ref={toneDropdownRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setIsToneDropdownOpen(!isToneDropdownOpen)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          backgroundColor: 'var(--bg-input, #2a3942)',
                          color: 'var(--text-primary)',
                          border: isToneDropdownOpen
                            ? '1.5px solid var(--primary-color)'
                            : '1px solid var(--border-color)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          outline: 'none',
                          minWidth: 170,
                          justifyContent: 'space-between',
                          boxShadow: isToneDropdownOpen ? '0 0 0 2px rgba(0,168,132,0.2)' : 'none',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                      >
                        <span>
                          {toneOptions.find((t) => t.id === (notificationTone || 'whatsapp_classic'))?.name || 'WhatsApp Classic'}
                        </span>
                        <ChevronDown
                          size={14}
                          style={{
                            transform: isToneDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            color: isToneDropdownOpen ? 'var(--primary-color)' : 'var(--text-muted)',
                          }}
                        />
                      </button>

                      {isToneDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            right: 0,
                            width: 220,
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: 10,
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
                            overflow: 'hidden',
                            zIndex: 200,
                            padding: 5,
                          }}
                        >
                          {toneOptions.map((tone) => {
                            const isSelected = (notificationTone || 'whatsapp_classic') === tone.id
                            return (
                              <div
                                key={tone.id}
                                onClick={() => {
                                  setNotificationTone(tone.id)
                                  handleTestSound(tone.id)
                                  setIsToneDropdownOpen(false)
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? 'rgba(0,168,132,0.15)' : 'transparent',
                                  color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                                  transition: 'background-color 0.12s',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500 }}>{tone.name}</div>
                                  <div style={{ fontSize: 11, color: isSelected ? 'rgba(0,168,132,0.85)' : 'var(--text-muted)' }}>
                                    {tone.desc}
                                  </div>
                                </div>
                                {isSelected && <Check size={15} color="var(--primary-color)" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
            )}

            {/* Push Notifications */}
            <SettingRow
              icon={Bell}
              label="Push Notifications"
              desc="Receive alerts even when app is closed"
              last
              right={<Toggle checked={!!pushEnabled} onChange={handlePushToggle} />}
            />
          </SectionCard>
        </div>
      )
    }

    if (activeSection === 'appearance') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Appearance">
            {/* Theme */}
            <SettingRow
              icon={theme === 'dark' ? Moon : Sun}
              label="Theme Mode"
              desc={`Currently using ${theme} theme`}
              right={
                <div style={{ display: 'flex', gap: 6 }}>
                  {['dark', 'light'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 6,
                        backgroundColor: theme === t ? 'var(--primary-color)' : 'var(--bg-input)',
                        color: theme === t ? '#fff' : 'var(--text-primary)',
                        border: theme === t ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        textTransform: 'capitalize',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              }
            />

            {/* Chat Wallpaper */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <Palette size={20} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>Chat Wallpaper</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Select conversation background</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {wallpapers.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => { setWallpaper(wp.id); addToast(`Wallpaper: ${wp.name}`, 'success', 2000) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px',
                      borderRadius: 8,
                      backgroundColor: wp.color,
                      color: '#fff',
                      border: wallpaper === wp.id ? '2px solid var(--primary-color)' : '1.5px solid rgba(255,255,255,0.15)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      boxShadow: wallpaper === wp.id ? '0 0 0 3px rgba(0,168,132,0.35)' : 'none',
                      transition: 'border 0.15s, box-shadow 0.15s',
                    }}
                  >
                    {wallpaper === wp.id && <Check size={13} color="var(--primary-color)" />}
                    {wp.name}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )
    }

    return null
  }

  // ── Mobile: back from detail to nav list ──────────────────────────────────
  const handleMobileBack = () => {
    if (mobileShowDetail) {
      setMobileShowDetail(false)
    } else {
      navigate('/')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-family)',
      }}
    >
      {/* ── LEFT PANEL: Navigation ─────────────────────────────────────────── */}
      {(!isMobile || !mobileShowDetail) && (
        <div
          style={{
            width: isMobile ? '100%' : 'var(--sidebar-width, 380px)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-sidebar)',
            borderRight: isMobile ? 'none' : '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '0 16px',
              height: 'var(--header-height, 60px)',
              backgroundColor: 'var(--bg-header)',
              borderBottom: '1px solid var(--border-color)',
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
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Settings</span>
          </div>

          {/* User profile mini card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onClick={() => handleNavClick('profile')}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Avatar src={user?.avatar} name={user?.displayName || 'Me'} size="md" isOnline={true} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                {user?.displayName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }} className="truncate">
                {user?.bio || `@${user?.username}`}
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>

          {/* Nav List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    width: '100%',
                    padding: '14px 20px',
                    border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                    color: isActive ? 'var(--primary-color)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s, color 0.15s',
                    borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Icon size={20} />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item.label}</span>
                  {isMobile && <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />}
                </button>
              )
            })}
          </div>

          {/* Logout at bottom */}
          <div style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => { logout(); navigate('/login') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                padding: '16px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--accent-red)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(234,67,53,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* ── RIGHT PANEL: Content ───────────────────────────────────────────── */}
      {(!isMobile || mobileShowDetail) && (
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-app)',
            minWidth: 0,
          }}
        >
          {/* Content Header (mobile back / desktop section title) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 20px',
              height: 'var(--header-height, 60px)',
              backgroundColor: 'var(--bg-header)',
              borderBottom: '1px solid var(--border-color)',
              flexShrink: 0,
            }}
          >
            {isMobile && (
              <button onClick={handleMobileBack} className="btn-icon" title="Back">
                <ArrowLeft size={22} />
              </button>
            )}
            <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {NAV_ITEMS.find((n) => n.id === activeSection)?.label || 'Settings'}
            </span>
          </div>

          {/* Scrollable Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {renderContent()}
          </div>
        </div>
      )}

      {/* Desktop: when no right panel selected show placeholder */}
      {!isMobile && !activeSection && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Select a section from the left
        </div>
      )}
    </div>
  )
}
