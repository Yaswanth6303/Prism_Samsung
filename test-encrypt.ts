import { encrypt, decrypt } from './lib/encryption.ts';
try {
  const enc = encrypt('test-key');
  console.log('Encrypted:', enc);
  const dec = decrypt(enc);
  console.log('Decrypted:', dec);
} catch (e) {
  console.error('Error:', e);
}
