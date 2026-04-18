import { sendTransactionalEmail, type SendEmailResult } from '@/lib/resend'
import { getPublicAppUrl } from '@/lib/app-url'

/**
 * Sent when an owner or assistant provisions a new team member.
 * Fire-and-forget from the caller; never blocks the API response.
 */
export async function sendWelcomeEmailToNewUser(params: {
  to: string
  name: string
}): Promise<SendEmailResult> {
  const base = getPublicAppUrl()
  const loginUrl = `${base}/login`
  const subject = 'Your Operation Scholars OS account'

  const text = [
    `Hi ${params.name},`,
    '',
    'An account was created for you in Operation Scholars OS.',
    `Sign in here: ${loginUrl}`,
    '',
    'If you did not expect this message, contact your organization administrator.',
  ].join('\n')

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a;">
  <p>Hi ${escapeHtml(params.name)},</p>
  <p>An account was created for you in Operation Scholars OS.</p>
  <p><a href="${escapeHtml(loginUrl)}">Sign in to Operation Scholars OS</a></p>
  <p style="font-size: 14px; color: #555;">If you did not expect this message, contact your organization administrator.</p>
</body>
</html>`.trim()

  return sendTransactionalEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'welcome' }],
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
