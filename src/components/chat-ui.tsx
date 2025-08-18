"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TypingIndicator } from "@/components/typing-indicator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStoredApiKey } from "@/components/api-key";
import { Send, Settings, Sparkles, User, Bot, Copy, Check } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function ChatUI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>("grok-4-0709");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function send() {
    if (!canSend) return;
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      alert("Please enter your xAI API key first.");
      return;
    }
    const newMessages = [...messages, { role: "user", content: input.trim() } as ChatMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-xai-api-key": apiKey,
        },
        body: JSON.stringify({ model, messages: newMessages, temperature, stream: true }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split(/\n/).filter(Boolean);
        for (const line of lines) {
          const trimmed = line.replace(/^data:\s*/, "");
          if (trimmed === "[DONE]") continue;
          try {
            const json = JSON.parse(trimmed);
            const delta = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent } as ChatMessage;
                return copy;
              });
            }
          } catch {
            assistantContent += trimmed;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: assistantContent } as ChatMessage;
              return copy;
            });
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function copyMessage(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  const getModelDisplayName = (modelValue: string) => {
    switch (modelValue) {
      case "grok-4-0709": return "Grok-4";
      case "grok-2-latest": return "Grok-2";
      case "grok-2-mini": return "Grok-2 Mini";
      case "grok-3": return "Grok-3";
      default: return modelValue;
    }
  };

  return (
    <TooltipProvider>
      <Card className="flex h-[80vh] w-full flex-col overflow-hidden shadow-lg border-0 bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">xChat</h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {getModelDisplayName(model)}
            </Badge>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Welcome to xChat</h3>
                <p className="text-muted-foreground max-w-md">
                  Start a conversation with Grok AI. Ask questions, get help with coding, or just chat!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex items-start gap-4 group ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className={`h-10 w-10 shrink-0 ring-2 ring-offset-2 ${
                    m.role === "user" 
                      ? "ring-primary/20 bg-primary text-primary-foreground" 
                      : "ring-muted bg-muted"
                  }`}>
                    <AvatarFallback className="text-sm font-medium">
                      {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`relative flex flex-col gap-2 max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      m.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-br-md" 
                        : "bg-card border rounded-bl-md"
                    }`}>
                      <div className="whitespace-pre-wrap break-words">
                        {m.content}
                      </div>
                      {m.role === "assistant" && m.content && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute -right-2 -top-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm"
                              onClick={() => copyMessage(m.content, idx)}
                            >
                              {copiedIndex === idx ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copiedIndex === idx ? "Copied!" : "Copy message"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Typing Indicator */}
        {loading && (
          <div className="px-6 pb-4">
            <TypingIndicator />
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t bg-card/50 backdrop-blur-sm p-4 space-y-4">
            {/* Model & Temperature Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Model Settings</span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium min-w-[60px]">Model</span>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grok-4-0709">Grok-4 (Latest)</SelectItem>
                      <SelectItem value="grok-2-latest">Grok-2 (Latest)</SelectItem>
                      <SelectItem value="grok-2-mini">Grok-2 Mini</SelectItem>
                      <SelectItem value="grok-3">Grok-3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium min-w-[90px]">Temperature</span>
                  <div className="w-[120px]">
                    <Slider
                      min={0}
                      max={2}
                      step={0.1}
                      value={[temperature]}
                      onValueChange={(v) => setTemperature(v[0] ?? 0.7)}
                      className="cursor-pointer"
                    />
                  </div>
                  <Badge variant="outline" className="tabular-nums min-w-[40px] justify-center">
                    {temperature.toFixed(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t bg-card/30 backdrop-blur-sm p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className="pr-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {input.length > 0 && `${input.length}`}
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={send} 
                  disabled={!canSend}
                  className="px-4 bg-primary hover:bg-primary/90 transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span className="hidden sm:inline">Sending</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Send</span>
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {loading ? "Sending message..." : "Send message (Enter)"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
