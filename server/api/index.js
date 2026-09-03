import app from '../src/app.js'
import { connectDB } from '../src/config/db.js'
import { verifyEmailConnection } from '../src/services/emailService.js'

let isInitialized = false

// Vercel Serverless Handler
export default async function handler(req, res) {
  // Cold start diagnostics (runs once per serverless container spin-up)
  if (!isInitialized) {
    console.log('[Vercel Serverless Cold Start] Initializing NexChat backend services...')
    verifyEmailConnection().catch((err) =>
      console.warn('[Vercel Boot Warning]', err.message)
    )
    isInitialized = true
  }

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
