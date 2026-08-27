/**
 * Generate a responsive and beautifully styled HTML email template for offline user notifications
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
  const senderInitial = (senderName || 'U').charAt(0).toUpperCase()
  let previewText = messageContent

  if (messageType === 'image') {
    previewText = `📷 Photo ${messageContent ? `— ${messageContent}` : ''}`
  } else if (messageType === 'video') {
    previewText = `🎬 Video ${messageContent ? `— ${messageContent}` : ''}`
  } else if (messageType === 'audio') {
    previewText = `🎵 Voice/Audio note`
  } else if (messageType === 'file') {
    previewText = `📄 Document attachment`
  }

  // Truncate preview
  if (previewText && previewText.length > 180) {
    previewText = previewText.substring(0, 180) + '...'
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message on NexChat</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c1317;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e9edef;
    }
    .email-container {
      max-width: 540px;
      margin: 30px auto;
      background-color: #111b21;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #222e35;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #00a884 0%, #005c4b 100%);
      padding: 24px 30px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .content {
      padding: 32px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #e9edef;
      margin-bottom: 8px;
    }
    .subtext {
      font-size: 14px;
      color: #8696a0;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .message-card {
      background-color: #202c33;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 28px;
      border-left: 4px solid #00a884;
    }
    .sender-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00a884, #025144);
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      display: inline-block;
      text-align: center;
      line-height: 36px;
      vertical-align: middle;
    }
    .sender-info {
      display: inline-block;
      vertical-align: middle;
      margin-left: 10px;
    }
    .sender-name {
      font-size: 15px;
      font-weight: 600;
      color: #00a884;
    }
    .chat-context {
      font-size: 12px;
      color: #8696a0;
    }
    .message-body {
      font-size: 15px;
      color: #d1d7db;
      line-height: 1.5;
      background-color: #111b21;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 10px;
      word-break: break-word;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .btn-reply {
      display: inline-block;
      background-color: #00a884;
      color: #111b21 !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 28px;
      box-shadow: 0 4px 14px rgba(0, 168, 132, 0.35);
      transition: background-color 0.2s ease;
    }
    .footer {
      background-color: #0c1317;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #667781;
      border-top: 1px solid #222e35;
      line-height: 1.6;
    }
    .footer a {
      color: #00a884;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <span>💬 NexChat</span>
      </div>
    </div>

    <!-- Body -->
    <div class="content">
      <div class="greeting">Hi ${recipientName || 'there'}, 👋</div>
      <div class="subtext">
        You received a new message on NexChat while you were offline.
      </div>

      <!-- Message Card -->
      <div class="message-card">
        <div>
          <span class="avatar-circle">${senderInitial}</span>
          <div class="sender-info">
            <div class="sender-name">${senderName}</div>
            ${isGroup ? `<div class="chat-context">in group <strong>${chatName}</strong></div>` : ''}
          </div>
        </div>
        <div class="message-body">
          ${previewText || 'Sent an attachment'}
        </div>
      </div>

      <!-- CTA Button -->
      <div class="btn-container">
        <a href="${appUrl}" class="btn-reply" target="_blank">
          Open NexChat & Reply →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      This is an automated notification from <strong>NexChat</strong> because you were offline.<br>
      To manage your preferences or reply to your contacts, visit <a href="${appUrl}">NexChat</a>.
    </div>
  </div>
</body>
</html>
  `.trim()
}
