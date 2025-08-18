"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getUserIdentifier } from "@/lib/fingerprint";

export const LOCAL_STORAGE_KEY = "xai_api_key"; // Keep for migration purposes

export function ApiKeyManager({ onChange }: { onChange?: (key: string | null) => void }) {
  const [apiKey, setApiKey] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadApiKey();
  }, [onChange]);

  async function loadApiKey() {
    try {
      setLoading(true);
      setError("");
      
      // First, try to get from database
      const userIdentifier = await getUserIdentifier();
      const response = await fetch(`/api/keys?userIdentifier=${encodeURIComponent(userIdentifier)}`);
      
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        onChange?.(data.apiKey);
        return;
      }
      
      // If not found in database, check localStorage for migration
      if (response.status === 404) {
        const localKey = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
        if (localKey) {
          // Migrate from localStorage to database
          await migrateFromLocalStorage(localKey, userIdentifier);
          setApiKey(localKey);
          onChange?.(localKey);
          return;
        }
      }
      
      // No key found anywhere
      setApiKey("");
      onChange?.(null);
    } catch (err) {
      console.error('Error loading API key:', err);
      setError("Failed to load API key");
      
      // Fallback to localStorage if database fails
      const localKey = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
      if (localKey) {
        setApiKey(localKey);
        onChange?.(localKey);
      }
    } finally {
      setLoading(false);
    }
  }

  async function migrateFromLocalStorage(localKey: string, userIdentifier: string) {
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdentifier, apiKey: localKey }),
      });
      
      if (response.ok) {
        // Migration successful, remove from localStorage
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        console.log('Successfully migrated API key from localStorage to database');
      }
    } catch (err) {
      console.error('Failed to migrate API key:', err);
    }
  }

  async function save() {
    if (!apiKey.trim()) return;
    
    try {
      setLoading(true);
      setError("");
      
      const userIdentifier = await getUserIdentifier();
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdentifier, apiKey: apiKey.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API key');
      }
      
      setSaved(true);
      onChange?.(apiKey.trim());
      // Dispatch custom event for API key change
      window.dispatchEvent(new Event("apiKeyChanged"));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    try {
      setLoading(true);
      setError("");
      
      const userIdentifier = await getUserIdentifier();
      const response = await fetch(`/api/keys?userIdentifier=${encodeURIComponent(userIdentifier)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok && response.status !== 404) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete API key');
      }
      
      // Also clear localStorage as fallback
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      
      setApiKey("");
      onChange?.(null);
      // Dispatch custom event for API key change
      window.dispatchEvent(new Event("apiKeyChanged"));
    } catch (err) {
      console.error('Error clearing API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear API key');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full gap-2">
        <Input
          type="password"
          placeholder="Enter xAI API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={loading}
        />
        <Button onClick={save} variant="default" disabled={loading || !apiKey.trim()}>
          {loading ? "..." : saved ? "Saved" : "Save"}
        </Button>
        <Button onClick={clear} variant="secondary" disabled={loading}>
          {loading ? "..." : "Clear"}
        </Button>
      </div>
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

export async function getStoredApiKey(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  
  try {
    // First, try to get from database
    const userIdentifier = await getUserIdentifier();
    const response = await fetch(`/api/keys?userIdentifier=${encodeURIComponent(userIdentifier)}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.apiKey;
    }
    
    // Fallback to localStorage if database fails or key not found
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting stored API key:', error);
    // Fallback to localStorage on error
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  }
}

// Synchronous version for backward compatibility (will be deprecated)
export function getStoredApiKeySync(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_STORAGE_KEY);
}
