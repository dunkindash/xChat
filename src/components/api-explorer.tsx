"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { getStoredApiKey } from "@/components/api-key";
import { 
  Play, 
  Copy, 
  Check, 
  Code, 
  Settings, 
  MessageSquare,
  Info,
  Clock,
  AlertCircle
} from "lucide-react";

export function ApiExplorer() {
  const [model, setModel] = useState("grok-4-0709");
  const [messages, setMessages] = useState(JSON.stringify([
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" }
  ], null, 2));
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [stream, setStream] = useState(false);
  const [topP, setTopP] = useState(1.0);
  
  const [response, setResponse] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [activeTab, setActiveTab] = useState("request");

  const executeRequest = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError("Please enter your xAI API key in the Settings tab first.");
      return;
    }

    let parsedMessages;
    try {
      parsedMessages = JSON.parse(messages);
    } catch {
      setError("Invalid JSON in messages field");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseTime(null);

    const startTime = Date.now();

    try {
      const requestBody = {
        model,
        messages: parsedMessages,
        temperature,
        max_tokens: maxTokens,
        stream,
        top_p: topP
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-xai-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setResponse(data);
      setActiveTab("response");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setActiveTab("response");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "request" | "response") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "request") {
        setCopiedRequest(true);
        setTimeout(() => setCopiedRequest(false), 2000);
      } else {
        setCopiedResponse(true);
        setTimeout(() => setCopiedResponse(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const requestJson = JSON.stringify({
    model,
    messages: JSON.parse(messages || "[]"),
    temperature,
    max_tokens: maxTokens,
    stream,
    top_p: topP
  }, null, 2);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">API Explorer</h2>
          <p className="text-muted-foreground">
            Test and explore xAI API endpoints with interactive documentation.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Endpoint Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Chat Completions
                </CardTitle>
                <CardDescription>
                  Create a chat completion with Grok models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">POST</Badge>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      /v1/chat/completions
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Parameters
                </CardTitle>
                <CardDescription>
                  Configure the request parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">model</Label>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The model to use for completion</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grok-4-0709">grok-4-0709</SelectItem>
                      <SelectItem value="grok-2-latest">grok-2-latest</SelectItem>
                      <SelectItem value="grok-2-mini">grok-2-mini</SelectItem>
                      <SelectItem value="grok-3">grok-3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Messages */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">messages</Label>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Array of message objects</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    value={messages}
                    onChange={(e) => setMessages(e.target.value)}
                    className="font-mono text-sm min-h-[120px]"
                    placeholder="Enter valid JSON"
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">temperature</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Sampling temperature (0-2)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                    step={0.1}
                    min={0}
                    max={2}
                  />
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">max_tokens</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Maximum tokens to generate</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
                    min={1}
                  />
                </div>

                {/* Stream */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">stream</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Stream the response</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={stream}
                    onCheckedChange={setStream}
                  />
                </div>

                {/* Top P */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">top_p</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Nucleus sampling parameter</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value) || 0)}
                    step={0.1}
                    min={0}
                    max={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Execute Button */}
            <Button
              onClick={executeRequest}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Executing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Execute Request
                </div>
              )}
            </Button>
          </div>

          {/* Right Panel - Request/Response */}
          <div className="space-y-6">
            <Card className="h-[700px] flex flex-col overflow-hidden">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Request & Response
                  </CardTitle>
                  {responseTime && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {responseTime}ms
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                <div className="h-full flex flex-col px-6 pb-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                      <TabsTrigger value="request">Request</TabsTrigger>
                      <TabsTrigger value="response">Response</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="request" className="flex-1 mt-4 min-h-0">
                      <div className="h-full flex flex-col space-y-3">
                        <div className="flex items-center justify-between flex-shrink-0">
                          <Label className="text-sm font-medium">Request Body</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(requestJson, "request")}
                            className="flex items-center gap-1"
                          >
                            {copiedRequest ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedRequest ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                        <div className="flex-1 min-h-0 rounded border bg-muted/30">
                          <ScrollArea className="h-full w-full">
                            <pre className="p-4 text-sm font-mono leading-relaxed">
                              <code className="text-foreground">{requestJson}</code>
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="response" className="flex-1 mt-4 min-h-0">
                      <div className="h-full flex flex-col space-y-3">
                        <div className="flex items-center justify-between flex-shrink-0">
                          <Label className="text-sm font-medium">Response</Label>
                          {(response || error) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(
                                error ? error : JSON.stringify(response, null, 2), 
                                "response"
                              )}
                              className="flex items-center gap-1"
                            >
                              {copiedResponse ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedResponse ? "Copied!" : "Copy"}
                            </Button>
                          )}
                        </div>
                        <div className="flex-1 min-h-0 rounded border bg-muted/30">
                          <ScrollArea className="h-full w-full">
                            {loading ? (
                              <div className="flex items-center justify-center h-full min-h-[400px]">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                                  Executing request...
                                </div>
                              </div>
                            ) : error ? (
                              <div className="p-4">
                                <div className="flex items-center gap-2 text-red-600 mb-2">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="font-medium">Error</span>
                                </div>
                                <pre className="text-sm text-red-600 whitespace-pre-wrap font-mono leading-relaxed">
                                  {error}
                                </pre>
                              </div>
                            ) : response ? (
                              <pre className="p-4 text-sm font-mono leading-relaxed">
                                <code className="text-foreground">{JSON.stringify(response, null, 2)}</code>
                              </pre>
                            ) : (
                              <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                                <div className="text-center">
                                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">Execute a request to see the response</p>
                                </div>
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
