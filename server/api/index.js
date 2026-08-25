import app from '../src/app.js'
import { connectDB } from '../src/config/db.js'

// Vercel Serverless Handler
export default async function handler(req, res) {
  try {
    await connectDB()
  } catch (error) {
    console.error('[Vercel Serverless DB Error]', error)
  }

  return app(req, res)
}
