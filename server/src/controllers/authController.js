import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import PendingUser from '../models/PendingUser.js'
import { generateToken } from '../utils/jwt.js'
import { sendVerificationOtp, sendResetPasswordOtp, getEmailConfigStatus } from '../services/emailService.js'

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

// @desc    Initiate registration — sends OTP, does NOT save to User collection yet
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

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedUsername = username.toLowerCase().trim()

    // Check if email or username is already taken in the real User collection
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    })

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'Email' : 'Username'
      return res.status(409).json({
        success: false,
        message: `${field} is already taken`,
      })
    }

    // Hash password before staging
    const hashedPassword = await bcrypt.hash(password, 10)
    const otp = generateOtp()
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000)

    // Upsert into PendingUser staging collection (safe if they re-submit registration)
    await PendingUser.findOneAndUpdate(
      { $or: [{ email: normalizedEmail }, { username: normalizedUsername }] },
      {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        displayName: displayName.trim(),
        otp,
        otpExpires,
        otpAttempts: 0,
        createdAt: new Date(), // Reset TTL timer on re-submit
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // Await OTP email dispatch so serverless execution context does not freeze prematurely
    console.log(`[VERCEL LOG / REGISTRATION OTP] Generated code for ${normalizedEmail}: ${otp}`)
    const emailResult = await sendVerificationOtp(normalizedEmail, displayName.trim(), otp)

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email. Please check your inbox.',
      email: normalizedEmail,
      requiresVerification: true,
      emailSent: emailResult?.success ?? false,
    })
  } catch (error) {
    console.error('[REGISTRATION ERROR]', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Verify email OTP and create the real User account
// @route   POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const pending = await PendingUser.findOne({ email: normalizedEmail })

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'Verification session not found or expired. Please register again.',
      })
    }

    if (!pending.otp || !pending.otpExpires) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' })
    }

    if (new Date() > pending.otpExpires) {
      await PendingUser.deleteOne({ email: normalizedEmail })
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please register again.',
      })
    }

    // OTP Brute-force protection: Max 5 attempts
    if (pending.otp !== String(otp).trim()) {
      pending.otpAttempts = (pending.otpAttempts || 0) + 1

      if (pending.otpAttempts >= 5) {
        await PendingUser.deleteOne({ email: normalizedEmail })
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. Your session has been invalidated. Please register again.',
        })
      }

      await pending.save()
      const remaining = 5 - pending.otpAttempts
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      })
    }

    // OTP is correct — create the real verified user account now
    const user = await User.create({
      username: pending.username,
      email: pending.email,
      password: pending.password,  // already bcrypt-hashed
      displayName: pending.displayName,
      isVerified: true,
      isOnline: true,
    })

    // Clean up pending registration
    await PendingUser.deleteOne({ email: normalizedEmail })

    const token = generateToken(user._id)
    res.cookie('token', token, cookieOptions)

    res.status(201).json({
      success: true,
      message: 'Email verified successfully! Welcome to NexChat.',
      user,
      token,
    })
  } catch (error) {
    // Handle unique constraint race condition (very unlikely but safe)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or username was just created. Please try logging in.',
      })
    }
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

    const normalizedEmail = email.toLowerCase().trim()

    const pending = await PendingUser.findOne({ email: normalizedEmail })

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'No pending registration found for this email. Please register again.',
      })
    }

    // 60-second rate limit — prevent spam resends
    if (pending.otpExpires && new Date() < new Date(pending.otpExpires.getTime() - 14 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting a new code',
      })
    }

    const otp = generateOtp()
    pending.otp = otp
    pending.otpExpires = new Date(Date.now() + 15 * 60 * 1000)
    pending.otpAttempts = 0
    await pending.save()

    // Await OTP email dispatch so serverless execution context does not freeze prematurely
    console.log(`[VERCEL LOG / RESEND OTP] Generated code for ${pending.email}: ${otp}`)
    const emailResult = await sendVerificationOtp(pending.email, pending.displayName, otp)

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email.',
      emailSent: emailResult?.success ?? false,
    })
  } catch (error) {
    console.error('[RESEND OTP ERROR]', error)
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

    // All accounts in User collection are already verified, but guard just in case
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

// @desc    Request password reset OTP (Fixed user enumeration)
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

    // Protection against User Enumeration: If user not found, return generic success message
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email or username, a verification code has been sent.',
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
    user.resetPasswordOtpAttempts = 0
    await user.save()

    // Await Reset OTP email dispatch so serverless execution context does not freeze prematurely
    console.log(`[VERCEL LOG / FORGOT PASSWORD OTP] Generated code for ${user.email}: ${otp}`)
    const emailResult = await sendResetPasswordOtp(user.email, user.displayName, otp)

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email or username, a verification code has been sent.',
      email: user.email,
      emailSent: emailResult?.success ?? false,
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

    // OTP Brute-force protection: Max 5 attempts
    if (user.resetPasswordOtp !== String(otp).trim()) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1

      if (user.resetPasswordOtpAttempts >= 5) {
        user.resetPasswordOtp = null
        user.resetPasswordOtpExpires = null
        user.resetPasswordOtpAttempts = 0
        await user.save()
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. This code has been invalidated. Please request a new code.',
        })
      }

      await user.save()
      const remaining = 5 - user.resetPasswordOtpAttempts
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
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

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
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
    user.resetPasswordOtpAttempts = 0
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

