import React, { useState, useEffect } from 'react'
import { ExternalLink, Globe } from 'lucide-react'
import { fetchLinkPreview, previewCache } from '../../services/linkPreviewService'

export const LinkPreviewCard = ({ url }) => {
  const [preview, setPreview] = useState(() => (url ? previewCache.get(url) || null : null))
  const [isLoading, setIsLoading] = useState(() => (url ? !previewCache.has(url) : false))

  useEffect(() => {
    if (!url) return

    // If already cached, use immediately
    if (previewCache.has(url)) {
      setPreview(previewCache.get(url))
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    fetchLinkPreview(url)
      .then((data) => {
        if (isMounted && data) {
          setPreview(data)
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [url])

  if (isLoading || !preview || (!preview.title && !preview.image)) {
    return null
  }

  let displayDomain = ''
  try {
    displayDomain = preview.siteName || new URL(url).hostname.replace(/^www\./, '')
  } catch {
    displayDomain = preview.siteName || 'link'
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        textDecoration: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.22)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: 6,
        transition: 'background-color 0.15s ease, transform 0.15s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.32)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.22)'
      }}
    >
      {/* Thumbnail Banner (16:9 full width cover) */}
      {preview.image && (
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: '16 / 9',
            maxHeight: 180,
          }}
        >
          <img
            src={preview.image}
            alt={preview.title || 'Link preview'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              const parent = e.currentTarget.parentElement
              if (parent) parent.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Details Box */}
      <div style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: '11px',
            color: 'var(--text-muted, #8696a0)',
            marginBottom: 3,
            textTransform: 'lowercase',
          }}
        >
          <Globe size={11} />
          <span style={{ fontWeight: 500 }}>{displayDomain}</span>
          <ExternalLink size={10} style={{ marginLeft: 'auto', opacity: 0.6 }} />
        </div>

        {preview.title && (
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary, #e9edef)',
              lineHeight: 1.35,
              marginBottom: preview.description ? 3 : 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {preview.title}
          </div>
        )}

        {preview.description && (
          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--text-secondary, #8696a0)',
              lineHeight: 1.35,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {preview.description}
          </div>
        )}
      </div>
    </a>
  )
}
