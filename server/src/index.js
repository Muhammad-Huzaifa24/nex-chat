import http from 'http'
import dotenv from 'dotenv'

import app from './app.js'
import { connectDB } from './config/db.js'
import { verifyCloudinary } from './config/cloudinary.js'
import { verifyEmailConnection } from './services/emailService.js'
import { initializeSocket } from './socket/socketManager.js'

dotenv.config()

// Pre-flight check for required environment variables
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI']
for (const envKey of REQUIRED_ENV) {
  if (!process.env[envKey]) {
    console.error(`[FATAL ERROR] Required environment variable "${envKey}" is not defined. Server cannot start.`)
    process.exit(1)
  }
}

const server = http.createServer(app)

// Connect to MongoDB & Verify External Services (Cloudinary + EmailJS)
connectDB().then(async () => {
  await verifyCloudinary()
  await verifyEmailConnection()
})

// Initialize Socket.IO (for local dev server)
const io = initializeSocket(server)
app.set('io', io)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`[NexChat Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
})
