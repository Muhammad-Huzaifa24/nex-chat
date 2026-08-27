import http from 'http'
import dotenv from 'dotenv'

import app from './app.js'
import { connectDB } from './config/db.js'
import { verifyCloudinary } from './config/cloudinary.js'
import { verifyEmailConnection } from './services/emailService.js'
import { initializeSocket } from './socket/socketManager.js'

dotenv.config()

const server = http.createServer(app)

// Connect to MongoDB & Verify External Services (Cloudinary + Nodemailer)
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
