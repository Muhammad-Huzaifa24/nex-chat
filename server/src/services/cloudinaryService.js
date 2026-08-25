import cloudinary from '../config/cloudinary.js'

/**
 * Upload any media (image, video, audio, raw documents) to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from Multer
 * @param {string} type - 'image' | 'video' | 'audio' | 'file' | 'raw'
 * @param {string} folder - Destination folder on Cloudinary
 * @param {string} filename - Original filename for raw files
 * @returns {Promise<{ url: string, publicId: string, duration?: number, bytes?: number, format?: string }>}
 */
export const uploadMediaToCloudinary = (fileBuffer, type = 'image', folder = 'nexchat', filename = '') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      // Graceful fallback to Data URI when Cloudinary credentials are not provided
      const base64 = fileBuffer.toString('base64')
      const mime =
        type === 'video'
          ? 'video/mp4'
          : type === 'audio'
            ? 'audio/mp3'
            : type === 'image'
              ? 'image/jpeg'
              : 'application/octet-stream'
      return resolve({
        url: `data:${mime};base64,${base64}`,
        publicId: `local_${Date.now()}`,
        duration: 0,
        bytes: fileBuffer.length,
      })
    }

    // Determine Cloudinary resource type
    // Note: Cloudinary stores audio files under 'video' resource type, and general docs/zips under 'raw'
    let resourceType = 'auto'
    if (type === 'video' || type === 'audio') {
      resourceType = 'video'
    } else if (type === 'file' || type === 'raw') {
      resourceType = 'raw'
    }

    const options = {
      folder,
      resource_type: resourceType,
    }

    // Preserve filename for documents / raw files if available
    if (filename && resourceType === 'raw') {
      const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      options.public_id = `${Date.now()}_${sanitizedName}`
    }

    console.log('[Cloudinary Upload]', {
      type,
      resourceType,
      folder,
      filename,
      size: fileBuffer.length,
    })

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error('[Cloudinary Upload Error]', {
          message: error.message,
          http_code: error.http_code,
          name: error.name,
          error: error,
        })

        return reject(error)
      }

      resolve({
        url: result.secure_url || result.url,
        publicId: result.public_id,
        duration: result.duration || 0,
        bytes: result.bytes || fileBuffer.length,
        format: result.format || '',
      })
    })

    uploadStream.end(fileBuffer)
  })
}
