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

const fileFilter = (req, file, cb) => {
  // Allow all standard media & documents
  cb(null, true)
}

export const upload = multer({
  storage,
  limits: {
    fileSize: FILE_LIMITS.maxOverall, // 50 MB max limit
  },
  fileFilter,
})
