"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TypingIndicator } from "@/components/typing-indicator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStoredApiKey } from "@/components/api-key";

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

  return (
    <Card className="flex h-[70vh] w-full flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {messages.map((m, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback>{m.role === "user" ? "U" : "A"}</AvatarFallback>
              </Avatar>
              <div className="rounded-md bg-muted px-3 py-2 text-sm leading-6 whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      {loading && (
        <div className="px-4 pb-2">
          <TypingIndicator />
        </div>
      )}
      <div className="border-t p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <Button onClick={send} disabled={!canSend}>
            {loading ? "Sending..." : "Send"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="min-w-[60px]">Model</span>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Model" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grok-4-0709">grok-4-0709 (default)</SelectItem>
                <SelectItem value="grok-2-latest">grok-2-latest</SelectItem>
                <SelectItem value="grok-2-mini">grok-2-mini</SelectItem>
                <SelectItem value="grok-3">grok-3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="min-w-[90px]">Temperature</span>
            <div className="w-[200px]">
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[temperature]}
                onValueChange={(v) => setTemperature(v[0] ?? 0.7)}
              />
            </div>
            <span className="tabular-nums">{temperature.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}


