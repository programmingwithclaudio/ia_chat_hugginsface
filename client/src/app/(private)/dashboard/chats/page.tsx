// client/src/app/(private)/dashboard/chats/page.tsx
"use client";

import { ChatInterface } from "@/components/chats/chatinterface";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Loader2 } from "lucide-react";
// import { useRouter } from "next/navigation";

export default function ChatsPage() {
  const { user, isLoading } = useCurrentUser();
  // const router = useRouter();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-4xl mx-auto flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ChatInterface />
      </div>
    </div>
  );
}
