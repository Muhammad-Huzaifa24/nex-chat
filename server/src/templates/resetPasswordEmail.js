/**
 * Clean, modern, minimalist HTML email template for Password Reset OTP
 * @param {object} params
 * @param {string} params.displayName - Recipient's display name
 * @param {string} params.otp - 6-digit OTP code
 * @returns {string} HTML email string
 */
export const getResetPasswordEmail = ({ displayName, otp }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password - NexChat</title>
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
                    <span style="color: #ffffff; font-size: 18px; line-height: 34px;">🔒</span>
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
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">
                Reset your password
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Hi <strong style="color: #0f172a;">${displayName || 'there'}</strong>, we received a request to reset your NexChat account password. Use the code below to proceed:
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 20px 16px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 600; margin-bottom: 8px;">
                  Password Reset Code
                </div>
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #00a884; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; padding-left: 10px;">
                  ${otp}
                </div>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                ⏱️ This code will expire in <strong>15 minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                If you did not request a password reset, please ignore this message. Your password will remain unchanged.
              </p>
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
