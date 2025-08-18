import FingerprintJS, { Agent } from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<Agent> | null = null;

/**
 * Initialize FingerprintJS (only once)
 */
function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Generate a unique identifier for the current browser/device
 */
export async function getUserIdentifier(): Promise<string> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Fingerprinting only available in browser');
    }

    const fp = await initFingerprint();
    const result = await fp.get();
    
    // Use the visitor ID as the user identifier
    return result.visitorId;
  } catch (error) {
    console.error('Fingerprinting error:', error);
    
    // Fallback: generate a random identifier and store in sessionStorage
    let fallbackId = sessionStorage.getItem('xchat_user_id');
    if (!fallbackId) {
      fallbackId = 'fallback_' + Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('xchat_user_id', fallbackId);
    }
    
    return fallbackId;
  }
}

/**
 * Clear the cached fingerprint (useful for testing)
 */
export function clearFingerprintCache(): void {
  fpPromise = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('xchat_user_id');
  }
}
