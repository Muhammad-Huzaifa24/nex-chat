import React, { useState, useRef, useEffect } from 'react'
import { Plus, MessageSquarePlus, Users, X } from 'lucide-react'

export const SidebarFAB = ({ onOpenNewChat, onOpenNewGroup }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        bottom: 24,
        right: 20,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
      }}
    >
      {/* Expanded Options */}
      {isOpen && (
        <div
          className="animate-slide-up"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'flex-end',
            marginBottom: 4,
          }}
        >
          {/* New Group Button */}
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenNewGroup()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)'
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)'
            }}
          >
            <span>New group</span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 168, 132, 0.15)',
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={16} />
            </div>
          </button>

          {/* New Chat Button */}
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenNewChat()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)'
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)'
            }}
          >
            <span>New chat</span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 168, 132, 0.15)',
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquarePlus size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Main Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close menu' : 'New chat or group'}
        style={{
          width: 54,
          height: 54,
          borderRadius: '16px',
          backgroundColor: 'var(--primary-color)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 6px 18px rgba(0, 168, 132, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s ease',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.06)' : 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'scale(1)')}
      >
        {isOpen ? <X size={24} /> : <Plus size={26} strokeWidth={2.5} />}
      </button>
    </div>
  )
}
