import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import User from '../models/User.js'
import { getOfflineNotificationEmail } from '../templates/offlineNotification.js'

dotenv.config()

let transporter = null

const getTransporter = () => {
  if (transporter) return transporter

  const emailUser = process.env.EMAIL_USER?.trim()
  const emailPass = process.env.EMAIL_PASS?.trim()

  if (!emailUser || !emailPass) {
    return null
  }

  // If host/port are provided use them, otherwise default to Gmail
  if (process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST.trim(),
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  } else {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  }

  return transporter
}

/**
 * Verifies the Nodemailer connection on server boot and logs status
 */
export const verifyEmailConnection = async () => {
  const emailUser = process.env.EMAIL_USER?.trim()
  const emailPass = process.env.EMAIL_PASS?.trim()

  if (!emailUser || !emailPass) {
    console.warn('[Email / Nodemailer] Warning: EMAIL_USER or EMAIL_PASS not set in .env (offline email notifications disabled)')
    return false
  }

  try {
    const transport = getTransporter()
    if (!transport) return false

    await transport.verify()
    console.log(`[Email / Nodemailer] Connected: ${emailUser} (SMTP Ready)`)
    return true
  } catch (error) {
    console.error(`[Email / Nodemailer Error] Verification failed: ${error.message}`)
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
    const transport = getTransporter()
    if (!transport) {
      // Graceful no-op if email credentials are not configured
      return
    }

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
    const fromAddress = process.env.EMAIL_FROM || `"NexChat" <${process.env.EMAIL_USER}>`

    const isGroup = conversation?.isGroup || false
    const chatName = isGroup ? conversation.groupName : sender.displayName || sender.username

    const html = getOfflineNotificationEmail({
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

    await transport.sendMail({
      from: fromAddress,
      to: recipient.email,
      subject,
      html,
    })

    // Update recipient lastNotifiedAt timestamp
    await User.findByIdAndUpdate(recipient._id, { lastNotifiedAt: new Date() })
    console.log(`[Email Service] Notification email sent to ${recipient.email}`)
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email:`, error.message)
  }
}
