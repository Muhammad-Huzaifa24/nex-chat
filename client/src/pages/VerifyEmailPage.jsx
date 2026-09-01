import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { MessageSquare, Mail, RefreshCw, CheckCircle, Loader2 } from 'lucide-react'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

export const VerifyEmailPage = () => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  const { pendingEmail, verifyEmail, resendOtp } = useAuthStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Redirect away if no pending email
  useEffect(() => {
    if (!pendingEmail) {
      navigate('/register')
    }
  }, [pendingEmail, navigate])

  const handleOtpChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Auto-advance focus
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
    // Focus last filled or end
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LENGTH) {
      addToast('Please enter all 6 digits', 'error')
      return
    }
    setLoading(true)
    const result = await verifyEmail(pendingEmail, code)
    setLoading(false)

    if (result.success) {
      addToast(`Welcome to NexChat, ${result.user.displayName}! 🎉`, 'success')
      const redirectUrl = sessionStorage.getItem('nexchat_redirect')
      if (redirectUrl) {
        sessionStorage.removeItem('nexchat_redirect')
        navigate(redirectUrl)
      } else {
        navigate('/')
      }
    } else {
      addToast(result.message, 'error')
      // Clear and refocus on error
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setResending(true)
    const result = await resendOtp(pendingEmail)
    setResending(false)

    if (result.success) {
      addToast('New verification code sent!', 'success')
      setCanResend(false)
      setCountdown(RESEND_COOLDOWN)
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } else {
      addToast(result.message, 'error')
    }
  }

  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : ''

  const isComplete = otp.every((d) => d !== '')

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-app)',
        padding: '20px',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              marginBottom: '16px',
              boxShadow: '0 8px 16px rgba(0, 168, 132, 0.3)',
            }}
          >
            <MessageSquare size={30} />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Verify Your Email
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '8px' }}>
            Enter the 6-digit code sent to
          </p>
          {/* Email display */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 168, 132, 0.1)',
              border: '1px solid rgba(0, 168, 132, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '5px 12px',
              marginTop: '8px',
            }}
          >
            <Mail size={14} color="var(--primary-color)" />
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--primary-color)', fontWeight: 500 }}>
              {maskedEmail}
            </span>
          </div>
        </div>

        <form onSubmit={handleVerify}>
          {/* OTP Inputs */}
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
                  cursor: 'text',
                }}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || !isComplete}
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
              opacity: !isComplete ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <CheckCircle size={18} />
                Verify Account
              </>
            )}
          </button>
        </form>

        {/* Resend Section */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          {canResend ? (
            <button
              onClick={handleResend}
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
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '8px' }}>
            Code expires in 15 minutes
          </p>
        </div>
      </div>
    </div>
  )
}
