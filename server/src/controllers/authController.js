import User from '../models/User.js'
import { generateToken } from '../utils/jwt.js'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, password, and display name',
      })
    }

    // Check if user or email already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    })

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username'
      return res.status(409).json({
        success: false,
        message: `${field} is already taken`,
      })
    }

    const user = await User.create({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      displayName: displayName.trim(),
    })

    const token = generateToken(user._id)
    res.cookie('token', token, cookieOptions)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user,
      token,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      })
    }

    const searchStr = emailOrUsername.toLowerCase().trim()
    const user = await User.findOne({
      $or: [{ email: searchStr }, { username: searchStr }],
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    // Update status
    user.isOnline = true
    await user.save()

    const token = generateToken(user._id)
    res.cookie('token', token, cookieOptions)

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user,
      token,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastSeen: new Date(),
      })
    }
    res.clearCookie('token')
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
