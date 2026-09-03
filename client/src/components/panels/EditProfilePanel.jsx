import React, { useState, useRef } from 'react'
import { Avatar } from '../ui/Avatar'
import {
  ArrowLeft,
  X,
  Camera,
  Check,
  Loader2,
  User,
  Info,
  Phone,
  Mail,
  Share2,
  Copy,
  ExternalLink,
  Image,
  Trash2,
} from 'lucide-react'
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

  // DP Change options & preview state
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

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

  const handleSelectFile = (file) => {
    if (!file) return
    setShowAvatarMenu(false)
    setPreviewFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleConfirmAvatarUpload = async () => {
    if (!previewFile) return

    setAvatarLoading(true)
    const formData = new FormData()
    formData.append('avatar', previewFile)

    try {
      const res = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser(res.data.user)
      addToast('Profile photo updated', 'success')
      setPreviewFile(null)
      setPreviewUrl(null)
    } catch (err) {
      addToast('Failed to upload avatar', 'error')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setShowAvatarMenu(false)
    setAvatarLoading(true)
    try {
      const res = await api.delete('/users/avatar')
      updateUser(res.data.user)
      addToast('Profile photo removed', 'success')
    } catch (err) {
      addToast('Failed to remove photo', 'error')
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div
        className="side-panel"
        style={{
          left: 0,
          right: 'auto',
          borderRight: '1px solid var(--border-color)',
          borderLeft: 'none',
          boxShadow: '8px 0 32px rgba(0, 0, 0, 0.25)',
          animation: 'slideRight 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Hidden Camera & Gallery Inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files[0]
            if (f) handleSelectFile(f)
            e.target.value = ''
          }}
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files[0]
            if (f) handleSelectFile(f)
            e.target.value = ''
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
            height: 'var(--header-height, 60px)',
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
          {/* Avatar change with interactive overlay */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              onClick={() => setShowAvatarMenu(true)}
              style={{ position: 'relative', cursor: 'pointer' }}
              title="Change profile photo"
            >
              <Avatar src={user?.avatar} name={user?.displayName} size="xl" />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {avatarLoading ? <Loader2 size={26} className="animate-spin" /> : <Camera size={24} />}
              </div>
            </div>
            <span
              onClick={() => setShowAvatarMenu(true)}
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--primary-color)',
                marginTop: 8,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Change profile photo
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

        {/* Share Profile Link */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--primary-color)', display: 'block', marginBottom: 4 }}>
            SHARE PROFILE LINK
          </label>
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              Share your direct link with others so they can chat with you instantly without searching.
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                border: '1px solid var(--border-color)',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--primary-color)',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {`${window.location.origin}/u/${user?.username}`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}/u/${user?.username}`
                  navigator.clipboard.writeText(link)
                  addToast('Profile link copied to clipboard!', 'success')
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0, 168, 132, 0.1)',
                  border: '1px solid rgba(0, 168, 132, 0.3)',
                  color: 'var(--primary-color)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Copy size={14} />
                Copy Link
              </button>

              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}/u/${user?.username}`
                  if (navigator.share) {
                    navigator.share({
                      title: `Chat with ${user?.displayName} on NexChat`,
                      text: `Connect and chat with me on NexChat:`,
                      url: link,
                    }).catch(() => {})
                  } else {
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(`Chat with me on NexChat: ${link}`)}`
                    window.open(waUrl, '_blank')
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Share2 size={14} />
                Share
              </button>
            </div>
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

      {/* Avatar Options Modal/Drawer */}
      {showAvatarMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={() => setShowAvatarMenu(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}
          />
          <div
            className="animate-slide-up"
            style={{
              position: 'relative',
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: '16px 20px 28px',
              width: '100%',
              maxWidth: 480,
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ width: 40, height: 4, backgroundColor: 'var(--text-muted)', borderRadius: 999, margin: '0 auto 12px', opacity: 0.6 }} />
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              Profile photo
            </h3>

            <button
              onClick={() => {
                setShowAvatarMenu(false)
                cameraInputRef.current?.click()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Camera size={20} color="var(--primary-color)" />
              <span>Take photo</span>
            </button>

            <button
              onClick={() => {
                setShowAvatarMenu(false)
                galleryInputRef.current?.click()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Image size={20} color="#ac44cf" />
              <span>Choose from gallery</span>
            </button>

            {user?.avatar && (
              <button
                onClick={handleRemoveAvatar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--accent-red)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 size={20} color="var(--accent-red)" />
                <span>Remove photo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Photo Preview Modal before Saving */}
      {previewUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={() => {
              setPreviewUrl(null)
              setPreviewFile(null)
            }}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)' }}
          />
          <div
            className="animate-scale-up"
            style={{
              position: 'relative',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: 380,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'var(--shadow-popup)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Set Profile Photo
            </h3>

            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                border: '3px solid var(--primary-color)',
                marginBottom: 20,
              }}
            >
              <img
                src={previewUrl}
                alt="Avatar preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null)
                  setPreviewFile(null)
                }}
                disabled={avatarLoading}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAvatarUpload}
                disabled={avatarLoading}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {avatarLoading ? <Loader2 size={16} className="animate-spin" /> : 'Set Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
