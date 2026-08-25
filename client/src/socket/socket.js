import { io } from 'socket.io-client'

let socket = null

export const getSocket = (token) => {
  if (!socket && token) {
    socket = io('/', {
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
      console.warn('[Socket.IO Client Error]', err.message)
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
