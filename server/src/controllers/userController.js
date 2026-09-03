import User from '../models/User.js'
import { uploadMediaToCloudinary } from '../services/cloudinaryService.js'

// @desc    Search users by name or username
// @route   GET /api/users/search?q=
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.trim().length === 0) {
      return res.status(200).json({ success: true, users: [] })
    }

    const regex = new RegExp(q.trim(), 'i')
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: regex }, { displayName: regex }, { email: regex }],
    })
      .select('username displayName avatar bio isOnline lastSeen')
      .limit(20)

    res.status(200).json({ success: true, users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get user profile by ID
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update current user profile
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { displayName, bio, phone } = req.body
    const updateData = {}

    if (displayName) updateData.displayName = displayName.trim()
    if (bio !== undefined) updateData.bio = bio.trim()
    if (phone !== undefined) updateData.phone = phone.trim()

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password')
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Upload profile avatar
// @route   PUT /api/users/avatar
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const { url } = await uploadMediaToCloudinary(req.file.buffer, 'image', 'nexchat/avatars')
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: url }, { new: true }).select('-password')

    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete / remove profile avatar
// @route   DELETE /api/users/avatar
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: '' }, { new: true }).select('-password')
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Heartbeat to keep user presence alive
// @route   POST /api/users/heartbeat
export const heartbeat = async (req, res) => {
  try {
    const userId = req.user._id
    const now = new Date()

    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline: true, lastSeen: now },
      { new: true }
    ).select('isOnline lastSeen')

    // Broadcast status to global-presence and personal user channel
    import('../config/pusher.js').then(({ triggerPusherEvent }) => {
      triggerPusherEvent(['global-presence', `user-${userId}`], 'user:status', {
        userId,
        isOnline: true,
        lastSeen: now,
      })
    })

    res.status(200).json({ success: true, isOnline: true, lastSeen: now })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Mark user as offline (Beacon / tab disconnect)
// @route   POST /api/users/offline
export const setOffline = async (req, res) => {
  try {
    const userId = req.user._id
    const now = new Date()

    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: now })

    // Broadcast status to global-presence and personal user channel
    import('../config/pusher.js').then(({ triggerPusherEvent }) => {
      triggerPusherEvent(['global-presence', `user-${userId}`], 'user:status', {
        userId,
        isOnline: false,
        lastSeen: now,
      })
    })

    res.status(200).json({ success: true, isOnline: false, lastSeen: now })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get public user profile by username (no auth required)
// @route   GET /api/users/profile/:username
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' })
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select(
      'username displayName avatar bio isOnline lastSeen'
    )

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

