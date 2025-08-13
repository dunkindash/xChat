"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getStoredApiKey } from "@/components/api-key";

type Generated = { url?: string; b64_json?: string };

export function GenerateUI() {
  const [prompt, setPrompt] = useState<string>("");
  const [model, setModel] = useState<string>("grok-2-image");
  const [count, setCount] = useState<number>(1);
  const [format, setFormat] = useState<"url" | "b64_json">("url");
  const [images, setImages] = useState<Generated[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function generate() {
    const apiKey = getStoredApiKey();
    if (!apiKey) return alert("Please enter your xAI API key first.");
    if (!prompt.trim()) return alert("Enter a prompt.");
    setLoading(true);
    setImages([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-xai-api-key": apiKey },
        body: JSON.stringify({ model, prompt: prompt.trim(), n: count, response_format: format }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setImages(data?.data ?? []);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function asSrc(g: Generated): string | undefined {
    if (g.url) return g.url;
    if (g.b64_json) return `data:image/png;base64,${g.b64_json}`;
    return undefined;
  }

  return (
    <Card className="flex h-[70vh] w-full flex-col overflow-hidden">
      <div className="flex flex-1 gap-6 p-4 md:flex-row flex-col">
        <div className="flex w-full md:w-1/2 flex-col gap-3">
          <Textarea placeholder="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="min-w-[70px]">Model</span>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Model" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grok-2-image">grok-2-image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="min-w-[70px]">Count</span>
              <div className="w-[220px]">
                <Slider min={1} max={10} step={1} value={[count]} onValueChange={(v) => setCount(v[0] ?? 1)} />
              </div>
              <span className="tabular-nums">{count}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="min-w-[70px]">Format</span>
              <Select
                value={format}
                onValueChange={(v) => {
                  if (v === "url" || v === "b64_json") setFormat(v);
                }}
              >
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Format" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">url</SelectItem>
                  <SelectItem value="b64_json">b64_json</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex w-full md:w-1/2 flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {images.map((g, i) => {
              const src = asSrc(g);
              return src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`generated-${i}`} className="aspect-square w-full rounded-md border bg-muted object-cover" />
              ) : null;
            })}
          </div>
        </div>
      </div>
      <div className="border-t p-3 flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => setImages([])}
          disabled={!images.length || loading}
        >
          Clear images
        </Button>
        <Button onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>
    </Card>
  );
}


