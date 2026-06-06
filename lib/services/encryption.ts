import crypto from 'crypto'

// AES keeps stored tokens reversible only with the shared server secret.
const ALGORITHM = 'aes-256-cbc'

// Derive a fixed-length key from the environment secret so encryption stays stable across restarts.
function getKey() {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) throw new Error('ENCRYPTION_SECRET must be set')
  // SHA-256 gives us a 32-byte key that fits the cipher requirements.
  return crypto.createHash('sha256').update(secret).digest()
}

// Encrypt user secrets before they ever hit the database.
export function encrypt(text: string): string {
  if (!text) return ''
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

// Decrypt only when the app needs to use a secret for an outbound provider call.
export function decrypt(payload: string | null | undefined): string {
  // Guard against empty or malformed payloads so callers get a safe empty string instead of a crash.
  if (!payload || typeof payload !== 'string') {
    return ''
  }

  try {
    // The payload stores the IV and ciphertext together, separated by a colon.
    const [ivHex, encryptedHex] = payload.split(':')
    if (!ivHex || !encryptedHex) return ''
    const key = getKey()
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    // Bad input or a rotated secret should fail softly here and return no secret.
    console.error('Decryption failed')
    return ''
  }
}
