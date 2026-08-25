import React from 'react'

export const ReactionPicker = ({ onSelectEmoji, onClose }) => {
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  return (
    <div
      className="animate-scale-up"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-popup)',
        border: '1px solid var(--border-color)',
        zIndex: 40,
      }}
    >
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelectEmoji(emoji)
            if (onClose) onClose()
          }}
          style={{
            fontSize: '20px',
            padding: '2px 4px',
            borderRadius: 'var(--radius-full)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
