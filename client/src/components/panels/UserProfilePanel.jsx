import React from 'react'
import { Avatar } from '../ui/Avatar'
import { ArrowLeft, X, Mail, Phone, Info, ShieldCheck } from 'lucide-react'

export const UserProfilePanel = ({ conversation, currentUserId, onClose }) => {
  const otherUser = conversation.participants?.find((p) => (p._id || p) !== currentUserId)

  if (!otherUser) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="side-panel">
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
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ width: 36, height: 36 }}
          title="Close Contact Info"
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
          Contact Info
        </span>
      </div>

      {/* Profile Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Avatar & Main Info Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '20px 16px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Avatar
            src={otherUser.avatar}
            name={otherUser.displayName || otherUser.username}
            size="xl"
            isOnline={otherUser.isOnline}
          />
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              marginTop: 14,
              color: 'var(--text-primary)',
              wordBreak: 'break-word',
            }}
          >
            {otherUser.displayName || otherUser.username}
          </h2>
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 2,
            }}
          >
            @{otherUser.username}
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              color: otherUser.isOnline ? 'var(--status-online)' : 'var(--text-muted)',
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: otherUser.isOnline ? 'var(--status-online)' : 'var(--text-muted)',
              }}
            />
            {otherUser.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* About / Bio Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <Info size={14} color="var(--primary-color)" /> About
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {otherUser.bio || 'Hey there! I am using NexChat.'}
          </div>
        </div>

        {/* Contact Details Card */}
        {(otherUser.email || otherUser.phone) && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Contact Details
            </div>

            {otherUser.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-app)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Mail size={16} color="var(--primary-color)" />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Email</div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-primary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {otherUser.email}
                  </div>
                </div>
              </div>
            )}

            {otherUser.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-app)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Phone size={16} color="var(--primary-color)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Phone</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                    {otherUser.phone}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Encryption badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: 'var(--font-size-xs)',
            marginTop: 'auto',
          }}
        >
          <ShieldCheck size={16} color="var(--primary-color)" />
          <span>Messages and calls are secured with end-to-end encryption.</span>
        </div>
      </div>
      </div>
    </>
  )
}
