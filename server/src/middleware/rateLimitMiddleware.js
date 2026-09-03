import rateLimit from 'express-rate-limit'

// Common config for reverse-proxy / serverless environments (Vercel)
const commonLimitOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false, // Prevents ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on reverse proxies
    default: true,
  },
}

// Global API rate limiter — prevents DoS flooding
export const apiGlobalLimiter = rateLimit({
  ...commonLimitOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per IP per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in 15 minutes.',
  },
})

// Login limiter — prevents brute force password guessing
export const authLoginLimiter = rateLimit({
  ...commonLimitOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 failed login attempts per window
  skipSuccessfulRequests: true, // Only count failures
  message: {
    success: false,
    message: 'Too many failed login attempts from this IP. Please wait 15 minutes before trying again.',
  },
})

// Register limiter — prevents automated bot account creation
export const registerLimiter = rateLimit({
  ...commonLimitOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 account creations per hour per IP
  message: {
    success: false,
    message: 'Account creation limit reached for this IP. Please try again later.',
  },
})

// OTP Request Limiter — prevents email spam and SMTP quota exhaustion
export const otpRequestLimiter = rateLimit({
  ...commonLimitOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 OTP requests per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please wait 15 minutes before requesting again.',
  },
})

// OTP Verify Limiter — prevents OTP brute force
export const otpVerifyLimiter = rateLimit({
  ...commonLimitOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 verification attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please wait 15 minutes before trying again.',
  },
})
