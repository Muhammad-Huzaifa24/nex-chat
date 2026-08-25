import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

// Configure Cloudinary SDK
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  })
}

/**
 * Verifies the connection to Cloudinary Admin API and logs the status
 */
export const verifyCloudinary = async () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[Cloudinary] Warning: Credentials not fully configured in .env. Fallback mode active.')
    return false
  }

  try {
    const result = await cloudinary.api.ping()
    if (result && result.status === 'ok') {
      console.log(`[Cloudinary] Connected: ${cloudName}`)
      return true
    } else {
      console.warn(`[Cloudinary] Ping returned unexpected status:`, result)
      return false
    }
  } catch (error) {
    console.error(`[Cloudinary Error] Failed to connect: ${error.message} (HTTP ${error.http_code || error.status || 'unknown'})`)
    return false
  }
}

export default cloudinary
