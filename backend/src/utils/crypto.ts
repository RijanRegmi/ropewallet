import crypto from 'crypto';

// Retrieve encryption key from env or fallback to a hashed default key
const getEncryptionKey = (): Buffer => {
  const envKey = process.env.CARD_ENCRYPTION_KEY;
  if (envKey) {
    try {
      // If it's a 64-character hex string, convert it to 32 bytes
      if (envKey.length === 64) {
        return Buffer.from(envKey, 'hex');
      }
      // Otherwise, hash the envKey to make it exactly 32 bytes
      return crypto.createHash('sha256').update(envKey).digest();
    } catch (e) {
      console.error('Error parsing CARD_ENCRYPTION_KEY from env:', e);
    }
  }
  // Ultimate fallback key hashed to 32 bytes
  return crypto.createHash('sha256').update('ropewallet_default_fallback_card_secret_key_123').digest();
};

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypts cleartext using AES-256-CBC.
 * Returns cipher text in the format "ivHex:encryptedHex"
 */
export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Card Encryption failed:', error);
    return text;
  }
}

/**
 * Decrypts cipher text in the format "ivHex:encryptedHex"
 * Returns cleartext. If decryption fails, returns the original text.
 */
export function decrypt(cipherText: string): string {
  if (!cipherText) return '';
  // If it doesn't match the format with colon, it's already cleartext
  if (!cipherText.includes(':')) {
    return cipherText;
  }
  
  try {
    const key = getEncryptionKey();
    const parts = cipherText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    // If decryption fails, it might be unencrypted legacy data or incorrect key format
    // Returning the original string handles fallback gracefully
    return cipherText;
  }
}
