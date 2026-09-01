import express from 'express'
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify-email', verifyEmail)
router.post('/resend-otp', resendOtp)
router.post('/forgot-password', forgotPassword)
router.post('/verify-reset-otp', verifyResetOtp)
router.post('/reset-password', resetPassword)
router.post('/login', login)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)

export default router

