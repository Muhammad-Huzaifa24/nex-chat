/**
 * Clean, modern, minimalist HTML email template for offline user notifications
 * @param {object} params
 * @param {string} params.recipientName - Display name or username of receiver
 * @param {string} params.senderName - Display name or username of sender
 * @param {string} params.messageContent - Message text or attachment description
 * @param {string} params.messageType - 'text' | 'image' | 'video' | 'audio' | 'file'
 * @param {string} params.appUrl - Frontend URL to redirect the user
 * @param {string} params.chatName - Group name or DM conversation title
 * @param {boolean} params.isGroup - Whether it's a group chat
 * @returns {string} HTML email string
 */
export const getOfflineNotificationEmail = ({
  recipientName,
  senderName,
  messageContent,
  messageType = 'text',
  appUrl = 'https://nex-chat-wjpg.vercel.app',
  chatName = '',
  isGroup = false,
}) => {
  let previewText = messageContent

  if (messageType === 'image') {
    previewText = `📷 Photo ${messageContent ? `— ${messageContent}` : ''}`
  } else if (messageType === 'video') {
    previewText = `🎬 Video ${messageContent ? `— ${messageContent}` : ''}`
  } else if (messageType === 'audio') {
    previewText = `🎵 Voice Note`
  } else if (messageType === 'file') {
    previewText = `📄 Document Attachment`
  }

  if (previewText && previewText.length > 180) {
    previewText = previewText.substring(0, 180) + '...'
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message on NexChat</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; text-align: left; border-bottom: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0" style="margin: 0;">
                <tr>
                  <td style="background-color: #00a884; border-radius: 8px; width: 34px; height: 34px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 18px; line-height: 34px;">💬</span>
                  </td>
                  <td style="padding-left: 10px; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">
                    NexChat
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.5;">
                Hi <strong style="color: #0f172a;">${recipientName || 'there'}</strong>, you received a new message while offline:
              </p>

              <!-- Message Card -->
              <div style="background-color: #f8fafc; border-radius: 10px; border-left: 3px solid #00a884; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 16px 18px; margin-bottom: 24px;">
                <div style="font-size: 14px; font-weight: 600; color: #00a884; margin-bottom: 6px;">
                  ${senderName || 'Someone'}${isGroup ? ` in ${chatName}` : ''}
                </div>
                <div style="font-size: 15px; color: #1e293b; line-height: 1.5;">
                  ${previewText || 'Sent you a message'}
                </div>
              </div>

              <!-- Button -->
              <div style="text-align: center; margin: 28px 0 12px 0;">
                <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #00a884; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,168,132,0.25);">
                  Open NexChat & Reply
                </a>
              </div>
            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding: 20px 32px 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} NexChat · Real-time Messaging
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
