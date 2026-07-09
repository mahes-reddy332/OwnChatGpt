"use client";

import { Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ChatBubble from "@/components/chat/ChatBubble";

interface Message {
  role: "user" | "assistant";
  content: string;
  files?: { name: string; type: string; size: number }[];
  images?: { url: string; prompt?: string }[];
}

export default function ShareChatView({
  title,
  model,
  messages,
}: {
  title: string;
  model: string;
  messages: Message[];
}) {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-dark-border/50 bg-dark-bg/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-dark-hover transition-colors text-gray-500 hover:text-gray-300"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Bot size={14} className="text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-200">{title}</h1>
              <p className="text-[11px] text-gray-600">Shared conversation &middot; {model}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="pb-12">
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            files={msg.files}
            images={msg.images}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 bg-dark-bg/80 backdrop-blur-md border-t border-dark-border/50">
        <div className="max-w-3xl mx-auto py-3 px-4 text-center">
          <p className="text-xs text-gray-600">
            This is a shared conversation.{" "}
            <Link href="/" className="text-accent hover:underline">
              Start your own chat
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
