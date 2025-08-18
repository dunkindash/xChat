"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ApiKeyManager, getStoredApiKey } from "@/components/api-key";
import { RefreshCw, ExternalLink, Copy, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ApiStatus = "checking" | "connected" | "no-key" | "invalid" | "error";

interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  description: string;
}

const statusConfigs: Record<ApiStatus, StatusConfig> = {
  checking: {
    label: "Checking...",
    variant: "secondary",
    className: "animate-pulse",
    description: "Checking API connection status",
  },
  connected: {
    label: "Connected",
    variant: "default",
    className: "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
    description: "Successfully connected to xAI API",
  },
  "no-key": {
    label: "No API Key",
    variant: "secondary",
    className: "",
    description: "Please enter your xAI API key to connect",
  },
  invalid: {
    label: "Invalid Key",
    variant: "destructive",
    className: "",
    description: "The API key is invalid or expired",
  },
  error: {
    label: "Connection Error",
    variant: "destructive",
    className: "",
    description: "Failed to connect to xAI API",
  },
};

export function SettingsPage() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [message, setMessage] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  const apiUrl = "https://api.x.ai/v1";

  const checkApiStatus = async () => {
    setIsChecking(true);
    setStatus("checking");
    
    try {
      const apiKey = await getStoredApiKey();
      
      const response = await fetch("/api/health", {
        headers: apiKey ? { "x-xai-api-key": apiKey } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status as ApiStatus);
        setMessage(data.message || "");
        setLastChecked(new Date());
      } else {
        setStatus("error");
        setMessage("Failed to check API status");
        setLastChecked(new Date());
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  const copyApiUrl = async () => {
    try {
      await navigator.clipboard.writeText(apiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  useEffect(() => {
    // Initial check when component mounts
    checkApiStatus();

    // Listen for API key changes
    const handleApiKeyChange = () => {
      checkApiStatus();
    };
    window.addEventListener("apiKeyChanged", handleApiKeyChange);

    return () => {
      window.removeEventListener("apiKeyChanged", handleApiKeyChange);
    };
  }, []);

  const config = statusConfigs[status];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your API configuration and connection settings.
        </p>
      </div>

      <div className="grid gap-6">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure your xAI API key to enable chat, vision, and generation features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <ApiKeyManager />
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Connection Status
              <Button
                variant="outline"
                size="sm"
                onClick={checkApiStatus}
                disabled={isChecking}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
                Check Connection
              </Button>
            </CardTitle>
            <CardDescription>
              Current status of your API connection and endpoint information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
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
                    {config.label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground">
                {message || config.description}
              </p>
            </div>

            {lastChecked && (
              <div className="space-y-2">
                <Label>Last Checked</Label>
                <p className="text-sm text-muted-foreground">
                  {lastChecked.toLocaleString()}
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label>API Endpoint</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2 py-1 text-sm font-mono">
                  {apiUrl}
                </code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyApiUrl}
                        className="flex items-center gap-1"
                      >
                        {copied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? "Copied to clipboard!" : "Copy API endpoint URL"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(apiUrl, "_blank")}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
