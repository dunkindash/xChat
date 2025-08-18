"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const LOCAL_STORAGE_KEY = "xai_api_key";

export function ApiKeyManager({ onChange }: { onChange?: (key: string | null) => void }) {
  const [apiKey, setApiKey] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const existing = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (existing) {
      setApiKey(existing);
      onChange?.(existing);
    }
  }, [onChange]);

  function save() {
    if (apiKey.trim()) {
      localStorage.setItem(LOCAL_STORAGE_KEY, apiKey.trim());
      setSaved(true);
      onChange?.(apiKey.trim());
      // Dispatch custom event for API key change
      window.dispatchEvent(new Event("apiKeyChanged"));
      setTimeout(() => setSaved(false), 1000);
    }
  }

  function clear() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setApiKey("");
    onChange?.(null);
    // Dispatch custom event for API key change
    window.dispatchEvent(new Event("apiKeyChanged"));
  }

  return (
    <div className="flex w-full gap-2">
      <Input
        type="password"
        placeholder="Enter xAI API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <Button onClick={save} variant="default">
        {saved ? "Saved" : "Save"}
      </Button>
      <Button onClick={clear} variant="secondary">
        Clear
      </Button>
    </div>
  );
}

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_STORAGE_KEY);
}
