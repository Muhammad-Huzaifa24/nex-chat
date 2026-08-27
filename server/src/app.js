import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'

import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import conversationRoutes from './routes/conversationRoutes.js'
import messageRoutes from './routes/messageRoutes.js'

dotenv.config()

const app = express()

// ─── CORS ──────────────────────────────────────────────────────────────────
// Must be defined before all other middleware, especially before express.json()
// Cannot use wildcard '*' with credentials: true — must whitelist exact origins.
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean)

const corsOptions = {
  origin: 'https://nex-chat-wjpg.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 204,
}

// Apply CORS to all routes
app.use(cors(corsOptions))

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

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
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

export default app
