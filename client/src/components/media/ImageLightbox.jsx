import React, { useEffect } from 'react'
import { X, Download } from 'lucide-react'

export const ImageLightbox = ({ src, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!src) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      {/* Top Controls */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          gap: 12,
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={src}
          download
          target="_blank"
          rel="noreferrer"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            borderRadius: 'var(--radius-full)',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Download size={20} />
        </a>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Image Display */}
      <img
        src={src}
        alt="Preview"
        className="animate-scale-up"
        style={{
          maxHeight: '85vh',
          maxWidth: '90vw',
          objectFit: 'contain',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
