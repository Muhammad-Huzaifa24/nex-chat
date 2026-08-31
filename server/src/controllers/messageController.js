import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'
import { uploadMediaToCloudinary } from '../services/cloudinaryService.js'
import { FILE_LIMITS } from '../middleware/uploadMiddleware.js'
import { triggerPusherEvent } from '../config/pusher.js'
import { sendOfflineNotification } from '../services/emailService.js'

// @desc    Get messages for a conversation (paginated)
// @route   GET /api/messages/:conversationId
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit
    const userId = req.user._id

    // Check conversation membership
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    })

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized to view messages in this conversation' })
    }

    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username displayName avatar isOnline')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'displayName username' },
      })

    const total = await Message.countDocuments({
      conversationId,
      deletedFor: { $ne: userId },
    })

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      hasMore: skip + messages.length < total,
      total,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Send a message (text or attachment via Cloudinary)
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyTo } = req.body
    const userId = req.user._id

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    })

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized in this conversation' })
    }

    let attachmentUrl = ''
    let attachmentMeta = {}

    if (req.file) {
      const file = req.file

      // Standard size limit checks per category
      if (type === 'video' && file.size > FILE_LIMITS.video) {
        return res.status(400).json({
          success: false,
          message: `Video size exceeds the 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a shorter or compressed video.`,
        })
      } else if (type === 'image' && file.size > FILE_LIMITS.image) {
        return res.status(400).json({
          success: false,
          message: `Image size exceeds the 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please select a smaller photo.`,
        })
      } else if (type === 'audio' && file.size > FILE_LIMITS.audio) {
        return res.status(400).json({
          success: false,
          message: `Audio file exceeds the 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        })
      } else if (type === 'file' && file.size > FILE_LIMITS.file) {
        return res.status(400).json({
          success: false,
          message: `Document size exceeds the 30MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        })
      }

      // Upload to Cloudinary based on media type
      const folder = `nexchat/${type === 'file' ? 'documents' : `${type}s`}`
      const uploadResult = await uploadMediaToCloudinary(file.buffer, type, folder, file.originalname)

      attachmentUrl = uploadResult.url
      attachmentMeta = {
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        duration: uploadResult.duration || 0,
        publicId: uploadResult.publicId || '',
      }
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: userId,
      content: content ? content.trim() : '',
      type,
      attachmentUrl,
      attachmentMeta,
      replyTo: replyTo || null,
      status: 'sent',
    })

    // Update conversation last message
    conversation.lastMessage = newMessage._id
    conversation.lastMessageAt = new Date()
    // Unhide conversation for all participants
    conversation.hiddenFor = []
    await conversation.save()

    const populated = await Message.findById(newMessage._id)
      .populate('senderId', 'username displayName avatar isOnline')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'displayName username' },
      })

    // Trigger Realtime Pusher events
    const channels = [`conversation-${conversationId}`]
    if (conversation.participants && Array.isArray(conversation.participants)) {
      conversation.participants.forEach((p) => {
        channels.push(`user-${p.toString()}`)
      })
    }

    triggerPusherEvent(channels, 'message:new', {
      message: populated,
      conversationId,
    })

    // Bridge to Socket.IO if instance exists
    const io = req.app?.get('io')
    if (io) {
      io.to(conversationId).emit('message:new', {
        message: populated,
        conversationId,
      })
    }

    // Send email notification to offline participants (async non-blocking)
    Conversation.findById(conversationId)
      .populate('participants', 'username displayName email isOnline lastNotifiedAt')
      .then((conv) => {
        if (!conv || !conv.participants) return
        const offlineRecipients = conv.participants.filter(
          (p) => p._id.toString() !== userId.toString() && !p.isOnline
        )
        offlineRecipients.forEach((recipient) => {
          sendOfflineNotification(recipient, req.user, populated, conv)
        })
      })
      .catch((err) => console.error('[Offline Email Error]', err))

    res.status(201).json({ success: true, message: populated })
  } catch (error) {
    console.error('[Send Message Error]', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to send message' })
  }
}

