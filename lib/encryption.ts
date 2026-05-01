import crypto from 'crypto'

export function encrypt(text: string) {
  const KEY = process.env.ENCRYPTION_SECRET || ''
  if (!KEY || KEY.length !== 64) throw new Error('ENCRYPTION_SECRET must be 64 hex characters')

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(KEY, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(payload: string) {
  const KEY = process.env.ENCRYPTION_SECRET || ''
  if (!KEY || KEY.length !== 64) throw new Error('ENCRYPTION_SECRET must be 64 hex characters')

  const [ivHex, encryptedHex] = payload.split(':')
  if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted payload format')

  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(KEY, 'hex'), iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}
