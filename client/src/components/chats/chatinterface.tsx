// client/src/components/chats/chatinterface.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { AxiosResponse } from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Paperclip, Trash } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatInterfaceProps {
  chatId?: string;
}

// Define more specific response types
interface MessageResponse {
  message: string;
  newMessage?: Message;
  aiResponse?: Message;
}

interface NewChatResponse {
  message?: string;
  chatId: string;
}

interface ChatMessagesResponse {
  messages: Message[];
}

interface UploadResponse {
  message: string;
  documentId: string;
  chatId: string;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      setIsLoading(true);
      const response = await api.get<ChatMessagesResponse>(`/chat/${chatId}`);
      if (response.data && response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      toast.error("Failed to fetch messages");
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    try {
      setIsLoading(true);

      // Add the user message to the UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // If chatId exists, send message to existing chat
      if (chatId) {
        // If there's a file, use the upload endpoint
        if (file) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("content", input);
          formData.append("role", "user");

          const response = await api.post<UploadResponse>(
            `/chat/${chatId}/upload`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          setFile(null);

          // Fetch messages after upload to get the AI response
          fetchMessages();
        } else {
          // Otherwise just send a regular message
          const response = await api.post<MessageResponse>(
            `/chat/${chatId}/messages`,
            {
              content: input,
              role: "user",
            }
          );

          // Add AI response to messages if returned
          if (response.data && response.data.aiResponse) {
            // Make sure aiResponse is not undefined before adding it to messages
            const aiResponse = response.data.aiResponse;
            if (aiResponse) {
              setMessages((prev) => [...prev, aiResponse]);
            }
          }
        }
      } else {
        // Create a new chat
        if (file) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("content", input);
          formData.append("role", "user");

          const response = await api.post<UploadResponse>(
            `/chat/upload`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (response.data && response.data.chatId) {
            window.location.href = `/dashboard/chats/${response.data.chatId}`;
          }

          setFile(null);
        } else {
          const response = await api.post<NewChatResponse>("/chat", {
            content: input,
            role: "user",
          });

          // Handle the response from creating a new chat
          if (response.data && response.data.chatId) {
            // Redirect to the new chat page
            window.location.href = `/dashboard/chats/${response.data.chatId}`;
          }
        }
      }

      // Clear input after sending
      setInput("");
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`w-full ${
                  message.role === "assistant" ? "bg-muted" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-primary h-8 w-8 flex items-center justify-center text-primary-foreground font-semibold">
                      {message.role === "user" ? "U" : "AI"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {message.role === "user" ? "You" : "Assistant"}
                      </div>
                      <div className="whitespace-pre-wrap mt-1">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        {file && (
          <div className="flex items-center gap-2 bg-muted p-2 rounded mb-2">
            <span className="text-sm truncate flex-1">{file.name}</span>
            <Button variant="ghost" size="icon" onClick={removeFile}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[80px] max-h-[200px]"
          />
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={triggerFileInput}
              title="Attach PDF"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              type="button"
              onClick={sendMessage}
              disabled={isLoading || (!input.trim() && !file)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
      </div>
    </div>
  );
}
