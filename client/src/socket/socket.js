import { io } from 'socket.io-client'

let socket = null

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/'

export const getSocket = (token) => {
  if (!token) return null

  // Skip initializing Socket.IO in production if no explicit socket server endpoint is specified
  const isProduction = import.meta.env.PROD
  const hasExplicitSocketUrl = Boolean(import.meta.env.VITE_SOCKET_URL)
  if (isProduction && !hasExplicitSocketUrl) {
    console.log('[Socket.IO Client] Bypassing connection (Production Vercel serverless environment)')
    return null
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO Client Connection Error]', err.message)
    })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
