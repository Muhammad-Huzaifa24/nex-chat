import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoSanitize from 'express-mongo-sanitize'
import hpp from 'hpp'

import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import conversationRoutes from './routes/conversationRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import { apiGlobalLimiter } from './middleware/rateLimitMiddleware.js'

dotenv.config()

const app = express()

// Trust first proxy hop (Vercel Edge Proxy / reverse proxies)
// Required for express-rate-limit and accurate client IP detection via X-Forwarded-For
app.set('trust proxy', 1)

// ─── CORS ──────────────────────────────────────────────────────────────────
// Must be defined before all other middleware, especially before express.json()
// Cannot use wildcard '*' with credentials: true — must whitelist exact origins.
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://nex-chat-wjpg.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean)

const corsOptions = {
  origin(origin, callback) {
    // allow non-browser tools (curl, server-to-server) with no origin
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 204,
}

// Apply CORS to all routes
app.use(cors(corsOptions))

// ─── Security Headers (Helmet) ─────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// ─── Body Parsers & Sanitizers ─────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize())

// Prevent HTTP Parameter Pollution attacks
app.use(hpp())

// ─── Rate Limiting ─────────────────────────────────────────────────────────
app.use('/api', apiGlobalLimiter)

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/messages', messageRoutes)

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV || 'development' })
})

// ─── Root ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({ name: 'NexChat API Server', status: 'online' })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File is too large! Maximum allowed upload size is 50MB.',
    })
  }

  console.error('[Unhandled Error]', err)

  // In production, avoid leaking internal database or stack traces
  const isProduction = process.env.NODE_ENV === 'production'
  const message = isProduction
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal Server Error'

  res.status(err.status || 500).json({
    success: false,
    message,
  })
})

export default app
