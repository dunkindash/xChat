"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStoredApiKey, LOCAL_STORAGE_KEY } from "@/components/api-key";

type ApiStatus = "checking" | "connected" | "no-key" | "invalid" | "error";

interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  tooltip: string;
}

const statusConfigs: Record<ApiStatus, StatusConfig> = {
  checking: {
    label: "Checking...",
    variant: "secondary",
    className: "animate-pulse",
    tooltip: "Checking API connection",
  },
  connected: {
    label: "Connected",
    variant: "default",
    className: "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
    tooltip: "Successfully connected to xAI API",
  },
  "no-key": {
    label: "No API Key",
    variant: "secondary",
    className: "",
    tooltip: "Please enter your xAI API key",
  },
  invalid: {
    label: "Invalid Key",
    variant: "destructive",
    className: "",
    tooltip: "The API key is invalid or expired",
  },
  error: {
    label: "Connection Error",
    variant: "destructive",
    className: "",
    tooltip: "Failed to connect to xAI API",
  },
};

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [message, setMessage] = useState<string>("");

  const checkApiStatus = async () => {
    setStatus("checking");
    
    try {
      const apiKey = getStoredApiKey();
      
      const response = await fetch("/api/health", {
        headers: apiKey ? { "x-xai-api-key": apiKey } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status as ApiStatus);
        setMessage(data.message || "");
      } else {
        setStatus("error");
        setMessage("Failed to check API status");
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  };

  useEffect(() => {
    // Initial check
    checkApiStatus();

    // Set up periodic checks every 30 seconds
    // Set up periodic checks every 60 seconds
    const interval = setInterval(checkApiStatus, 60000);

    // Listen for storage changes (when API key is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        checkApiStatus();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom event when API key is changed in the same tab
    const handleApiKeyChange = () => {
      checkApiStatus();
    };
    window.addEventListener("apiKeyChanged", handleApiKeyChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("apiKeyChanged", handleApiKeyChange);
    };
  }, []);

  const config = statusConfigs[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  status === "connected"
                    ? "bg-green-500 dark:bg-green-400"
                    : status === "checking"
                    ? "bg-yellow-500 dark:bg-yellow-400 animate-pulse"
                    : status === "no-key"
                    ? "bg-gray-400 dark:bg-gray-500"
                    : "bg-red-500 dark:bg-red-400"
                }`}
              />
              <Badge variant={config.variant} className={config.className}>
                API: {config.label}
              </Badge>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message || config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
