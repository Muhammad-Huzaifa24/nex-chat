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
      className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 ${className}`}
      style={{
        width: config.width,
        height: config.height,
        backgroundColor: src ? 'transparent' : getColor(name),
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextSibling.style.display = 'flex'
          }}
        />
      ) : null}
      <span
        className="font-semibold text-white select-none"
        style={{
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
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: config.dot,
            height: config.dot,
            backgroundColor: 'var(--status-online)',
            borderColor: 'var(--bg-surface)',
          }}
        />
      )}
    </div>
  )
}
