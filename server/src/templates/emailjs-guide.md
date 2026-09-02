# EmailJS Template Setup Guide for NexChat

This guide shows you exactly what to configure in your [EmailJS Dashboard](https://dashboard.emailjs.com/admin/templates).

---

## 🎯 Option A: The Universal Template (Recommended - 1 Template for Everything)

Because EmailJS free tier has a limit of **2 templates**, using 1 Universal Template allows your backend to send all 3 email types (**Registration OTP**, **Password Reset OTP**, and **Offline Chat Notifications**) with rich branding.

### In EmailJS Dashboard:
1. Click **Create New Template**.
2. Set the header fields:
   - **Subject**: `{{subject}}`
   - **To Email**: `{{to_email}}`
   - **From Name**: `NexChat`
3. Click the **`< >` (Source Code / HTML)** button in the text editor toolbar.
4. Paste this exact line into the source code view:
   ```html
   {{{html_content}}}
   ```
   *(Note: The triple curly braces `{{{ }}}` allow raw HTML from our backend templates to be rendered beautifully).*
5. Click **Save** at the top right.
6. Copy your **Template ID** (e.g. `template_xxxxxxx`).

---

## 🎨 Option B: Dedicated Static Verification Template (Alternative)

If you prefer EmailJS's visual designer for just OTP verification:

### In EmailJS Template Settings:
- **Subject**: `Verify your NexChat account`
- **To Email**: `{{to_email}}`
- **From Name**: `NexChat`

### HTML Content (Click `< >` and paste):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Verify your NexChat account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 22px; font-weight: 700; color: #00a884;">💬 NexChat</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a;">Verify your email address</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Hi <strong>{{to_name}}</strong>, thanks for joining NexChat! Use the verification code below to complete your registration:
              </p>
              <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 600; margin-bottom: 8px;">
                  Verification Code
                </div>
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #00a884; font-family: monospace;">
                  {{otp_code}}
                </div>
              </div>
              <p style="font-size: 13px; color: #64748b;">⏱️ This code expires in <strong>15 minutes</strong>.</p>
              <p style="font-size: 13px; color: #94a3b8;">If you did not request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              © NexChat · Real-time Messaging
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔑 How to get your API Keys from EmailJS:
1. **Public Key**: Click **Account** (bottom-left) &rarr; Copy **Public Key**.
2. **Private Key**: Click **Account** &rarr; **Security** tab &rarr; Copy/Generate **Private Key** (Access Token).
