"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getStoredApiKey } from "@/components/api-key";

export function VisionUI() {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>("What is in this image?");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [model, setModel] = useState<string>("grok-2v");
  const [detailHigh, setDetailHigh] = useState<boolean>(true);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((urls) => setImagePreviews(urls));
  }

  async function analyze() {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      alert("Please enter your xAI API key first.");
      return;
    }
    if (!imagePreviews.length) {
      alert("Please select one or more images first.");
      return;
    }
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-xai-api-key": apiKey },
        body: JSON.stringify({ images: imagePreviews, prompt, model, detail: detailHigh ? "high" : "low" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? "(no content)";
      setAnswer(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAnswer(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex min-h-[70vh] max-h-[80vh] w-full flex-col overflow-hidden">
      <div className="flex flex-1 gap-6 p-6 md:flex-row flex-col min-h-0">
        <div className="flex w-full md:w-1/2 flex-col gap-4">
          <div className="space-y-3">
            <Input ref={fileRef} type="file" accept="image/*" multiple onChange={onFileChange} />
            <Textarea
              placeholder="What would you like to know about the image(s)?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-3 h-full">
              {imagePreviews.length ? (
                imagePreviews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    key={i} 
                    alt={`preview-${i}`} 
                    src={src} 
                    className="aspect-square w-full rounded-lg border bg-muted object-contain shadow-sm" 
                  />
                ))
              ) : (
                <div className="col-span-2 flex aspect-square items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 text-sm text-muted-foreground">
                  <div className="text-center space-y-2">
                    <div className="text-lg">📸</div>
                    <div>Select image(s) to preview</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex w-full md:w-1/2 flex-col gap-4">
          <div className="flex-1 min-h-0">
            <Textarea 
              value={answer} 
              readOnly 
              placeholder="Analysis results will appear here..."
              className="h-full min-h-[300px] resize-none"
            />
          </div>
        </div>
      </div>
      <div className="border-t bg-card/50 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-medium min-w-[60px]">Model</span>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grok-2v">Grok Vision 2</SelectItem>
                <SelectItem value="grok-2v-mini">Grok Vision 2 Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">High Detail</span>
            <Switch checked={detailHigh} onCheckedChange={setDetailHigh} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {imagePreviews.length > 0 && `${imagePreviews.length} image${imagePreviews.length > 1 ? 's' : ''} selected`}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setImagePreviews([]);
                setAnswer("");
                try { if (fileRef.current) (fileRef.current as HTMLInputElement).value = ""; } catch {}
              }} 
              disabled={!imagePreviews.length}
            >
              Clear All
            </Button>
            <Button 
              onClick={analyze} 
              disabled={loading || !imagePreviews.length}
              className="min-w-[100px]"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
