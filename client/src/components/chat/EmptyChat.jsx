import React from 'react'
import { MessageSquare, Shield, Zap, Lock } from 'lucide-react'

export const EmptyChat = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-app)',
        borderBottom: '6px solid var(--primary-color)',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 12px 24px rgba(0, 168, 132, 0.25)',
          marginBottom: 24,
        }}
      >
        <MessageSquare size={44} />
      </div>

      <h1
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 10,
        }}
      >
        NexChat for Web
      </h1>

      <p
        style={{
          maxWidth: 440,
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 1.6,
          marginBottom: 28,
        }}
      >
        Send and receive real-time messages, media, and documents. Select a chat from the sidebar or start a new conversation.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        <Lock size={14} />
        <span>End-to-end connected realtime communication</span>
      </div>
    </div>
  )
}
