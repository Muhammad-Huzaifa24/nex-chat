import DOMPurify from 'dompurify'

/**
 * Sanitize untrusted HTML or text content to prevent XSS attacks.
 * @param {string} dirty - The raw text / HTML to sanitize
 * @returns {string} - Cleaned, safe string
 */
export const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  })
}

/**
 * Strip all HTML tags completely from text.
 * @param {string} text - Input text
 * @returns {string} - Plain text without HTML
 */
export const stripHtml = (text) => {
  if (!text || typeof text !== 'string') return ''
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}
