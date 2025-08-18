import { neon } from '@neondatabase/serverless';
import { encryptApiKey, decryptApiKey } from './encryption';

// Get database URL from environment variable
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(DATABASE_URL);

export interface ApiKeyRecord {
  id: string;
  user_identifier: string;
  encrypted_api_key: string;
  created_at: string;
  updated_at: string;
}

/**
 * Store an encrypted API key for a user
 */
export async function storeApiKey(userIdentifier: string, apiKey: string): Promise<void> {
  try {
    const encryptedKey = await encryptApiKey(apiKey);
    
    // Set the current user identifier for RLS
    await sql`SELECT set_current_user_identifier(${userIdentifier})`;
    
    await sql`
      INSERT INTO user_api_keys (user_identifier, encrypted_api_key)
      VALUES (${userIdentifier}, ${encryptedKey})
      ON CONFLICT (user_identifier) 
      DO UPDATE SET 
        encrypted_api_key = ${encryptedKey},
        updated_at = NOW()
    `;
  } catch (error) {
    console.error('Database error storing API key:', error);
    throw new Error('Failed to store API key');
  }
}

/**
 * Retrieve and decrypt an API key for a user
 */
export async function getApiKey(userIdentifier: string): Promise<string | null> {
  try {
    // Set the current user identifier for RLS
    await sql`SELECT set_current_user_identifier(${userIdentifier})`;
    
    const result = await sql`
      SELECT encrypted_api_key 
      FROM user_api_keys 
      WHERE user_identifier = ${userIdentifier}
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    const encryptedKey = result[0].encrypted_api_key;
    return await decryptApiKey(encryptedKey);
  } catch (error) {
    console.error('Database error retrieving API key:', error);
    throw new Error('Failed to retrieve API key');
  }
}

/**
 * Delete an API key for a user
 */
export async function deleteApiKey(userIdentifier: string): Promise<boolean> {
  try {
    // Set the current user identifier for RLS
    await sql`SELECT set_current_user_identifier(${userIdentifier})`;
    
    const result = await sql`
      DELETE FROM user_api_keys 
      WHERE user_identifier = ${userIdentifier}
    `;
    
    return result.length > 0;
  } catch (error) {
    console.error('Database error deleting API key:', error);
    throw new Error('Failed to delete API key');
  }
}

/**
 * Check if a user has an API key stored
 */
export async function hasApiKey(userIdentifier: string): Promise<boolean> {
  try {
    // Set the current user identifier for RLS
    await sql`SELECT set_current_user_identifier(${userIdentifier})`;
    
    const result = await sql`
      SELECT 1 
      FROM user_api_keys 
      WHERE user_identifier = ${userIdentifier}
      LIMIT 1
    `;
    
    return result.length > 0;
  } catch (error) {
    console.error('Database error checking API key:', error);
    return false;
  }
}
