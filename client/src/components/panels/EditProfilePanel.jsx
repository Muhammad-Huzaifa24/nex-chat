import React, { useState } from 'react'
import { Avatar } from '../ui/Avatar'
import { ArrowLeft, X, Camera, Check, Loader2, User, Info, Phone, Mail } from 'lucide-react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

export const EditProfilePanel = ({ onClose }) => {
  const { user, updateUser } = useAuthStore()
  const { addToast } = useToastStore()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      addToast('Name cannot be empty', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await api.put('/users/profile', { displayName, bio, phone })
      updateUser(res.data.user)
      addToast('Profile updated successfully', 'success')
    } catch (err) {
      addToast('Failed to update profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setAvatarLoading(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser(res.data.user)
      addToast('Avatar updated', 'success')
    } catch (err) {
      addToast('Failed to upload avatar', 'error')
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="side-panel" style={{ left: 'var(--sidebar-width)', right: 'auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 'var(--header-height)',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <button onClick={onClose} className="btn-icon" style={{ width: 36, height: 36 }} title="Close Profile">
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
          Edit Profile
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Avatar change */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            <Avatar src={user?.avatar} name={user?.displayName} size="xl" />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              {avatarLoading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
            </div>
          </label>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 8 }}>
            Click photo to change avatar
          </span>
        </div>

        {/* Display Name */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--primary-color)', display: 'block', marginBottom: 4 }}>
            YOUR NAME
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <User size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={{ width: '100%', fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Username (Read only) */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            USERNAME
          </label>
          <div
            style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
            }}
          >
            @{user?.username}
          </div>
        </div>

        {/* Email (Read only) */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            EMAIL
          </label>
          <div
            style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
            }}
          >
            {user?.email}
          </div>
        </div>

        {/* About / Bio */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--primary-color)', display: 'block', marginBottom: 4 }}>
            ABOUT
          </label>
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others something about yourself..."
              style={{ width: '100%', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', resize: 'none' }}
              maxLength={120}
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', float: 'right', marginTop: 2 }}>
            {bio.length}/120
          </span>
        </div>

        {/* Phone */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--primary-color)', display: 'block', marginBottom: 4 }}>
            PHONE (OPTIONAL)
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <Phone size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              style={{ width: '100%', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: 'auto' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
        </button>
      </div>
      </div>
    </>
  )
}
