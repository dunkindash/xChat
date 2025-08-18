import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatUI } from "@/components/chat-ui";
import { VisionUI } from "@/components/vision-ui";
import { GenerateUI } from "@/components/generate-ui";
import { SettingsPage } from "@/components/settings-page";
import { ApiExplorer } from "@/components/api-explorer";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiStatusIndicator } from "@/components/api-status-indicator";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">xChat Playground</h1>
            <p className="text-muted-foreground">Test xAI chat and vision with your API key.</p>
          </div>
          <div className="flex items-center gap-3">
            <ApiStatusIndicator />
            <ThemeToggle />
          </div>
        </div>
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="vision">Vision</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="api-explorer">API Explorer</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
          <TabsContent value="api-explorer" className="mt-4">
            <ApiExplorer />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <SettingsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
