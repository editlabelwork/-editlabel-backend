import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

export class EncryptionService {
  private static getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }
    return Buffer.from(key, 'utf-8');
  }

  static encrypt(text: string): string {
    if (!text) return text;

    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = crypto.pbkdf2Sync(this.getKey(), salt, 100000, 32, 'sha512');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      const buffer = Buffer.from(encryptedText, 'base64');
      
      const salt = buffer.subarray(0, SALT_LENGTH);
      const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
      const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
      const encrypted = buffer.subarray(ENCRYPTED_POSITION);

      const key = crypto.pbkdf2Sync(this.getKey(), salt, 100000, 32, 'sha512');

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      return decipher.update(encrypted) + decipher.final('utf8');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}
