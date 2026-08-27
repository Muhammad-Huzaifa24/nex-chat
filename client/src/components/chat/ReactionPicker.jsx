import React from 'react'

export const ReactionPicker = ({ onSelectEmoji, onClose, isOutgoing = false }) => {
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  return (
    <>
      {/* Invisible click-outside backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          backgroundColor: 'transparent',
          cursor: 'default',
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (onClose) onClose()
        }}
      />

      {/* Floating Reaction Pill */}
      <div
        className="animate-scale-up"
        style={{
          position: 'absolute',
          bottom: '100%',
          marginBottom: 8,
          [isOutgoing ? 'right' : 'left']: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          border: '1px solid var(--border-color)',
          zIndex: 90,
          userSelect: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {quickEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelectEmoji(emoji)
              if (onClose) onClose()
            }}
            style={{
              fontSize: '22px',
              padding: '3px 6px',
              borderRadius: 'var(--radius-full)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
