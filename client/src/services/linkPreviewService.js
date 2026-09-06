import api from './api'

// Shared in-memory cache for link previews
export const previewCache = new Map()
const pendingRequests = new Map()

/**
 * Fetches OpenGraph / oEmbed link preview data with deduplication and caching
 * @param {string} rawUrl
 * @returns {Promise<object|null>}
 */
export const fetchLinkPreview = async (rawUrl) => {
  if (!rawUrl) return null

  let cleanUrl = rawUrl.trim()
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`
  }

  // Check cache first
  if (previewCache.has(cleanUrl)) {
    return previewCache.get(cleanUrl)
  }

  // Deduplicate ongoing network requests for the same URL
  if (pendingRequests.has(cleanUrl)) {
    return pendingRequests.get(cleanUrl)
  }

  const requestPromise = api
    .get(`/messages/link-preview?url=${encodeURIComponent(cleanUrl)}`)
    .then((res) => {
      if (res.data?.success && res.data?.preview) {
        const preview = res.data.preview
        previewCache.set(cleanUrl, preview)
        return preview
      }
      return null
    })
    .catch((err) => {
      console.warn('Link preview fetch error:', err?.message || err)
      return null
    })
    .finally(() => {
      pendingRequests.delete(cleanUrl)
    })

  pendingRequests.set(cleanUrl, requestPromise)
  return requestPromise
}
