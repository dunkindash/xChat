"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <div className="relative">
        <div className="typing-bubble rounded-md px-3 py-2">
          <div className="typing-dots flex items-end gap-1">
            <span className="dot delay-0" />
            <span className="dot delay-1" />
            <span className="dot delay-2" />
          </div>
        </div>
        <div className="bubble-shimmer" />
      </div>
    </div>
  );
}


