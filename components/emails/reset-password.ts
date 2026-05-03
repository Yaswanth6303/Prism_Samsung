export function getResetPasswordEmail({
  name,
  url,
  companyName = "Clawmind",
  expiresInMinutes = 60,
}: {
  name: string;
  url: string;
  companyName?: string;
  expiresInMinutes?: number;
}) {
  const truncatedUrl = url.length > 72 ? url.slice(0, 69) + "..." : url;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background-color:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f4f4f5;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:24px;height:24px;background-color:#18181b;border-radius:5px;text-align:center;vertical-align:middle;">
                    <span style="font-size:12px;color:#fafafa;font-weight:700;">&#10022;</span>
                  </td>
                  <td style="padding-left:8px;font-size:14px;font-weight:600;color:#18181b;vertical-align:middle;">
                    ${companyName}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">

              <!-- Lock icon -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="width:40px;height:40px;border-radius:8px;border:1px solid #e4e4e7;background-color:#fafafa;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;line-height:40px;">&#128274;</span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="font-size:22px;font-weight:600;color:#09090b;margin:0 0 6px;letter-spacing:-0.025em;line-height:1.3;">
                Reset your password
              </h1>
              <p style="font-size:14px;color:#71717a;margin:0 0 24px;line-height:1.6;">
                Hi ${name},
              </p>

              <!-- Description -->
              <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0 0 28px;">
                We received a request to reset the password for your account.
                Click the button below to create a new password. This link expires in
                <strong style="color:#09090b;font-weight:500;">${expiresInMinutes} minutes</strong>.
              </p>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-radius:6px;background-color:#18181b;">
                    <a href="${url}"
                       style="display:inline-block;padding:10px 20px;color:#fafafa;font-size:13px;font-weight:500;letter-spacing:-0.01em;text-decoration:none;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-top:1px solid #f4f4f5;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="font-size:13px;color:#71717a;margin:0 0 6px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size:12px;color:#3f3f46;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:6px;padding:10px 12px;margin:0 0 28px;word-break:break-all;font-family:ui-monospace,SFMono-Regular,monospace;line-height:1.6;">
                ${truncatedUrl}
              </p>

              <!-- Note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:6px;padding:14px 16px;">
                    <p style="font-size:13px;color:#71717a;margin:0;line-height:1.6;">
                      If you didn't request a password reset, you can safely ignore this email.
                      Your password will not be changed.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f4f4f5;background-color:#fafafa;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#a1a1aa;">
                    &copy; ${new Date().getFullYear()} ${companyName} Inc.
                  </td>
                  <td align="right">
                    <a href="#" style="font-size:12px;color:#a1a1aa;text-decoration:none;margin-left:16px;">Privacy</a>
                    <a href="#" style="font-size:12px;color:#a1a1aa;text-decoration:none;margin-left:16px;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
