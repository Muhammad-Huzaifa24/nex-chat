// Controller for extracting OpenGraph / Twitter / oEmbed metadata for link previews

const previewCache = new Map()
const MAX_CACHE_SIZE = 500

/**
 * Extracts OpenGraph, Twitter, and standard HTML meta tags / oEmbed
 * @route GET /api/messages/link-preview?url=...
 */
export const getLinkPreview = async (req, res) => {
  try {
    const { url } = req.query
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'URL is required' })
    }

    let parsedUrl
    try {
      parsedUrl = new URL(url)
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid URL format' })
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ success: false, message: 'Only HTTP/HTTPS URLs allowed' })
    }

    const cleanUrl = parsedUrl.href

    // Check in-memory cache
    if (previewCache.has(cleanUrl)) {
      return res.status(200).json({ success: true, preview: previewCache.get(cleanUrl) })
    }

    const hostname = parsedUrl.hostname.toLowerCase()

    // 1. YouTube specialized oEmbed handling (ensures reliable titles & thumbnails without cookie blocks)
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      try {
        const ytController = new AbortController()
        const ytTimeout = setTimeout(() => ytController.abort(), 3500)
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`,
          { signal: ytController.signal }
        )
        clearTimeout(ytTimeout)

        if (oembedRes.ok) {
          const ytData = await oembedRes.json()
          const preview = {
            url: cleanUrl,
            title: ytData.title || 'YouTube Video',
            description: ytData.author_name ? `By ${ytData.author_name}` : '',
            image: ytData.thumbnail_url || '',
            siteName: ytData.provider_name || 'YouTube',
          }
          saveToCache(cleanUrl, preview)
          return res.status(200).json({ success: true, preview })
        }
      } catch (ytErr) {
        // Continue to video ID fallback
      }

      // Regex fallback for YouTube video ID thumbnail
      const ytMatch = cleanUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
      )
      if (ytMatch && ytMatch[1]) {
        const preview = {
          url: cleanUrl,
          title: 'YouTube Video',
          description: '',
          image: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
          siteName: 'YouTube',
        }
        saveToCache(cleanUrl, preview)
        return res.status(200).json({ success: true, preview })
      }
    }

    // 2. Vimeo specialized oEmbed handling
    if (hostname.includes('vimeo.com')) {
      try {
        const vController = new AbortController()
        const vTimeout = setTimeout(() => vController.abort(), 3500)
        const vRes = await fetch(
          `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(cleanUrl)}`,
          { signal: vController.signal }
        )
        clearTimeout(vTimeout)
        if (vRes.ok) {
          const vData = await vRes.json()
          const preview = {
            url: cleanUrl,
            title: vData.title || 'Vimeo Video',
            description: vData.author_name ? `By ${vData.author_name}` : '',
            image: vData.thumbnail_url || '',
            siteName: 'Vimeo',
          }
          saveToCache(cleanUrl, preview)
          return res.status(200).json({ success: true, preview })
        }
      } catch {}
    }

    // 3. Generic HTML OpenGraph / Twitter Cards extraction
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NexChat/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      return res.status(200).json({
        success: true,
        preview: {
          url: cleanUrl,
          title: parsedUrl.hostname,
          description: '',
          image: '',
          siteName: parsedUrl.hostname,
        },
      })
    }

    // Read only the first 80KB of HTML to keep response fast
    const htmlText = await response.text()
    const headChunk = htmlText.slice(0, 80000)

    const getMeta = (...propNames) => {
      for (const prop of propNames) {
        const regex1 = new RegExp(
          `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
          'i'
        )
        const regex2 = new RegExp(
          `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
          'i'
        )
        const match1 = headChunk.match(regex1)
        if (match1 && match1[1]) return match1[1].trim()
        const match2 = headChunk.match(regex2)
        if (match2 && match2[1]) return match2[1].trim()
      }
      return ''
    }

    // Extract Title
    let title = getMeta('og:title', 'twitter:title')
    if (!title) {
      const titleMatch = headChunk.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim()
      }
    }

    // Extract Description
    const description = getMeta('og:description', 'twitter:description', 'description')

    // Extract Image
    let image = getMeta(
      'og:image:secure_url',
      'og:image',
      'og:image:url',
      'twitter:image:src',
      'twitter:image'
    )

    // Fallback: check <link rel="image_src" href="...">
    if (!image) {
      const linkMatch = headChunk.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)
      if (linkMatch && linkMatch[1]) image = linkMatch[1].trim()
    }

    // Fix relative image URLs
    if (image && !image.startsWith('http://') && !image.startsWith('https://')) {
      try {
        image = new URL(image, cleanUrl).href
      } catch {
        image = ''
      }
    }

    // Site Name
    const siteName =
      getMeta('og:site_name', 'twitter:site') || parsedUrl.hostname.replace(/^www\./, '')

    const preview = {
      url: cleanUrl,
      title: title ? decodeHtmlEntities(title).slice(0, 140) : parsedUrl.hostname,
      description: description ? decodeHtmlEntities(description).slice(0, 220) : '',
      image: image || '',
      siteName: siteName || parsedUrl.hostname,
    }

    saveToCache(cleanUrl, preview)
    return res.status(200).json({ success: true, preview })
  } catch (error) {
    // Graceful fallback on network timeout or error
    return res.status(200).json({
      success: true,
      preview: {
        url: req.query.url || '',
        title: '',
        description: '',
        image: '',
        siteName: '',
      },
    })
  }
}

function saveToCache(url, preview) {
  if (previewCache.size >= MAX_CACHE_SIZE) {
    const firstKey = previewCache.keys().next().value
    previewCache.delete(firstKey)
  }
  previewCache.set(url, preview)
}

// Helper to decode HTML entities
function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
}
