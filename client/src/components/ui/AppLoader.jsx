import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Lock } from 'lucide-react'

export const AppLoader = ({ onComplete }) => {
  const [statusIndex, setStatusIndex] = useState(0)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const statusMessages = [
    'Starting NexChat...',
    'Connecting to secure chat...',
    'Loading your conversations...',
  ]

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStatusIndex((prev) => (prev < statusMessages.length - 1 ? prev + 1 : prev))
    }, 950)

    const finishTimer = setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current()
    }, 3000)

    return () => {
      clearInterval(stepInterval)
      clearTimeout(finishTimer)
    }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#111b21',
        color: '#e9edef',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Brand Icon & Name */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '24px',
            backgroundColor: 'rgba(0, 168, 132, 0.12)',
            border: '1.5px solid rgba(0, 168, 132, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0, 168, 132, 0.2)',
          }}
        >
          <MessageSquare size={38} color="#00a884" />
        </div>

        <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Nex<span style={{ color: '#00a884' }}>Chat</span>
        </div>
      </div>

      {/* Slim Progress Bar (Smooth 3s fill animation) */}
      <div
        style={{
          width: 240,
          height: 3.5,
          backgroundColor: '#202c33',
          borderRadius: 4,
          overflow: 'hidden',
          marginTop: 28,
          marginBottom: 16,
          position: 'relative',
        }}
      >
        <div
          onAnimationEnd={() => {
            if (onCompleteRef.current) onCompleteRef.current()
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '0%',
            backgroundColor: '#00a884',
            borderRadius: 4,
            animation: 'appLoaderProgress 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
          }}
        />
      </div>

      {/* Dynamic Status Text */}
      <div
        style={{
          fontSize: '13px',
          color: '#8696a0',
          fontWeight: 500,
          minHeight: 20,
          textAlign: 'center',
          transition: 'opacity 0.2s ease',
        }}
      >
        {statusMessages[statusIndex]}
      </div>

      {/* WhatsApp-Style End-to-End Encryption Badge at Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '12px',
          color: '#667781',
          letterSpacing: '0.3px',
        }}
      >
        <Lock size={12} />
        <span>End-to-end encrypted messaging</span>
      </div>

      <style>{`
        @keyframes appLoaderProgress {
          0% {
            width: 0%;
          }
          25% {
            width: 32%;
          }
          60% {
            width: 72%;
          }
          85% {
            width: 92%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
