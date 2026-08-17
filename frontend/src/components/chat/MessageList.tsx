import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/chat';
import { Message } from './Message';
import { Loading } from '../common/Loading';
import { Bot } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onResumeDecision?: (decision: 'approve' | 'reject', modifiedArgs?: Record<string, unknown>) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onResumeDecision,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-6 shadow-[var(--shadow-md)]">
          <Bot size={32} className="text-[var(--color-text-primary)]" />
        </div>
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
          How can I help you today?
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-md">
          I'm an Agentic AI assistant with tools, RAG, and Long-Term Memory. Ask me anything, and I'll do my best to help you out.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 w-full flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col pb-4">
        {messages.map(msg => (
          <Message
            key={msg.id}
            message={msg}
            onResumeDecision={onResumeDecision}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-6">
            <Loading />
          </div>
        )}
        <div ref={endOfMessagesRef} className="h-4" />
      </div>
    </div>
  );
};
