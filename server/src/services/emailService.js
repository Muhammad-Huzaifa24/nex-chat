import emailjs from '@emailjs/nodejs'
import dotenv from 'dotenv'
import User from '../models/User.js'
import { getOfflineNotificationEmail } from '../templates/offlineNotification.js'
import { getVerificationEmail } from '../templates/verificationEmail.js'
import { getResetPasswordEmail } from '../templates/resetPasswordEmail.js'

dotenv.config()

/**
 * Logs EmailJS initialization status on server boot
 */
export const verifyEmailConnection = async () => {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.warn('[Email / EmailJS] Warning: EmailJS credentials not fully set in .env (email notifications disabled)')
    return false
  }

  console.log('[Email / EmailJS] Ready — configured for transactional emails via EmailJS')
  return true
}

/**
 * Unified email dispatcher via EmailJS REST API
 * @param {object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.toName - Recipient display name
 * @param {string} params.subject - Email subject
 * @param {string} params.otpCode - (Optional) 6-digit OTP code
 * @param {string} params.htmlContent - Full HTML email body
 * @returns {Promise<boolean>}
 */
const sendEmail = async ({ toEmail, toName, subject, otpCode, htmlContent }) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.warn('[Email / EmailJS] Skipping email — EmailJS credentials not fully configured in .env')
    return false
  }

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: toEmail,
        to_name: toName || 'there',
        subject,
        otp_code: otpCode || '',
        html_content: htmlContent,
      },
      {
        publicKey,
        privateKey,
      }
    )

    if (response.status === 200) {
      return true
    } else {
      console.error('[Email / EmailJS Error] Unexpected status:', response.status, response.text)
      return false
    }
  } catch (error) {
    console.error('[Email / EmailJS Error] Send failed:', error?.message || error)
    return false
  }
}

/**
 * Send a 6-digit OTP email for email verification
 * @param {string} toEmail - Recipient email
 * @param {string} displayName - Recipient's display name
 * @param {string} otp - 6-digit OTP code
 * @param {string} subject - Email subject line
 * @returns {Promise<boolean>}
 */
export const sendVerificationOtp = async (toEmail, displayName, otp, subject = 'Verify your NexChat account') => {
  try {
    const htmlContent = getVerificationEmail({ displayName, otp })
    const sent = await sendEmail({
      toEmail,
      toName: displayName,
      subject,
      otpCode: otp,
      htmlContent,
    })
    if (sent) console.log(`[Email Service] Verification OTP email sent to ${toEmail}`)
    return sent
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Verification OTP:`, error.message)
    return false
  }
}

/**
 * Send a 6-digit OTP email for password reset
 * @param {string} toEmail - Recipient email
 * @param {string} displayName - Recipient's display name
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>}
 */
export const sendResetPasswordOtp = async (toEmail, displayName, otp) => {
  try {
    const htmlContent = getResetPasswordEmail({ displayName, otp })
    const sent = await sendEmail({
      toEmail,
      toName: displayName,
      subject: 'Reset your NexChat password',
      otpCode: otp,
      htmlContent,
    })
    if (sent) console.log(`[Email Service] Password Reset OTP email sent to ${toEmail}`)
    return sent
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Reset OTP:`, error.message)
    return false
  }
}

/**
 * Send an offline message notification email if recipient is offline and cooldown has passed
 * @param {object} recipient - User model instance or object
 * @param {object} sender - User model instance or object
 * @param {object} message - Message instance
 * @param {object} conversation - Conversation instance
 */
export const sendOfflineNotification = async (recipient, sender, message, conversation) => {
  try {
    if (!recipient || !recipient.email) return

    // Cooldown check (30 minutes)
    const COOLDOWN_MS = 30 * 60 * 1000
    if (recipient.lastNotifiedAt) {
      const timeSinceLastNotification = Date.now() - new Date(recipient.lastNotifiedAt).getTime()
      if (timeSinceLastNotification < COOLDOWN_MS) {
        console.log(`[Email Service] Skipping notification for ${recipient.email}: within 30-min cooldown`)
        return
      }
    }

    const appUrl = process.env.CLIENT_URL || 'https://nex-chat-wjpg.vercel.app'
    const isGroup = conversation?.isGroup || false
    const chatName = isGroup ? conversation.groupName : sender.displayName || sender.username

    const htmlContent = getOfflineNotificationEmail({
      recipientName: recipient.displayName || recipient.username,
      senderName: sender.displayName || sender.username,
      messageContent: message.content,
      messageType: message.type || 'text',
      appUrl,
      chatName,
      isGroup,
    })

    const subject = isGroup
      ? `💬 New message in ${chatName} from ${sender.displayName || sender.username}`
      : `💬 New message from ${sender.displayName || sender.username}`

    const sent = await sendEmail({
      toEmail: recipient.email,
      toName: recipient.displayName || recipient.username,
      subject,
      htmlContent,
    })

    if (sent) {
      await User.findByIdAndUpdate(recipient._id, { lastNotifiedAt: new Date() })
      console.log(`[Email Service] Notification email sent to ${recipient.email}`)
    }
  } catch (error) {
    console.error(`[Email Service Error] Failed to send offline notification:`, error.message)
  }
}
