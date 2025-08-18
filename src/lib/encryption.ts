import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Get encryption key from environment variable
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production';

/**
 * Derives a key from the secret using scrypt
 */
async function deriveKey(): Promise<Buffer> {
  const salt = Buffer.from('xchat-api-key-salt', 'utf8'); // Fixed salt for consistency
  return (await scryptAsync(ENCRYPTION_SECRET, salt, 32)) as Buffer;
}

/**
 * Encrypts an API key using AES-256-GCM
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  try {
    const key = await deriveKey();
    const iv = randomBytes(16); // Initialization vector
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv, authTag, and encrypted data
    const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypts an API key using AES-256-GCM
 */
export async function decryptApiKey(encryptedData: string): Promise<string> {
  try {
    const key = await deriveKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}
