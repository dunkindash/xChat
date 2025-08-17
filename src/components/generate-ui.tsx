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
    <Card className="flex min-h-[70vh] max-h-[80vh] w-full flex-col overflow-hidden">
      <div className="flex flex-1 gap-6 p-6 md:flex-row flex-col min-h-0">
        <div className="flex w-full md:w-1/2 flex-col gap-4">
          <div className="space-y-4">
            <Textarea 
              placeholder="Describe the image you want to generate..."
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-medium min-w-[70px]">Model</span>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grok-2-image">Grok Image 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-medium min-w-[70px]">Count</span>
                <div className="w-[120px]">
                  <Slider 
                    min={1} 
                    max={10} 
                    step={1} 
                    value={[count]} 
                    onValueChange={(v) => setCount(v[0] ?? 1)}
                    className="cursor-pointer"
                  />
                </div>
                <span className="tabular-nums font-mono text-sm bg-muted px-2 py-1 rounded">
                  {count}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-medium min-w-[70px]">Format</span>
                <Select
                  value={format}
                  onValueChange={(v) => {
                    if (v === "url" || v === "b64_json") setFormat(v);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="b64_json">Base64</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex w-full md:w-1/2 flex-col gap-4">
          <div className="flex-1 min-h-0">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 h-full overflow-auto">
                {images.map((g, i) => {
                  const src = asSrc(g);
                  return src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      key={i} 
                      src={src} 
                      alt={`generated-${i}`} 
                      className="aspect-square w-full rounded-lg border bg-muted object-cover shadow-sm" 
                    />
                  ) : null;
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full rounded-lg border-2 border-dashed bg-muted/50 text-muted-foreground">
                <div className="text-center space-y-2">
                  <div className="text-2xl">🎨</div>
                  <div className="text-sm">Generated images will appear here</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="border-t bg-card/50 p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {images.length > 0 && `${images.length} image${images.length > 1 ? 's' : ''} generated`}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setImages([])}
              disabled={!images.length || loading}
            >
              Clear All
            </Button>
            <Button 
              onClick={generate} 
              disabled={loading || !prompt.trim()}
              className="min-w-[100px]"
            >
              {loading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
