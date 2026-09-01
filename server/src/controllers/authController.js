import User from '../models/User.js'
import { generateToken } from '../utils/jwt.js'
import { sendVerificationOtp, sendResetPasswordOtp } from '../services/emailService.js'

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

// @desc    Register a new user — sends OTP, does NOT log them in yet
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
      // If previously registered but unverified — allow re-registration by updating OTP
      if (!existingUser.isVerified) {
        const otp = generateOtp()
        existingUser.otp = otp
        existingUser.otpExpires = new Date(Date.now() + 15 * 60 * 1000)
        await existingUser.save()
        await sendVerificationOtp(existingUser.email, existingUser.displayName, otp)
        return res.status(200).json({
          success: true,
          message: 'OTP resent to your email. Please verify your account.',
          email: existingUser.email,
          requiresVerification: true,
        })
      }
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username'
      return res.status(409).json({
        success: false,
        message: `${field} is already taken`,
      })
    }

    const otp = generateOtp()
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000)

    const user = await User.create({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      displayName: displayName.trim(),
      isVerified: false,
      otp,
      otpExpires,
    })

    // Send OTP email in background so user response is instant (<100ms)
    sendVerificationOtp(user.email, user.displayName, otp).catch((err) =>
      console.error('[Email Error]', err?.message)
    )

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for the verification code.',
      email: user.email,
      requiresVerification: true,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' })
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified. Please log in.' })
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' })
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' })
    }

    if (user.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please try again.' })
    }

    // Mark as verified and clear OTP
    user.isVerified = true
    user.otp = null
    user.otpExpires = null
    user.isOnline = true
    await user.save()

    const token = generateToken(user._id)
    res.cookie('token', token, cookieOptions)

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to NexChat.',
      user,
      token,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' })
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified' })
    }

    // 60-second rate limit — prevent spam resends
    if (user.otpExpires && new Date() < new Date(user.otpExpires.getTime() - 14 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting a new code',
      })
    }

    const otp = generateOtp()
    user.otp = otp
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()

    // Send OTP email in background
    sendVerificationOtp(user.email, user.displayName, otp).catch((err) =>
      console.error('[Email Error]', err?.message)
    )

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email.',
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
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Block login if email not yet verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        email: user.email,
        requiresVerification: true,
      })
    }

    // Update status
    user.isOnline = true
    await user.save()

    // Realtime presence broadcast
    import('../config/pusher.js').then(({ triggerPusherEvent }) => {
      triggerPusherEvent(['global-presence', `user-${user._id}`], 'user:status', {
        userId: user._id,
        isOnline: true,
        lastSeen: new Date(),
      })
    })

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
      const now = new Date()
      await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: now })

      import('../config/pusher.js').then(({ triggerPusherEvent }) => {
        triggerPusherEvent(['global-presence', `user-${req.user._id}`], 'user:status', {
          userId: req.user._id,
          isOnline: false,
          lastSeen: now,
        })
      })
    }
    res.clearCookie('token', cookieOptions)
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

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { emailOrUsername } = req.body

    if (!emailOrUsername) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email or username',
      })
    }

    const searchStr = emailOrUsername.toLowerCase().trim()
    const user = await User.findOne({
      $or: [{ email: searchStr }, { username: searchStr }],
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email or username',
      })
    }

    // 60-second cooldown to prevent spamming
    if (
      user.resetPasswordOtpExpires &&
      new Date() < new Date(user.resetPasswordOtpExpires.getTime() - 14 * 60 * 1000)
    ) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another code',
      })
    }

    const otp = generateOtp()
    user.resetPasswordOtp = otp
    user.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()

    // Dispatch Reset OTP email in background for instant HTTP response (<100ms)
    sendResetPasswordOtp(user.email, user.displayName, otp).catch((err) =>
      console.error('[Email Error]', err?.message)
    )

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email.',
      email: user.email,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Verify password reset OTP
// @route   POST /api/auth/verify-reset-otp
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      })
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No reset request found. Please request a new code.',
      })
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.',
      })
    }

    if (user.resetPasswordOtp !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Code verified successfully',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, verification code, and new password',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      })
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No reset request found. Please request a new code.',
      })
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.',
      })
    }

    if (user.resetPasswordOtp !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.',
      })
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword
    user.resetPasswordOtp = null
    user.resetPasswordOtpExpires = null
    // If user was not verified, resetting password via email confirms email ownership
    user.isVerified = true
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

