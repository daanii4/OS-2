// Server-only — transactional email via Resend. Never import from client components.
import { Resend } from 'resend'

let client: Resend | null = null

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!client) client = new Resend(key)
  return client
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function sendTransactionalEmail(params: {
  to: string
  subject: string
  html: string
  text?: string
  tags?: { name: string; value: string }[]
}): Promise<SendEmailResult> {
  const resend = getResend()
  const from = process.env.RESEND_FROM
  if (!resend || !from) {
    return { ok: false, error: 'Email not configured' }
  }

  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    ...(params.text ? { text: params.text } : {}),
    ...(params.tags ? { tags: params.tags } : {}),
  })

  if (result.error) {
    return { ok: false, error: result.error.message }
  }
  if (!result.data?.id) {
    return { ok: false, error: 'No message id in response' }
  }
  return { ok: true, id: result.data.id }
}
