// client/src/app/(private)/dashboard/chats/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Chat {
  _id: string;
  uuid: string;
  title: string;
  updatedAt: string;
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingAll, setDeletingAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/chat");
      setChats(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch chats");
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await api.post("/chat", {
        content: "Hello, I'm starting a new conversation.",
        role: "user",
      });

      if (response.data && response.data.chatId) {
        router.push(`/dashboard/chats/${response.data.chatId}`);
      }
    } catch (error) {
      toast.error("Failed to create a new chat");
      console.error("Error creating new chat:", error);
    }
  };

  const deleteChat = async (uuid: string) => {
    try {
      await api.delete(`/chat/${uuid}`);
      toast.success("Chat deleted successfully");
      // Update the chats list
      setChats(chats.filter((chat) => chat.uuid !== uuid));
    } catch (error) {
      toast.error("Failed to delete chat");
      console.error("Error deleting chat:", error);
    }
  };

  const deleteAllChats = async () => {
    try {
      setDeletingAll(true);
      await api.delete("/chat");
      setChats([]);
      toast.success("All chats deleted successfully");
    } catch (error) {
      toast.error("Failed to delete all chats");
      console.error("Error deleting all chats:", error);
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Conversations</h1>
        <div className="flex gap-2">
          <Button onClick={createNewChat} className="gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={chats.length === 0 || deletingAll}
                className="gap-2"
              >
                {deletingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete all your chat
                  conversations and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAllChats}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-muted-foreground mb-4">
            Start a new chat to begin a conversation
          </p>
          <Button onClick={createNewChat}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <Card
              key={chat.uuid}
              className="cursor-pointer overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="flex flex-col h-full"
                onClick={() => router.push(`/dashboard/chats/${chat.uuid}`)}
              >
                <CardContent className="p-4 flex-1">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate">
                      {chat.title}
                    </CardTitle>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this conversation?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.uuid);
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated:{" "}
                    {format(new Date(chat.updatedAt), "MMM d, yyyy HH:mm")}
                  </p>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
