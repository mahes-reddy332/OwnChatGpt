"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bot, Code2, FileSearch, Menu, Share2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import LoadingDots from "@/components/chat/LoadingDots";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ModelSelector from "@/components/chat/ModelSelector";
import ShareDialog from "@/components/chat/ShareDialog";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import type { LLMModel } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  files?: { name: string; type: string; size: number }[];
  images?: { url: string; prompt?: string }[];
}

interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: string;
  shared?: boolean;
  shareId?: string;
  updatedAt: string;
}

const DEFAULT_MODEL = { model: "gemini-2.0-flash", provider: "gemini" };

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { capabilities, error: backendError } = useBackendHealth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [shareChat, setShareChat] = useState<Chat | null>(null);

  const activeChat = chats.find((chat) => chat._id === activeChatId) || null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    fetch("/api/models")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModels(data);
          setSelectedModel({ model: data[0].id, provider: data[0].provider });
        }
      })
      .catch(() => toast.error("Failed to load models"));

    fetch("/api/chat")
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          return;
        }
        setChats(data.map((chat) => ({ ...chat, messages: chat.messages || [] })));
        if (data[0]?._id) {
          setActiveChatId(data[0]._id);
        }
      })
      .catch(() => toast.error("Failed to load chat history"));
  }, [status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, loading]);

  async function loadChat(id: string) {
    setActiveChatId(id);
    const existing = chats.find((chat) => chat._id === id);
    if (existing?.messages?.length) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to open chat");
      }
      setChats((current) => current.map((chat) => (chat._id === id ? { ...chat, ...data } : chat)));
      if (data.model && data.provider) {
        setSelectedModel({ model: data.model, provider: data.provider });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open chat");
    }
  }

  function startNewChat() {
    setActiveChatId(null);
  }

  async function deleteChat(id: string) {
    try {
      const response = await fetch(`/api/chat/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete chat");
      }
      setChats((current) => current.filter((chat) => chat._id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete chat");
    }
  }

  async function handleSend(message: string, files?: any[], mode?: string) {
    if (loading) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: message,
      files: files?.map((file) => ({ name: file.name, type: file.type, size: file.size })),
    };

    if (activeChatId) {
      setChats((current) => current.map((chat) => (
        chat._id === activeChatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
      )));
    }

    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          chatId: activeChatId,
          model: selectedModel.model,
          provider: selectedModel.provider,
          files: files?.map((file) => ({
            uploadId: file.uploadId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: file.content,
          })),
          researchMode: mode === "research",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };

      setChats((current) => {
        const exists = current.some((chat) => chat._id === data.chatId);
        if (!exists) {
          return [{
            _id: data.chatId,
            title: message.slice(0, 60),
            messages: [userMessage, assistantMessage],
            model: data.model,
            provider: data.provider,
            updatedAt: new Date().toISOString(),
          }, ...current];
        }

        return current.map((chat) => {
          if (chat._id !== data.chatId) {
            return chat;
          }
          const baseMessages = activeChatId ? chat.messages.slice(0, -1) : chat.messages;
          return {
            ...chat,
            title: chat.title || message.slice(0, 60),
            model: data.model,
            provider: data.provider,
            messages: [...baseMessages, userMessage, assistantMessage],
            updatedAt: new Date().toISOString(),
          };
        });
      });

      setActiveChatId(data.chatId);
    } catch (error) {
      if (activeChatId) {
        setChats((current) => current.map((chat) => (
          chat._id === activeChatId ? { ...chat, messages: chat.messages.slice(0, -1) } : chat
        )));
      }
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  const quickPrompts = [
    { icon: Code2, text: "Debug this Python traceback", desc: "Trace the root cause fast" },
    { icon: Sparkles, text: "Explain this codebase", desc: "Get architecture help" },
    { icon: Zap, text: "Design a FastAPI endpoint", desc: "Schema, validation, errors" },
    { icon: FileSearch, text: "Review this uploaded file", desc: "Summarize attached docs" },
  ];

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] flex-col">
      {backendError && !capabilities.has_upload && (
        <div className="flex items-center gap-3 bg-yellow-500/15 border border-yellow-500/30 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{backendError}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="animate-slide-in-left">
            <ChatSidebar
              chats={chats.map((chat) => ({ _id: chat._id, title: chat.title, updatedAt: chat.updatedAt }))}
              activeChatId={activeChatId}
              onSelectChat={loadChat}
              onNewChat={startNewChat}
              onDeleteChat={deleteChat}
            />
          </div>
        )}

        <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[color:var(--surface-elevated)]/85 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
            >
              <Menu size={18} />
            </button>
            {models.length > 0 && (
              <ModelSelector
                models={models}
                selected={selectedModel}
                onChange={(model, provider) => setSelectedModel({ model, provider })}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            {activeChatId && (
              <button
                type="button"
                onClick={() => setShareChat(activeChat)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              >
                <Share2 size={14} />
                Share
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {(!activeChatId || activeChat?.messages.length === 0) && !loading && (
            <div className="flex h-full items-center justify-center px-6 animate-fade-in">
              <div className="max-w-2xl text-center">
                <div className="relative mx-auto mb-8 h-20 w-20">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/20 to-emerald-300/20 blur-xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-elevated)]">
                    <Bot size={32} className="text-[var(--accent)]" />
                  </div>
                </div>
                <h1 className="mb-3 text-3xl font-semibold tracking-tight">Ask the AI about code, docs, and files</h1>
                <p className="mx-auto mb-8 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                  Chat against Gemini through the FastAPI backend, keep a searchable history in MongoDB, and upload PDFs, TXT, or DOCX files for analysis.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt.text}
                      type="button"
                      onClick={() => handleSend(prompt.text)}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-primary)] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] hover:shadow-glow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <prompt.icon size={16} className="mt-0.5 text-[var(--accent)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{prompt.text}</p>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">{prompt.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeChat?.messages.map((message, index) => (
            <ChatBubble
              key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
              role={message.role}
              content={message.content}
              files={message.files}
              images={message.images}
            />
          ))}

          {loading && <LoadingDots />}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={handleSend} disabled={loading} />
      </main>
      </div>

      {shareChat && (
        <ShareDialog
          chatId={shareChat._id}
          isShared={shareChat.shared || false}
          shareUrl={shareChat.shareId ? `${window.location.origin}/share/${shareChat.shareId}` : undefined}
          onClose={() => setShareChat(null)}
        />
      )}
    </div>
  );
}
