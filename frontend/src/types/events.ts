import type { DocumentSource } from './rag';
import type { ToolType } from './tools';
import type { HitlInterruptPayload } from './hitl';

export interface StreamStartPayload {
  thread_id: string;
  run_id?: string;
}

export interface TokenPayload {
  content: string;
}

export interface ToolCallStartPayload {
  tool_id: string;
  tool_name: string;
  tool_type?: ToolType;
  args?: Record<string, unknown>;
}

export interface ToolCallEndPayload {
  tool_id: string;
  result: string;
  tool_name?: string;
  tool_type?: ToolType;
  execution_time_ms?: number;
}

export interface RagSourcesPayload {
  sources: DocumentSource[];
}

export interface StreamEndPayload {
  thread_id: string;
  content: string;
  sources?: DocumentSource[];
}

export interface StreamErrorPayload {
  detail: string;
  code?: string;
}

export type StreamEventType =
  | 'stream_start'
  | 'token'
  | 'tool_call_start'
  | 'tool_call_end'
  | 'rag_sources'
  | 'hitl_interrupt'
  | 'stream_end'
  | 'error';

export interface StreamCallbacks {
  onStart?: (data: StreamStartPayload) => void;
  onToken?: (data: TokenPayload) => void;
  onToolStart?: (data: ToolCallStartPayload) => void;
  onToolEnd?: (data: ToolCallEndPayload) => void;
  onSources?: (data: RagSourcesPayload) => void;
  onInterrupt?: (data: HitlInterruptPayload) => void;
  onEnd?: (data: StreamEndPayload) => void;
  onError?: (data: StreamErrorPayload) => void;
}
