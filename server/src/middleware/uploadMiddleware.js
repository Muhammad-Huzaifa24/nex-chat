import multer from 'multer'

// Use memory storage to process buffers directly with Cloudinary
const storage = multer.memoryStorage()

// Maximum standard size limits (in bytes)
export const FILE_LIMITS = {
  image: 15 * 1024 * 1024, // 15 MB
  video: 50 * 1024 * 1024, // 50 MB
  audio: 20 * 1024 * 1024, // 20 MB
  file: 30 * 1024 * 1024,  // 30 MB (documents, zips, etc.)
  maxOverall: 50 * 1024 * 1024, // 50 MB overall multer threshold
}

// Whitelisted MIME types for secure uploads
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/mpeg',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
  // Documents & Archives
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
])

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type "${file.mimetype}" is not supported or prohibited for security reasons.`), false)
  }
}

export const upload = multer({
  storage,
  limits: {
    fileSize: FILE_LIMITS.maxOverall, // 50 MB max limit
  },
  fileFilter,
})
