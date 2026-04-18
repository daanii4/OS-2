import { sendTransactionalEmail } from '@/lib/resend'

const ROLE_LABEL: Record<'counselor' | 'assistant' | 'owner', string> = {
  counselor: 'behavioral support counselor',
  assistant: 'program assistant',
  owner: 'program administrator',
}

const ROLE_BULLETS: Record<'counselor' | 'assistant' | 'owner', string[]> = {
  counselor: [
    'Your assigned students with full behavioral histories',
    'AI-powered briefings before every counseling session',
    'A session log that pre-fills student info — you only write what happened',
    "Progress charts showing each student's improvement over time",
  ],
  assistant: [
    'Full caseload visibility across all counselors',
    'Monthly caseload export ready for district reporting',
    'Incident and session logging tools',
    'Team and student management',
  ],
  owner: [
    'Your complete student caseload in one place',
    'AI-powered session briefings for every counselor on your team',
    'Monthly district caseload export — one click, correct format',
    'Team management and organization settings',
  ],
}

export type WelcomeEmailRole = 'owner' | 'assistant' | 'counselor'

/** Invite flow: temp password + sign-in at login (no magic link). */
export async function sendInviteTempPasswordEmail(props: {
  to: string
  name: string
  role: WelcomeEmailRole
  invitedBy: string
  tenantName: string
  loginUrl: string
  tempPassword: string
}): Promise<void> {
  const { to, name, role, invitedBy, tenantName, loginUrl, tempPassword } = props
  const bullets = ROLE_BULLETS[role]
    .map(
      b =>
        `<li style="margin-bottom:8px;color:#374151;font-size:14px;">${escapeHtml(b)}</li>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;
              border:1px solid #e2e8f0;overflow:hidden;">

    <div style="background:#5C6B46;padding:32px 40px;">
      <p style="color:#D6A033;font-size:12px;font-weight:600;letter-spacing:0.08em;
                margin:0 0 8px;text-transform:uppercase;">Operation Scholars</p>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0;">
        Welcome to Operation Scholars OS
      </h1>
    </div>

    <div style="padding:32px 40px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hi ${escapeHtml(name)},
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        <strong>${escapeHtml(invitedBy)}</strong> has added you to <strong>${escapeHtml(tenantName)}</strong>
        as a ${escapeHtml(ROLE_LABEL[role])}.
      </p>

      <p style="color:#374151;font-size:14px;font-weight:600;margin:0 0 12px;">
        Here's what's waiting for you:
      </p>
      <ul style="padding-left:20px;margin:0 0 28px;">${bullets}</ul>

      <p style="color:#374151;font-size:14px;margin:0 0 12px;">
        Sign in using your email and this <strong>temporary password</strong> (copy it exactly):
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:0 0 20px;
                  font-family:ui-monospace,monospace;font-size:14px;word-break:break-all;
                  color:#0f172a;border:1px solid #e2e8f0;">
        ${escapeHtml(tempPassword)}
      </div>

      <p style="color:#374151;font-size:14px;margin:0 0 10px;font-weight:600;">
        Sign in to Operation Scholars OS
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
        <tr>
          <td style="border-radius:8px;background:#5C6B46;">
            <a href="${escapeHtml(loginUrl)}"
               style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;
                      color:#ffffff;text-decoration:none;border-radius:8px;">
              Open sign in
            </a>
          </td>
        </tr>
      </table>

      <p style="color:#64748b;font-size:12px;margin:0 0 6px;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="margin:0 0 24px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                font-family:ui-monospace,monospace;font-size:13px;word-break:break-all;color:#0f172a;line-height:1.5;">
        ${escapeHtml(loginUrl)}
      </p>

      <p style="color:#64748b;font-size:13px;margin:0;line-height:1.5;">
        After you sign in, you will choose a new password, then complete a short onboarding.
      </p>

      <p style="color:#9ca3af;font-size:12px;margin:32px 0 0;">
        If you weren't expecting this invite, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`

  const text = [
    `Hi ${name},`,
    '',
    `${invitedBy} added you to ${tenantName} as a ${ROLE_LABEL[role]}.`,
    '',
    'Sign in here (copy the full line into your browser if needed):',
    loginUrl,
    '',
    `Temporary password: ${tempPassword}`,
    '',
    'After sign-in you will set a new password and complete onboarding.',
  ].join('\n')

  const result = await sendTransactionalEmail({
    to,
    subject: `You've been added to ${tenantName} — Operation Scholars OS`,
    html,
    text,
    tags: [{ name: 'category', value: 'welcome_invite' }],
  })

  if (!result.ok) {
    throw new Error(result.error)
  }
}

export async function sendWelcomeEmail(props: {
  to: string
  name: string
  role: WelcomeEmailRole
  invitedBy: string
  tenantName: string
  setupUrl: string
}): Promise<void> {
  const { to, name, role, invitedBy, tenantName, setupUrl } = props
  const bullets = ROLE_BULLETS[role]
    .map(
      b =>
        `<li style="margin-bottom:8px;color:#374151;font-size:14px;">${escapeHtml(b)}</li>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;
              border:1px solid #e2e8f0;overflow:hidden;">

    <div style="background:#5C6B46;padding:32px 40px;">
      <p style="color:#D6A033;font-size:12px;font-weight:600;letter-spacing:0.08em;
                margin:0 0 8px;text-transform:uppercase;">Operation Scholars</p>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0;">
        Welcome to Operation Scholars OS
      </h1>
    </div>

    <div style="padding:32px 40px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hi ${escapeHtml(name)},
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        <strong>${escapeHtml(invitedBy)}</strong> has added you to <strong>${escapeHtml(tenantName)}</strong>
        as a ${escapeHtml(ROLE_LABEL[role])}.
      </p>

      <p style="color:#374151;font-size:14px;font-weight:600;margin:0 0 12px;">
        Here's what's waiting for you:
      </p>
      <ul style="padding-left:20px;margin:0 0 28px;">${bullets}</ul>

      <p style="color:#374151;font-size:14px;margin:0 0 24px;">
        Click below to set your password and get started.
        This link expires in 24 hours.
      </p>

      <a href="${escapeHtml(setupUrl)}"
         style="display:inline-block;background:#5C6B46;color:white;
                font-size:15px;font-weight:600;padding:14px 28px;
                border-radius:8px;text-decoration:none;">
        Set My Password →
      </a>

      <p style="color:#9ca3af;font-size:12px;margin:32px 0 0;">
        If you weren't expecting this invite, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`

  const text = [
    `Hi ${name},`,
    '',
    `${invitedBy} added you to ${tenantName} as a ${ROLE_LABEL[role]}.`,
    '',
    `Set your password: ${setupUrl}`,
  ].join('\n')

  const result = await sendTransactionalEmail({
    to,
    subject: `You've been added to ${tenantName} — Operation Scholars OS`,
    html,
    text,
    tags: [{ name: 'category', value: 'welcome_invite' }],
  })

  if (!result.ok) {
    throw new Error(result.error)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
