import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatStatus } from '../types/chat';
import type { DocumentSource } from '../types/rag';
import type { ToolCallInfo } from '../types/tools';
import { streamChatMessage, resumeChatStream, getThreadDetail } from '../services/api';

export function useChat(
  activeThreadId: string | null,
  onMessageSentOrCompleted?: () => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [disabledTools, setDisabledTools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('disabled_tools');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const toggleTool = useCallback((toolName: string) => {
    setDisabledTools(prev => {
      const next = prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName];
      try {
        localStorage.setItem('disabled_tools', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Load message history when activeThreadId changes
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    async function loadThreadHistory() {
      try {
        setStatus('loading');
        const detail = await getThreadDetail(activeThreadId!);
        if (isMounted) {
          const formatted: ChatMessage[] = (detail.messages || []).map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
          setMessages(formatted);
          setStatus('idle');
        }
      } catch {
        if (isMounted) {
          setMessages([]);
          setStatus('idle');
        }
      }
    }

    loadThreadHistory();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [activeThreadId]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages(prev =>
      prev.map(msg => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
    );
    setStatus('idle');
  }, []);

  const send = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || status === 'loading' || status === 'streaming') return;

      const threadIdToUse = activeThreadId || crypto.randomUUID();

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      const assistantMessageId = crypto.randomUUID();
      const assistantPlaceholder: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        sources: [],
        tool_calls: [],
      };

      let pendingSources: DocumentSource[] = [];
      let pendingTools: ToolCallInfo[] = [];

      setMessages(prev => [...prev, userMessage, assistantPlaceholder]);
      setStatus('streaming');
      setError(null);

      try {
        await streamChatMessage(
          {
            message: trimmed,
            thread_id: threadIdToUse,
            disabled_tools: disabledTools,
          },
          {
            onToken: data => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                )
              );
            },
            onToolStart: data => {
              const newTool: ToolCallInfo = {
                id: data.tool_id || crypto.randomUUID(),
                name: data.tool_name,
                args: (data.args as Record<string, unknown>) || {},
                tool_type: data.tool_type || 'builtin',
                status: 'running',
              };
              pendingTools = [...pendingTools, newTool];
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, tool_calls: [...pendingTools] }
                    : msg
                )
              );
            },
            onToolEnd: data => {
              pendingTools = pendingTools.map(t =>
                t.id === data.tool_id || (!t.result && t.status === 'running')
                  ? {
                      ...t,
                      result: data.result,
                      tool_type: data.tool_type || t.tool_type || 'builtin',
                      execution_time_ms: data.execution_time_ms,
                      status: 'completed',
                    }
                  : t
              );
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, tool_calls: [...pendingTools] }
                    : msg
                )
              );
            },
            onSources: data => {
              if (data.sources) {
                pendingSources = data.sources;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, sources: data.sources }
                      : msg
                  )
                );
              }
            },
            onInterrupt: data => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        interrupt: data,
                        isStreaming: false,
                        tool_calls: [...pendingTools],
                      }
                    : msg
                )
              );
              setStatus('waiting_approval');
            },
            onEnd: data => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: data.content || msg.content,
                        sources: data.sources || pendingSources,
                        tool_calls: pendingTools.length > 0 ? pendingTools : msg.tool_calls,
                        isStreaming: false,
                      }
                    : msg
                )
              );
              setStatus('idle');
              abortControllerRef.current = null;
              onMessageSentOrCompleted?.();
            },
            onError: data => {
              setError(data.detail);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              setStatus('error');
              abortControllerRef.current = null;
              onMessageSentOrCompleted?.();
            },
          },
          controller.signal
        );
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        setStatus('error');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [activeThreadId, status, onMessageSentOrCompleted]
  );

  const resumeDecision = useCallback(
    async (decision: 'approve' | 'reject', modifiedArgs?: Record<string, unknown>) => {
      if (!activeThreadId) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setStatus('streaming');
      setError(null);

      // Find the last assistant message with interrupt and clear its interrupt card
      setMessages(prev =>
        prev.map(msg =>
          msg.interrupt
            ? { ...msg, interrupt: undefined, isStreaming: true }
            : msg
        )
      );

      try {
        await resumeChatStream(
          {
            thread_id: activeThreadId,
            decision,
            modified_args: modifiedArgs,
          },
          {
            onToken: data => {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: last.content + data.content },
                  ];
                }
                return prev;
              });
            },
            onEnd: data => {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    {
                      ...last,
                      content: data.content || last.content,
                      isStreaming: false,
                    },
                  ];
                }
                return prev;
              });
              setStatus('idle');
              onMessageSentOrCompleted?.();
            },
            onError: data => {
              setError(data.detail);
              setStatus('error');
              onMessageSentOrCompleted?.();
            },
          },
          controller.signal
        );
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to resume');
        setStatus('error');
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [activeThreadId, onMessageSentOrCompleted]
  );

  const dismissError = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  return {
    messages,
    status,
    error,
    disabledTools,
    toggleTool,
    send,
    resumeDecision,
    stopStreaming,
    dismissError,
  };
}
