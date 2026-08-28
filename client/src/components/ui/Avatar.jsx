import React from 'react'

export const Avatar = ({ src, name = 'User', size = 'md', isOnline = false, className = '' }) => {
  const getInitials = (str) => {
    if (!str) return '?'
    const parts = str.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return str.slice(0, 2).toUpperCase()
  }

  // Consistent background color based on name
  const getColor = (str) => {
    const colors = [
      '#00a884', '#128c7e', '#34b7f1', '#ea4335',
      '#8e24aa', '#e91e63', '#ff9800', '#009688',
    ]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const sizeClasses = {
    xs: { width: 24, height: 24, fontSize: 10, dot: 6 },
    sm: { width: 34, height: 34, fontSize: 12, dot: 8 },
    md: { width: 44, height: 44, fontSize: 15, dot: 10 },
    lg: { width: 64, height: 64, fontSize: 22, dot: 14 },
    xl: { width: 110, height: 110, fontSize: 36, dot: 20 },
  }

  const config = sizeClasses[size] || sizeClasses.md

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        flexShrink: 0,
        width: config.width,
        height: config.height,
        backgroundColor: src ? 'transparent' : getColor(name),
        overflow: 'visible',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: 'block',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex'
            }
          }}
        />
      ) : null}
      <span
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          fontWeight: 600,
          color: '#ffffff',
          userSelect: 'none',
          fontSize: config.fontSize,
          display: src ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {getInitials(name)}
      </span>

      {isOnline && (
        <span
          title="Online"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: config.dot,
            height: config.dot,
            borderRadius: '50%',
            backgroundColor: 'var(--status-online, #25d366)',
            border: '2px solid var(--bg-surface, #ffffff)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
            zIndex: 2,
          }}
        />
      )}
    </div>
  )
}
