import React from 'react'

/**
 * Reusable animated skeleton placeholder with smooth shimmer animation
 */
export const Skeleton = ({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-sm, 4px)',
  style = {},
  className = '',
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    />
  )
}

/**
 * Skeleton for conversation items in Sidebar
 */
export const ConversationSkeleton = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        gap: 12,
        borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.05))',
      }}
    >
      {/* Avatar skeleton */}
      <Skeleton width="48px" height="48px" borderRadius="50%" style={{ flexShrink: 0 }} />

      {/* Info skeleton */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="120px" height="15px" borderRadius="4px" />
          <Skeleton width="40px" height="11px" borderRadius="4px" />
        </div>
        <Skeleton width="180px" height="13px" borderRadius="4px" />
      </div>
    </div>
  )
}

/**
 * Skeleton for message list loading state
 */
export const MessageListSkeleton = () => {
  const items = [
    { isOutgoing: false, width: '55%', height: '48px' },
    { isOutgoing: true, width: '40%', height: '38px' },
    { isOutgoing: false, width: '70%', height: '62px' },
    { isOutgoing: true, width: '50%', height: '42px' },
    { isOutgoing: false, width: '35%', height: '38px' },
    { isOutgoing: true, width: '65%', height: '54px' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '20px 16px',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            justifyContent: item.isOutgoing ? 'flex-end' : 'flex-start',
            width: '100%',
          }}
        >
          <div
            style={{
              width: item.width,
              maxWidth: '380px',
              height: item.height,
              borderRadius: '12px',
              borderTopRightRadius: item.isOutgoing ? '2px' : '12px',
              borderTopLeftRadius: !item.isOutgoing ? '2px' : '12px',
              backgroundColor: item.isOutgoing
                ? 'rgba(0, 168, 132, 0.16)'
                : 'rgba(255, 255, 255, 0.08)',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            className="skeleton-shimmer"
          >
            <Skeleton
              width="85%"
              height="10px"
              style={{
                backgroundColor: item.isOutgoing
                  ? 'rgba(0, 168, 132, 0.25)'
                  : 'rgba(255, 255, 255, 0.12)',
              }}
            />
            <Skeleton
              width="45%"
              height="8px"
              style={{
                alignSelf: 'flex-end',
                backgroundColor: item.isOutgoing
                  ? 'rgba(0, 168, 132, 0.2)'
                  : 'rgba(255, 255, 255, 0.08)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
