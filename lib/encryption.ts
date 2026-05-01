import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function getKey() {
  const secret = process.env.ENCRYPTION_SECRET || 'fallback_dev_secret_change_in_prod'
  // Always derive a proper 32-byte key via SHA-256, regardless of input format
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

export function decrypt(payload: string): string {
  if (!payload) return ''
  try {
    const [ivHex, encryptedHex] = payload.split(':')
    if (!ivHex || !encryptedHex) return payload
    const key = getKey()
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption failed:', error)
    return ''
  }
}
