import crypto from 'crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

/** Cryptographically random temp password for invites (not stored server-side). */
export function generateInviteTempPassword(length = 16): string {
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return out
}
