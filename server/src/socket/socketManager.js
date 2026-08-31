import { Server } from 'socket.io'
import { verifyToken } from '../utils/jwt.js'
import User from '../models/User.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { triggerPusherEvent } from '../config/pusher.js'

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  })

  // Map of userId -> Set of socketIds
  const onlineUsers = new Map()

  // Socket Auth Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0]
      if (!token) {
        return next(new Error('Authentication required for socket'))
      }

      const decoded = verifyToken(token)
      const user = await User.findById(decoded.id).select('_id username displayName')
      if (!user) {
        return next(new Error('User not found'))
      }

      socket.user = user
      next()
    } catch (err) {
      next(new Error('Socket authentication failed'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString()
    console.log(`[Socket] User connected: ${socket.user.username} (${socket.id})`)

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set())
    }
    onlineUsers.get(userId).add(socket.id)

    // Update DB status and broadcast online
    await User.findByIdAndUpdate(userId, { isOnline: true })
    io.emit('user:online', { userId, isOnline: true })

    // Auto-join all conversation rooms for this user
    try {
      const userConversations = await Conversation.find({ participants: userId }).select('_id')
      userConversations.forEach((conv) => {
        socket.join(conv._id.toString())
      })

      // Catch-up: Mark pending 'sent' messages from other users as 'delivered' in bulk
      const conversationIds = userConversations.map((conv) => conv._id)
      const pendingMessages = await Message.find({
        conversationId: { $in: conversationIds },
        senderId: { $ne: userId },
        status: 'sent'
      }).select('_id conversationId')

      if (pendingMessages.length > 0) {
        await Message.updateMany(
          { _id: { $in: pendingMessages.map((m) => m._id) } },
          { status: 'delivered' }
        )

        // Group by conversation to trigger events
        const conversationGroup = {}
        pendingMessages.forEach((msg) => {
          const cId = msg.conversationId.toString()
          if (!conversationGroup[cId]) {
            conversationGroup[cId] = []
          }
          conversationGroup[cId].push(msg._id.toString())
        })

        // Broadcast status updates
        for (const [cId, msgIds] of Object.entries(conversationGroup)) {
          const channels = [`conversation-${cId}`]
          const conversation = await Conversation.findById(cId)
          if (conversation?.participants) {
            conversation.participants.forEach((p) => {
              channels.push(`user-${p.toString()}`)
            })
          }

          // Trigger Pusher
          triggerPusherEvent(channels, 'message:status_update', {
            conversationId: cId,
            status: 'delivered',
            readBy: userId,
          })

          // Trigger Socket.io
          io.to(cId).emit('message:status_update', {
            conversationId: cId,
            status: 'delivered',
            readBy: userId,
          })
        }
      }
    } catch (err) {
      console.error('[Socket Room Join/Catch-Up Error]', err)
    }

    // Join specific conversation room (e.g. newly created)
    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId)
    })

    // Leave conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(conversationId)
    })

    // Realtime message send event
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, content, type = 'text', attachmentUrl, attachmentMeta, replyTo } = data

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        })

        if (!conversation) {
          if (callback) callback({ error: 'Conversation not found or unauthorized' })
          return
        }

        const newMessage = await Message.create({
          conversationId,
          senderId: userId,
          content: content ? content.trim() : '',
          type,
          attachmentUrl: attachmentUrl || '',
          attachmentMeta: attachmentMeta || {},
          replyTo: replyTo || null,
          status: 'sent',
        })

        conversation.lastMessage = newMessage._id
        conversation.lastMessageAt = new Date()
        conversation.hiddenFor = []
        await conversation.save()

        const populated = await Message.findById(newMessage._id)
          .populate('senderId', 'username displayName avatar isOnline')
          .populate({
            path: 'replyTo',
            populate: { path: 'senderId', select: 'displayName username' },
          })

        // Broadcast to all sockets in conversation room
        io.to(conversationId).emit('message:new', {
          message: populated,
          conversationId,
        })

        if (callback) callback({ success: true, message: populated })
      } catch (err) {
        console.error('[Socket message:send Error]', err)
        if (callback) callback({ error: err.message })
      }
    })

    // Typing start indicator
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:start', {
        conversationId,
        user: {
          _id: socket.user._id,
          username: socket.user.username,
          displayName: socket.user.displayName,
        },
      })
    })

    // Typing stop indicator
    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', {
        conversationId,
        userId: socket.user._id,
      })
    })

    // Read receipt
    socket.on('message:read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: socket.user._id },
            status: { $ne: 'read' },
          },
          { status: 'read' }
        )

        io.to(conversationId).emit('message:status_update', {
          conversationId,
          status: 'read',
          readBy: socket.user._id,
        })
      } catch (err) {
        console.error('[Socket message:read Error]', err)
      }
    })

    // Reaction update
    socket.on('message:react', async ({ messageId, emoji, conversationId }) => {
      try {
        const message = await Message.findById(messageId)
        if (!message) return

        const existingIdx = message.reactions.findIndex(
          (r) => r.userId.toString() === userId && r.emoji === emoji
        )

        if (existingIdx > -1) {
          message.reactions.splice(existingIdx, 1)
        } else {
          message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId)
          message.reactions.push({ userId: socket.user._id, emoji })
        }

        await message.save()

        const populated = await Message.findById(messageId).populate('reactions.userId', '_id displayName username avatar')

        io.to(conversationId).emit('message:reaction_update', {
          messageId,
          reactions: populated.reactions,
          conversationId,
        })
      } catch (err) {
        console.error('[Socket message:react Error]', err)
      }
    })

    // Delete message event
    socket.on('message:delete', async ({ messageId, conversationId, deleteFor }) => {
      try {
        if (deleteFor === 'everyone') {
          io.to(conversationId).emit('message:deleted', {
            messageId,
            conversationId,
            deleteFor: 'everyone',
          })
        }
      } catch (err) {
        console.error('[Socket message:delete Error]', err)
      }
    })

    // Group update broadcasts
    socket.on('group:updated', ({ conversationId, updatedConversation }) => {
      io.to(conversationId).emit('group:updated', { conversationId, updatedConversation })
    })

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.user.username} (${socket.id})`)
      const userSockets = onlineUsers.get(userId)
      if (userSockets) {
        userSockets.delete(socket.id)
        if (userSockets.size === 0) {
          onlineUsers.delete(userId)
          const lastSeen = new Date()
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen })
          io.emit('user:offline', { userId, isOnline: false, lastSeen })
        }
      }
    })
  })

  return io
}