// @desc    Delete message (for me or everyone)
// @route   DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { deleteFor = 'me' } = req.query
    const userId = req.user._id

    const message = await Message.findById(id)
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }

    if (deleteFor === 'everyone') {
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'You can only delete your own messages for everyone' })
      }
      message.isDeletedForEveryone = true
      message.content = 'This message was deleted'
      message.attachmentUrl = ''
      message.attachmentMeta = {}
      await message.save()

      const channels = [`conversation-${message.conversationId}`]
      const conversation = await Conversation.findById(message.conversationId)
      if (conversation?.participants && Array.isArray(conversation.participants)) {
        conversation.participants.forEach((p) => {
          channels.push(`user-${p.toString()}`)
        })
      }

      triggerPusherEvent(channels, 'message:deleted', {
        messageId: id,
        conversationId: message.conversationId,
        deleteFor: 'everyone',
      })

      // Bridge to Socket.IO if instance exists
      const io = req.app?.get('io')
      if (io) {
        io.to(message.conversationId.toString()).emit('message:deleted', {
          messageId: id,
          conversationId: message.conversationId,
          deleteFor: 'everyone',
        })
      }
    } else {
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId)
        await message.save()
      }
    }

    res.status(200).json({ success: true, message: 'Message deleted', messageId: id, deleteFor })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    React to a message with emoji
// @route   POST /api/messages/:id/react
export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { emoji } = req.body
    const userId = req.user._id

    const message = await Message.findById(id)
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }

    const existingIdx = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    )

    if (existingIdx > -1) {
      // Toggle off
      message.reactions.splice(existingIdx, 1)
    } else {
      // Remove any prior reaction from this user and add new one
      message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId.toString())
      message.reactions.push({ userId, emoji })
    }

    await message.save()

    // Populate userId in reactions so client gets full user data
    const populated = await Message.findById(id).populate('reactions.userId', '_id displayName username avatar')
    const populatedReactions = populated.reactions

    const channels = [`conversation-${message.conversationId}`]
    const conversation = await Conversation.findById(message.conversationId)
    if (conversation?.participants && Array.isArray(conversation.participants)) {
      conversation.participants.forEach((p) => {
        channels.push(`user-${p.toString()}`)
      })
    }

    triggerPusherEvent(channels, 'message:reaction_update', {
      messageId: id,
      reactions: populatedReactions,
      conversationId: message.conversationId,
    })

    // Bridge to Socket.IO if instance exists
    const io = req.app?.get('io')
    if (io) {
      io.to(message.conversationId.toString()).emit('message:reaction_update', {
        messageId: id,
        reactions: populatedReactions,
        conversationId: message.conversationId,
      })
    }

    res.status(200).json({ success: true, reactions: populatedReactions })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Mark conversation messages as read
// @route   PUT /api/messages/read/:conversationId
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user._id

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        status: { $ne: 'read' },
      },
      { status: 'read' }
    )

    const channels = [`conversation-${conversationId}`]
    const conversation = await Conversation.findById(conversationId)
    if (conversation?.participants && Array.isArray(conversation.participants)) {
      conversation.participants.forEach((p) => {
        channels.push(`user-${p.toString()}`)
      })
    }

    triggerPusherEvent(channels, 'message:status_update', {
      conversationId,
      status: 'read',
      readBy: userId,
    })

    // Bridge to Socket.IO if instance exists
    const io = req.app?.get('io')
    if (io) {
      io.to(conversationId).emit('message:status_update', {
        conversationId,
        status: 'read',
        readBy: userId,
      })
    }

    res.status(200).json({ success: true, message: 'Messages marked as read' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Broadcast typing status
// @route   POST /api/messages/typing
export const sendTypingStatus = async (req, res) => {
  try {
    const { conversationId, isTyping } = req.body
    const userId = req.user._id

    triggerPusherEvent(`conversation-${conversationId}`, isTyping ? 'typing:start' : 'typing:stop', {
      conversationId,
      userId,
      user: {
        _id: req.user._id,
        displayName: req.user.displayName,
        username: req.user.username,
      },
    })

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Mark a message as delivered
// @route   PUT /api/messages/deliver/:messageId
export const markMessageAsDelivered = async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = req.user._id

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }

    // Only update if currently sent. Do not overwrite read status.
    if (message.status === 'sent') {
      message.status = 'delivered'
      await message.save()

      const conversationId = message.conversationId.toString()
      const channels = [`conversation-${conversationId}`]
      const conversation = await Conversation.findById(conversationId)
      if (conversation?.participants && Array.isArray(conversation.participants)) {
        conversation.participants.forEach((p) => {
          channels.push(`user-${p.toString()}`)
        })
      }

      // Trigger status update to double ticks
      triggerPusherEvent(channels, 'message:status_update', {
        conversationId,
        messageId,
        status: 'delivered',
        readBy: userId,
      })

      const io = req.app?.get('io')
      if (io) {
        io.to(conversationId).emit('message:status_update', {
          conversationId,
          messageId,
          status: 'delivered',
          readBy: userId,
        })
      }
    }

    res.status(200).json({ success: true, message: 'Message marked as delivered' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
