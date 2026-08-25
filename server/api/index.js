import app from '../src/app.js'
import { connectDB } from '../src/config/db.js'

// Vercel Serverless Handler
export default async function handler(req, res) {
  // Connect to DB (cached — safe to call on every invocation)
  // We don't throw here so CORS headers from Express are always sent
  try {
    await connectDB()
  } catch (error) {
    console.error('[Vercel Serverless DB Error]', error.message)
    // Continue — Express will still handle the request and send CORS headers
    // The individual route handlers will handle DB errors gracefully
  }

  return app(req, res)
}
