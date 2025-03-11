// client/src/app/(private)/dashboard/chats/[id]/page.tsx
"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import ChatInterface from "@/components/chats/chatinterface";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id; // Asegura que sea string

  const [chatTitle, setChatTitle] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchChatInfo();
  }, [id]);

  const fetchChatInfo = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/chat/${id}`);
      if (response.data && response.data.title) {
        setChatTitle(response.data.title);
      }
    } catch (error) {
      toast.error("Failed to fetch chat information");
      console.error("Error fetching chat info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async () => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await api.delete(`/chat/${id}`);
      toast.success("Chat deleted successfully");
      router.push("/dashboard/chats");
    } catch (error) {
      toast.error("Failed to delete chat");
      console.error("Error deleting chat:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/chats")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="ml-4 font-medium truncate">{chatTitle}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={deleteChat}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : id ? ( // Asegurar que `id` existe antes de renderizar
        <div className="flex-1">
          <ChatInterface chatId={id} />
        </div>
      ) : (
        <p className="text-center text-red-500">Invalid chat ID</p>
      )}
    </div>
  );
}
