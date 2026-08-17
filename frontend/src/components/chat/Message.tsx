import React, { useState } from 'react';
import type { ChatMessage } from '../../types/chat';
import { SourceCitation } from '../rag/SourceCitation';
import { ToolCall } from '../tools/ToolCall';
import { HitlApprovalCard } from '../hitl/HitlApprovalCard';

interface MessageProps {
  message: ChatMessage;
  onResumeDecision?: (decision: 'approve' | 'reject', modifiedArgs?: Record<string, unknown>) => void;
}

export const Message: React.FC<MessageProps> = ({ message, onResumeDecision }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const [showTime, setShowTime] = useState(false);

  return (
    <div
      className={`flex w-full mb-6 ${
        isUser ? 'justify-end' : 'justify-start'
      } transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-[var(--radius-lg)] px-4 py-3 relative ${
          isUser
            ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] rounded-tr-[var(--radius-sm)] shadow-sm'
            : 'bg-transparent text-[var(--color-text-primary)]'
        }`}
      >
        {/* Tool Execution Cards */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="space-y-1.5 mb-2.5">
            {message.tool_calls.map((tc, idx) => (
              <ToolCall key={tc.id || idx} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Human-in-the-Loop Interrupt Approval Card */}
        {message.interrupt && onResumeDecision && (
          <HitlApprovalCard
            interrupt={message.interrupt}
            onDecision={onResumeDecision}
          />
        )}

        {/* Message Content or Loading Indicator */}
        {message.content ? (
          <div className="whitespace-pre-wrap break-words leading-relaxed font-sans text-sm">
            {message.content}
            {isStreaming && (
              <span
                className="inline-block w-1.5 h-4 ml-1.5 bg-[var(--color-text-primary)] align-middle animate-pulse rounded-[1px]"
                aria-hidden="true"
              />
            )}
          </div>
        ) : isStreaming ? (
          <div className="flex items-center space-x-1.5 py-1 text-[var(--color-text-secondary)]">
            <span
              className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        ) : null}

        {/* RAG Source Citations */}
        {message.sources && message.sources.length > 0 && (
          <SourceCitation sources={message.sources} />
        )}

        <div
          className={`absolute text-xs text-[var(--color-text-tertiary)] transition-opacity duration-200 ${
            showTime ? 'opacity-100' : 'opacity-0'
          } ${isUser ? 'right-0 -bottom-5' : 'left-0 -bottom-5'}`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
