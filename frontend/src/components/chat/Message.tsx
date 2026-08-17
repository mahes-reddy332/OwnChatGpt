import React from 'react';
import type { ChatMessage } from '../../types/chat';
import { SourceCitation } from '../rag/SourceCitation';
import { ToolCall } from '../tools/ToolCall';
import { HitlApprovalCard } from '../hitl/HitlApprovalCard';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageActions } from './MessageActions';
import { Sparkles } from 'lucide-react';

interface MessageProps {
  message: ChatMessage;
  onResumeDecision?: (decision: 'approve' | 'reject', modifiedArgs?: Record<string, unknown>) => void;
}

export const Message: React.FC<MessageProps> = ({ message, onResumeDecision }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  if (isUser) {
    return (
      <div className="flex w-full justify-end mb-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)] px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-sm">
          <div className="whitespace-pre-wrap break-words leading-relaxed font-sans text-sm">
            {message.content}
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] text-right mt-1.5 font-mono">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start mb-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="w-full flex items-start space-x-3.5 max-w-full">
        {/* Assistant Avatar Emblem */}
        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center text-cyan-400 shrink-0 mt-1 shadow-sm">
          <Sparkles size={16} />
        </div>

        {/* Assistant Response Body */}
        <div className="flex-1 min-w-0">
          {/* Assistant Name Label */}
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="font-bold text-xs text-[var(--color-text-primary)] tracking-tight">
              Nexus AI
            </span>
            {isStreaming && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
                Generating
              </span>
            )}
          </div>

          {/* Tool Execution Cards */}
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {message.tool_calls.map((tc, idx) => (
                <ToolCall key={tc.id || idx} toolCall={tc} />
              ))}
            </div>
          )}

          {/* Human-in-the-Loop Interrupt Approval Card */}
          {message.interrupt && onResumeDecision && (
            <div className="mb-3">
              <HitlApprovalCard
                interrupt={message.interrupt}
                onDecision={onResumeDecision}
              />
            </div>
          )}

          {/* Markdown Content or Initial Loading Animation */}
          {message.content ? (
            <MarkdownRenderer
              content={message.content}
              isStreaming={isStreaming}
            />
          ) : isStreaming ? (
            <div className="flex items-center space-x-2 py-2 text-[var(--color-text-secondary)]">
              <span
                className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
              <span className="text-xs text-[var(--color-text-tertiary)] font-mono ml-1">
                Thinking...
              </span>
            </div>
          ) : null}

          {/* RAG Source Citations */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3">
              <SourceCitation sources={message.sources} />
            </div>
          )}

          {/* Action Toolbar */}
          {message.content && !isStreaming && (
            <MessageActions
              content={message.content}
              timestamp={message.timestamp}
            />
          )}
        </div>
      </div>
    </div>
  );
};
