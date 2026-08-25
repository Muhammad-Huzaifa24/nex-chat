import React, { useRef, useEffect } from 'react'
import { Image, Video, Music, FileText } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

// Standard size thresholds in MB
const MAX_LIMITS_MB = {
  video: 50,
  image: 15,
  audio: 20,
  file: 30,
}

export const AttachmentMenu = ({ onSelectFile, onClose }) => {
  const menuRef = useRef(null)
  const addToast = useToastStore((state) => state.addToast)

  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const fileSizeMB = file.size / (1024 * 1024)
    const limitMB = MAX_LIMITS_MB[type] || 30

    if (fileSizeMB > limitMB) {
      if (type === 'video') {
        addToast(
          `Video is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed video size is ${limitMB}MB. Please select a shorter or compressed video.`,
          'error',
          5000
        )
      } else if (type === 'image') {
        addToast(
          `Photo is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed photo size is ${limitMB}MB.`,
          'error',
          4000
        )
      } else {
        addToast(
          `File is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed size is ${limitMB}MB.`,
          'error',
          4000
        )
      }
      // Reset input value so user can pick another file
      e.target.value = ''
      return
    }

    onSelectFile(file, type)
    onClose()
  }

  const items = [
    {
      label: 'Photos',
      subtext: 'Max 15MB',
      icon: Image,
      color: '#ac44cf',
      ref: imageInputRef,
      accept: 'image/*',
      type: 'image',
    },
    {
      label: 'Videos',
      subtext: 'Max 50MB',
      icon: Video,
      color: '#e91e63',
      ref: videoInputRef,
      accept: 'video/*',
      type: 'video',
    },
    {
      label: 'Audio',
      subtext: 'Max 20MB',
      icon: Music,
      color: '#ff9800',
      ref: audioInputRef,
      accept: 'audio/*',
      type: 'audio',
    },
    {
      label: 'Document',
      subtext: 'Max 30MB',
      icon: FileText,
      color: '#007bfc',
      ref: fileInputRef,
      accept: '*/*',
      type: 'file',
    },
  ]

  return (
    <div
      ref={menuRef}
      className="animate-slide-up"
      style={{
        position: 'absolute',
        bottom: 'calc(var(--input-area-height) + 8px)',
        left: 56,
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-popup)',
        border: '1px solid var(--border-color)',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: 200,
        zIndex: 50,
      }}
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label}>
            <input
              type="file"
              ref={item.ref}
              accept={item.accept}
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, item.type)}
            />
            <button
              onClick={() => item.ref.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.subtext}</span>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
