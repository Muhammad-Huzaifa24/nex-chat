import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

cloudinary.config({
  cloud_name: cloudName.trim(),
  api_key: apiKey.trim(),
  api_secret: apiSecret.trim(),
  secure: true,
})

async function testUsage() {
  console.log('\n--- Checking Cloudinary Usage & Plan Info ---')
  try {
    const usage = await cloudinary.api.usage()
    console.log('Plan:', usage.plan)
    console.log('Credits:', usage.credits)
    console.log('Transformations:', usage.transformations)
    console.log('Storage:', usage.storage)
    console.log('Bandwidth:', usage.bandwidth)
  } catch (err) {
    console.error('Usage check error:', err.message, err)
  }

  console.log('\n--- Testing Upload with different options ---')
  const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

  // Try direct uploader.upload
  try {
    console.log('Attempting simple base64 uploader.upload...')
    const res = await cloudinary.uploader.upload(testBase64, {
      folder: 'nexchat',
    })
    console.log('Simple upload success:', res.secure_url)
    await cloudinary.uploader.destroy(res.public_id)
  } catch (err) {
    console.error('Simple upload failed:', err)
  }
}

testUsage()
