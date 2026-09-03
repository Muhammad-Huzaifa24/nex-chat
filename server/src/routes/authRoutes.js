import express from 'express'
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendOtp,
  sendVerificationOtpRoute,
  testEmail,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import {
  authLoginLimiter,
  registerLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
} from '../middleware/rateLimitMiddleware.js'

const router = express.Router()

router.post('/register', registerLimiter, register)
router.post('/verify-email', otpVerifyLimiter, verifyEmail)
router.post('/resend-otp', otpRequestLimiter, resendOtp)
router.post('/send-verification-otp', otpRequestLimiter, sendVerificationOtpRoute)
router.get('/test-email', testEmail)
router.post('/test-email', testEmail)

router.post('/forgot-password', otpRequestLimiter, forgotPassword)
router.post('/verify-reset-otp', otpVerifyLimiter, verifyResetOtp)
router.post('/reset-password', authLoginLimiter, resetPassword)
router.post('/login', authLoginLimiter, login)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)

export default router
