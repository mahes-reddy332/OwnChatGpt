import type { DocumentSource } from './rag';
import type { ToolCallInfo } from './tools';
import type { HitlInterruptPayload } from './hitl';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: DocumentSource[];
  tool_calls?: ToolCallInfo[];
  interrupt?: HitlInterruptPayload;
}

export interface ChatRequest {
  message: string;
  thread_id?: string;
  disabled_tools?: string[];
}

export interface ChatResponse {
  message: string;
  thread_id: string;
  role: 'assistant';
  sources?: DocumentSource[];
  tool_calls?: ToolCallInfo[];
  interrupt?: HitlInterruptPayload;
}

export type ChatStatus = 'idle' | 'loading' | 'streaming' | 'waiting_approval' | 'error';
