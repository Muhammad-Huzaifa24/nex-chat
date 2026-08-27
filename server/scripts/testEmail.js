import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { getOfflineNotificationEmail } from '../src/templates/offlineNotification.js'

dotenv.config()

async function testEmail() {
  console.log('\n--- NexChat Nodemailer Diagnostic Test ---\n')

  const emailUser = process.env.EMAIL_USER?.trim()
  const emailPass = process.env.EMAIL_PASS?.trim()

  if (!emailUser || !emailPass) {
    console.error('❌ Missing EMAIL_USER or EMAIL_PASS in .env')
    console.log('Please set EMAIL_USER and EMAIL_PASS (Gmail App Password) in server/.env')
    process.exit(1)
  }

  console.log(`Configuring transporter for user: ${emailUser}...`)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })

  try {
    console.log('Verifying SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP connection verified successfully!')

    const html = getOfflineNotificationEmail({
      recipientName: 'Test Recipient',
      senderName: 'NexChat System',
      messageContent: 'This is a test notification to verify your email setup is working perfectly!',
      messageType: 'text',
      appUrl: process.env.CLIENT_URL || 'https://nex-chat-wjpg.vercel.app',
      isGroup: false,
    })

    console.log(`Sending test email to ${emailUser}...`)
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"NexChat" <${emailUser}>`,
      to: emailUser,
      subject: '💬 [Test] NexChat Offline Notification Test',
      html,
    })

    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`)
    console.log('\n--- Test Completed Successfully ---\n')
  } catch (error) {
    console.error('❌ Email Test Failed:', error.message)
    process.exit(1)
  }
}

testEmail()
