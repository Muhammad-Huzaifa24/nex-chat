import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { uploadMediaToCloudinary } from '../services/cloudinaryService.js'

// @desc    Get or create 1-to-1 conversation
// @route   POST /api/conversations/direct
export const getOrCreateDirect = async (req, res) => {
  try {
    const { recipientId } = req.body
    const userId = req.user._id

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' })
    }

    // Check if direct conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userId, recipientId], $size: 2 },
    })
      .populate('participants', 'username displayName avatar bio isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'username displayName' },
      })

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        isGroup: false,
      })

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'username displayName avatar bio isOnline lastSeen'
      )
    } else {
      // Unhide if was hidden
      if (conversation.hiddenFor.includes(userId)) {
        conversation.hiddenFor = conversation.hiddenFor.filter((id) => id.toString() !== userId.toString())
        await conversation.save()
      }
    }

    res.status(200).json({ success: true, conversation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get all conversations for logged in user
// @route   GET /api/conversations
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id

    const conversations = await Conversation.find({
      participants: userId,
      hiddenFor: { $ne: userId },
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username displayName avatar bio isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'username displayName' },
      })
      .populate('groupAdmins', 'username displayName')

    res.status(200).json({ success: true, conversations })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create new group conversation
// @route   POST /api/conversations/group
export const createGroup = async (req, res) => {
  try {
    const { groupName, participants, groupDescription } = req.body
    const adminId = req.user._id

    if (!groupName || !participants) {
      return res.status(400).json({ success: false, message: 'Group name and participants are required' })
    }

    let parsedParticipants = typeof participants === 'string' ? JSON.parse(participants) : participants
    if (!parsedParticipants.includes(adminId.toString())) {
      parsedParticipants.push(adminId.toString())
    }

    let groupAvatar = ''
    if (req.file) {
      const { url } = await uploadMediaToCloudinary(req.file.buffer, 'image', 'nexchat/groups')
      groupAvatar = url
    }

    let conversation = await Conversation.create({
      isGroup: true,
      groupName: groupName.trim(),
      groupAvatar,
      groupDescription: groupDescription ? groupDescription.trim() : '',
      participants: parsedParticipants,
      groupAdmins: [adminId],
    })

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username displayName avatar bio isOnline lastSeen')
      .populate('groupAdmins', 'username displayName')

    res.status(201).json({ success: true, conversation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update group details (name, desc, avatar)
// @route   PUT /api/conversations/group/:id
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params
    const { groupName, groupDescription } = req.body
    const userId = req.user._id

    const conversation = await Conversation.findById(id)
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    // Check if user is participant
    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' })
    }

    if (groupName) conversation.groupName = groupName.trim()
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription.trim()

    if (req.file) {
      const { url } = await uploadMediaToCloudinary(req.file.buffer, 'image', 'nexchat/groups')
      conversation.groupAvatar = url
    }

    await conversation.save()

    const updated = await Conversation.findById(id)
      .populate('participants', 'username displayName avatar bio isOnline lastSeen')
      .populate('groupAdmins', 'username displayName')

    res.status(200).json({ success: true, conversation: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Add member to group
// @route   POST /api/conversations/group/:id/members
export const addGroupMember = async (req, res) => {
  try {
    const { id } = req.params
    const { memberId } = req.body
    const userId = req.user._id

    const conversation = await Conversation.findById(id)
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    // Only admin can add members
    const isAdmin = conversation.groupAdmins.some((a) => a.toString() === userId.toString())
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can add members' })
    }

    if (!conversation.participants.includes(memberId)) {
      conversation.participants.push(memberId)
      await conversation.save()
    }

    const updated = await Conversation.findById(id)
      .populate('participants', 'username displayName avatar bio isOnline lastSeen')
      .populate('groupAdmins', 'username displayName')

    res.status(200).json({ success: true, conversation: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Remove member from group
// @route   DELETE /api/conversations/group/:id/members/:userId
export const removeGroupMember = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params
    const requesterId = req.user._id

    const conversation = await Conversation.findById(id)
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    const isAdmin = conversation.groupAdmins.some((a) => a.toString() === requesterId.toString())
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can remove members' })
    }

    conversation.participants = conversation.participants.filter((p) => p.toString() !== targetUserId)
    conversation.groupAdmins = conversation.groupAdmins.filter((a) => a.toString() !== targetUserId)
    await conversation.save()

    const updated = await Conversation.findById(id)
      .populate('participants', 'username displayName avatar bio isOnline lastSeen')
      .populate('groupAdmins', 'username displayName')

    res.status(200).json({ success: true, conversation: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Leave group
// @route   POST /api/conversations/group/:id/leave
export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const conversation = await Conversation.findById(id)
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    conversation.participants = conversation.participants.filter((p) => p.toString() !== userId.toString())
    conversation.groupAdmins = conversation.groupAdmins.filter((a) => a.toString() !== userId.toString())

    // If no admins left and group still has members, appoint first member as admin
    if (conversation.groupAdmins.length === 0 && conversation.participants.length > 0) {
      conversation.groupAdmins.push(conversation.participants[0])
    }

    await conversation.save()
    res.status(200).json({ success: true, message: 'Left group successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Hide / Delete conversation for current user
// @route   DELETE /api/conversations/:id
export const hideConversation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    await Conversation.findByIdAndUpdate(id, {
      $addToSet: { hiddenFor: userId },
    })

    res.status(200).json({ success: true, message: 'Conversation hidden' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
