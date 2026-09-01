import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import {
  KeyRound,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

export const ForgotPasswordPage = () => {
  // Steps: 'email' | 'otp' | 'reset'
  const [step, setStep] = useState('email')
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [resolvedEmail, setResolvedEmail] = useState('')
  
  // OTP state
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef([])

  // Password reset state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)

  const { forgotPassword, verifyResetOtp, resetPassword } = useAuthStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()

  // Countdown timer for OTP resend in step 2
  useEffect(() => {
    if (step !== 'otp') return
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, step])

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!emailOrUsername.trim()) {
      addToast('Please enter your email or username', 'error')
      return
    }

    setLoading(true)
    const res = await forgotPassword(emailOrUsername.trim())
    setLoading(false)

    if (res.success) {
      setResolvedEmail(res.email || emailOrUsername.trim())
      setStep('otp')
      setCountdown(RESEND_COOLDOWN)
      setCanResend(false)
      addToast('Password reset code sent to your email', 'success')
    } else {
      addToast(res.message, 'error')
    }
  }

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const newOtp = [...otp]
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char
    })
    setOtp(newOtp)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LENGTH) {
      addToast('Please enter all 6 digits', 'error')
      return
    }

    setLoading(true)
    const res = await verifyResetOtp(resolvedEmail, code)
    setLoading(false)

    if (res.success) {
      addToast('Verification successful! Set your new password.', 'success')
      setStep('reset')
    } else {
      addToast(res.message, 'error')
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    }
  }

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return
    setResending(true)
    const res = await forgotPassword(resolvedEmail)
    setResending(false)

    if (res.success) {
      addToast('New verification code sent!', 'success')
      setCanResend(false)
      setCountdown(RESEND_COOLDOWN)
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } else {
      addToast(res.message, 'error')
    }
  }

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      addToast('Please fill in both password fields', 'error')
      return
    }

    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error')
      return
    }

    setLoading(true)
    const code = otp.join('')
    const res = await resetPassword(resolvedEmail, code, newPassword)
    setLoading(false)

    if (res.success) {
      addToast('Password reset successfully! Please log in.', 'success')
      navigate('/login')
    } else {
      addToast(res.message, 'error')
    }
  }

  const maskedEmail = resolvedEmail
    ? resolvedEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c)
    : ''

  const isOtpComplete = otp.every((d) => d !== '')

  return (
    <div className="auth-page-container">
      <div className="auth-card animate-slide-up" style={{ maxWidth: '440px' }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: step === 'reset' ? '#10b981' : 'var(--primary-color)',
              color: 'white',
              marginBottom: '16px',
              boxShadow:
                step === 'reset'
                  ? '0 8px 16px rgba(16, 185, 129, 0.3)'
                  : '0 8px 16px rgba(0, 168, 132, 0.3)',
              transition: 'background-color 0.3s ease',
            }}
          >
            {step === 'email' && <KeyRound size={28} />}
            {step === 'otp' && <Mail size={28} />}
            {step === 'reset' && <CheckCircle2 size={32} />}
          </div>

          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Enter Verification Code'}
            {step === 'reset' && 'Create New Password'}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '8px', marginBottom: 0 }}>
            {step === 'email' && 'Enter your email or username and we will send you a 6-digit OTP code to reset your password.'}
            {step === 'otp' && 'Enter the 6-digit verification code sent to:'}
            {step === 'reset' && 'Your email has been verified! Please choose a strong new password.'}
          </p>

          {step !== 'email' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: step === 'reset' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 168, 132, 0.1)',
                border:
                  step === 'reset'
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid rgba(0, 168, 132, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '5px 12px',
                marginTop: '10px',
              }}
            >
              {step === 'reset' ? (
                <ShieldCheck size={15} color="#10b981" />
              ) : (
                <Mail size={14} color="var(--primary-color)" />
              )}
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: step === 'reset' ? '#10b981' : 'var(--primary-color)',
                  fontWeight: 600,
                }}
              >
                {step === 'reset' ? `Verified: ${maskedEmail}` : maskedEmail}
              </span>
            </div>
          )}
        </div>

        {/* STEP 1: Enter Email / Username */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Email or Username
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <User size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Enter your email or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !emailOrUsername.trim()}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading || !emailOrUsername.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-digit OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                marginBottom: '28px',
              }}
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  autoFocus={index === 0}
                  style={{
                    width: '48px',
                    height: '56px',
                    textAlign: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                    fontFamily: "'Courier New', monospace",
                    borderRadius: 'var(--radius-md)',
                    border: digit
                      ? '2px solid var(--primary-color)'
                      : '2px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: digit ? '0 0 0 3px rgba(0, 168, 132, 0.15)' : 'none',
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !isOtpComplete}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: !isOtpComplete ? 0.6 : 1,
              }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} />
                  Verify Code
                </>
              )}
            </button>

            {/* Resend OTP Section */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {resending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Resend Code
                </button>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                  Resend code in{' '}
                  <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{countdown}s</span>
                </p>
              )}
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setOtp(Array(OTP_LENGTH).fill(''))
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Use a different email or username
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* New Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                New Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Lock size={18} color="var(--text-muted)" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Confirm New Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Lock size={18} color="var(--text-muted)" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#10b981',
                borderColor: '#10b981',
              }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} />
                  Reset Password & Log In
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            to="/login"
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