// @desc    Dedicated route to request/send email verification OTP
// @route   POST /api/auth/send-verification-otp
export const sendVerificationOtpRoute = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const pending = await PendingUser.findOne({ email: normalizedEmail })

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'No pending registration found for this email. Please register again.',
      })
    }

    // Cooldown check (60 seconds)
    if (pending.otpExpires && new Date() < new Date(pending.otpExpires.getTime() - 14 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another code',
      })
    }

    const otp = generateOtp()
    pending.otp = otp
    pending.otpExpires = new Date(Date.now() + 15 * 60 * 1000)
    pending.otpAttempts = 0
    await pending.save()

    console.log(`[DEDICATED OTP ROUTE] Dispatching OTP for: ${normalizedEmail}`)
    console.log(`[VERCEL LOG / OTP CODE] Code for ${normalizedEmail}: ${otp}`)

    const emailResult = await sendVerificationOtp(pending.email, pending.displayName, otp)

    return res.status(200).json({
      success: true,
      message: emailResult.success
        ? 'Verification code sent to your email successfully.'
        : 'Generated verification code, but email dispatch encountered an issue. Check server logs.',
      email: normalizedEmail,
      emailSent: emailResult.success,
      emailDetails: {
        status: emailResult.status,
        text: emailResult.text || emailResult.error,
      },
    })
  } catch (error) {
    console.error('[DEDICATED OTP ROUTE ERROR]', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Diagnostic test route to check EmailJS configuration and optionally test email sending
// @route   GET/POST /api/auth/test-email
export const testEmail = async (req, res) => {
  try {
    const toEmail = (req.method === 'POST' ? req.body.to : req.query.to)?.trim()
    const configStatus = getEmailConfigStatus()

    console.log('[TEST EMAIL DIAGNOSTIC REQUEST]', {
      method: req.method,
      targetEmail: toEmail || 'NONE (config-only)',
      configStatus,
    })

    if (!toEmail) {
      return res.status(200).json({
        success: true,
        message: 'Email configuration status retrieved. Provide ?to=your@email.com or POST { "to": "..." } to send a test email.',
        config: configStatus,
      })
    }

    const testOtp = generateOtp()
    console.log(`[TEST EMAIL DISPATCH] Testing delivery to ${toEmail} with test OTP ${testOtp}`)

    const emailResult = await sendVerificationOtp(
      toEmail,
      'NexChat Tester',
      testOtp,
      'NexChat Test Email Delivery'
    )

    console.log('[TEST EMAIL DISPATCH RESULT]', emailResult)

    return res.status(emailResult.success ? 200 : 502).json({
      success: emailResult.success,
      message: emailResult.success
        ? `Test email sent successfully to ${toEmail}`
        : `Test email failed to send: ${emailResult.error || emailResult.text}`,
      config: configStatus,
      emailjsResponse: emailResult,
      testOtpCode: testOtp,
    })
  } catch (error) {
    console.error('[TEST EMAIL ERROR]', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
