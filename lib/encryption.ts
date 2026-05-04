import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function getKey() {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) throw new Error('ENCRYPTION_SECRET must be set')
  // Always derive a proper 32-byte key via SHA-256
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(text: string): string {
  if (!text) return ''
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(payload: string | null | undefined): string {
  // Defensive: ensure payload is a string before attempting to split.
  // Add lightweight diagnostics to catch unexpected types in production.
  if (!payload || typeof payload !== 'string') {
    return ''
  }

  try {
    const [ivHex, encryptedHex] = payload.split(':')
    if (!ivHex || !encryptedHex) return ''
    const key = getKey()
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption failed')
    return ''
  }
}
