import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ApiKeyManager } from "@/components/api-key";
import { ChatUI } from "@/components/chat-ui";
import { VisionUI } from "@/components/vision-ui";
import { GenerateUI } from "@/components/generate-ui";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">xChat Playground</h1>
          <p className="text-muted-foreground">Test xAI chat and vision with your API key.</p>
        </div>
        <Card className="mb-6 p-4">
          <ApiKeyManager />
        </Card>
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="vision">Vision</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-4">
            <ChatUI />
          </TabsContent>
          <TabsContent value="vision" className="mt-4">
            <VisionUI />
          </TabsContent>
          <TabsContent value="generate" className="mt-4">
            <GenerateUI />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
