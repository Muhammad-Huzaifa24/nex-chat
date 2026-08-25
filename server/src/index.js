import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'

import { connectDB } from './config/db.js'
import { verifyCloudinary } from './config/cloudinary.js'
import { initializeSocket } from './socket/socketManager.js'

import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import conversationRoutes from './routes/conversationRoutes.js'
import messageRoutes from './routes/messageRoutes.js'

dotenv.config()

const app = express()
const server = http.createServer(app)

// Connect to MongoDB & Verify Cloudinary
connectDB().then(() => {
  verifyCloudinary()
})

// Initialize Socket.IO
const io = initializeSocket(server)
app.set('io', io)

// Middleware
app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('dev'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/messages', messageRoutes)

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() })
})

// Global Error Handler
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

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`[NexChat Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
})
