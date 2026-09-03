import emailjs from '@emailjs/nodejs'
import dotenv from 'dotenv'
import User from '../models/User.js'
import { getOfflineNotificationEmail } from '../templates/offlineNotification.js'
import { getVerificationEmail } from '../templates/verificationEmail.js'
import { getResetPasswordEmail } from '../templates/resetPasswordEmail.js'

dotenv.config()

/**
 * Returns the current configuration status of EmailJS credentials
 */
export const getEmailConfigStatus = () => {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY

  const missing = []
  if (!serviceId) missing.push('EMAILJS_SERVICE_ID')
  if (!templateId) missing.push('EMAILJS_TEMPLATE_ID')
  if (!publicKey) missing.push('EMAILJS_PUBLIC_KEY')
  if (!privateKey) missing.push('EMAILJS_PRIVATE_KEY')

  const isConfigured = missing.length === 0

  return {
    isConfigured,
    missing,
    details: {
      serviceId: serviceId ? `${serviceId.substring(0, 5)}***` : 'NOT_SET',
      templateId: templateId ? `${templateId.substring(0, 5)}***` : 'NOT_SET',
      publicKeyConfigured: Boolean(publicKey),
      privateKeyConfigured: Boolean(privateKey),
    },
  }
}

/**
 * Logs EmailJS initialization status on server boot / cold start
 */
export const verifyEmailConnection = async () => {
  const { isConfigured, missing, details } = getEmailConfigStatus()

  if (!isConfigured) {
    console.warn(
      `[Email / EmailJS Config WARNING] Missing credentials in environment variables: ${missing.join(', ')}. Email delivery is DISABLED.`
    )
    return false
  }

  console.log(
    `[Email / EmailJS Config OK] Ready for transactional emails. (Service: ${details.serviceId}, Template: ${details.templateId})`
  )
  return true
}

/**
 * Unified email dispatcher via EmailJS REST API with comprehensive Vercel logging
 * @param {object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.toName - Recipient display name
 * @param {string} params.subject - Email subject
 * @param {string} params.otpCode - (Optional) 6-digit OTP code
 * @param {string} params.htmlContent - Full HTML email body
 * @returns {Promise<{ success: boolean, status?: number, text?: string, error?: string }>}
 */
export const sendEmail = async ({ toEmail, toName, subject, otpCode, htmlContent }) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY

  const startTime = Date.now()
  console.log(`[EMAIL DISPATCH START] Target: ${toEmail} | Subject: "${subject}"`)

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    const { missing } = getEmailConfigStatus()
    const errorMsg = `EmailJS credentials incomplete in environment: ${missing.join(', ')}`
    console.error(`[EMAIL DISPATCH BLOCKED] ${errorMsg}`)
    return { success: false, error: errorMsg }
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

    const duration = Date.now() - startTime

    if (response.status === 200) {
      console.log(
        `[EMAIL DISPATCH SUCCESS] Status: 200 (${response.text || 'OK'}) in ${duration}ms | Target: ${toEmail}`
      )
      return { success: true, status: response.status, text: response.text }
    } else {
      console.error(
        `[EMAIL DISPATCH UNEXPECTED STATUS] Status: ${response.status} (${response.text}) in ${duration}ms | Target: ${toEmail}`
      )
      return { success: false, status: response.status, text: response.text }
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorText = error?.text || error?.message || String(error)
    const errorStatus = error?.status || 500

    console.error(
      `[EMAIL DISPATCH FAILED] Status: ${errorStatus} in ${duration}ms | Target: ${toEmail} | Error:`,
      errorText
    )

    return {
      success: false,
      status: errorStatus,
      error: errorText,
    }
  }
}

/**
 * Send a 6-digit OTP email for email verification
 * @param {string} toEmail - Recipient email
 * @param {string} displayName - Recipient's display name
 * @param {string} otp - 6-digit OTP code
 * @param {string} subject - Email subject line
 * @returns {Promise<{ success: boolean, status?: number, text?: string, error?: string }>}
 */
export const sendVerificationOtp = async (toEmail, displayName, otp, subject = 'Verify your NexChat account') => {
  try {
    const htmlContent = getVerificationEmail({ displayName, otp })
    const result = await sendEmail({
      toEmail,
      toName: displayName,
      subject,
      otpCode: otp,
      htmlContent,
    })
    return result
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Verification OTP:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send a 6-digit OTP email for password reset
 * @param {string} toEmail - Recipient email
 * @param {string} displayName - Recipient's display name
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{ success: boolean, status?: number, text?: string, error?: string }>}
 */
export const sendResetPasswordOtp = async (toEmail, displayName, otp) => {
  try {
    const htmlContent = getResetPasswordEmail({ displayName, otp })
    const result = await sendEmail({
      toEmail,
      toName: displayName,
      subject: 'Reset your NexChat password',
      otpCode: otp,
      htmlContent,
    })
    return result
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Reset OTP:`, error.message)
    return { success: false, error: error.message }
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

    const result = await sendEmail({
      toEmail: recipient.email,
      toName: recipient.displayName || recipient.username,
      subject,
      htmlContent,
    })

    if (result.success) {
      await User.findByIdAndUpdate(recipient._id, { lastNotifiedAt: new Date() })
      console.log(`[Email Service] Notification email sent to ${recipient.email}`)
    }
  } catch (error) {
    console.error(`[Email Service Error] Failed to send offline notification:`, error.message)
  }
}
