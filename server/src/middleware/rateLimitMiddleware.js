import rateLimit from 'express-rate-limit'

// Global API rate limiter — prevents DoS flooding
export const apiGlobalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in 15 minutes.',
  },
})

// Login limiter — prevents brute force password guessing
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 failed login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failures
  message: {
    success: false,
    message: 'Too many failed login attempts from this IP. Please wait 15 minutes before trying again.',
  },
})

// Register limiter — prevents automated bot account creation
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 account creations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Account creation limit reached for this IP. Please try again later.',
  },
})

// OTP Request Limiter — prevents email spam and SMTP quota exhaustion
export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 OTP requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please wait 15 minutes before requesting again.',
  },
})

// OTP Verify Limiter — prevents OTP brute force
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 verification attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please wait 15 minutes before trying again.',
  },
})
