import type { ChatRequest, ChatResponse } from '../types/chat';
import type {
  StreamCallbacks,
  StreamStartPayload,
  TokenPayload,
  ToolCallStartPayload,
  ToolCallEndPayload,
  RagSourcesPayload,
  StreamEndPayload,
  StreamErrorPayload,
} from '../types/events';
import type { Thread, ThreadDetail } from '../types/thread';
import type { IngestedDocument } from '../types/rag';

const API_BASE = '/api';

/**
 * Send a non-streaming chat message.
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Stream a chat message using Server-Sent Events (SSE).
 */
export async function streamChatMessage(
  request: ChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    const errorMsg = errorData.detail || `HTTP ${response.status}`;
    callbacks.onError?.({ detail: errorMsg, code: 'HTTP_ERROR' });
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processBlock = (block: string) => {
    const lines = block.split('\n');
    let eventName = 'message';
    let dataString = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataString = line.slice(5).trim();
      }
    }

    if (!dataString) return;

    try {
      const parsedData = JSON.parse(dataString);
      switch (eventName) {
        case 'stream_start':
          callbacks.onStart?.(parsedData as StreamStartPayload);
          break;
        case 'token':
          callbacks.onToken?.(parsedData as TokenPayload);
          break;
        case 'tool_call_start':
          callbacks.onToolStart?.(parsedData as ToolCallStartPayload);
          break;
        case 'tool_call_end':
          callbacks.onToolEnd?.(parsedData as ToolCallEndPayload);
          break;
        case 'rag_sources':
          callbacks.onSources?.(parsedData as RagSourcesPayload);
          break;
        case 'hitl_interrupt':
          callbacks.onInterrupt?.(parsedData as import('../types/hitl').HitlInterruptPayload);
          break;
        case 'stream_end':
          callbacks.onEnd?.(parsedData as StreamEndPayload);
          break;
        case 'error':
          callbacks.onError?.(parsedData as StreamErrorPayload);
          break;
        default:
          break;
      }
    } catch {
      // Ignore non-json payload parse errors
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (block.trim()) {
          processBlock(block);
        }
      }
    }

    if (buffer.trim()) {
      processBlock(buffer);
    }
  } catch (err: unknown) {
    if (signal?.aborted) {
      return; // Graceful abort
    }
    const message = err instanceof Error ? err.message : 'Streaming failed';
    callbacks.onError?.({ detail: message, code: 'STREAM_READ_ERROR' });
    throw err;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Resume an interrupted LangGraph execution stream with human decision and optional modified arguments.
 */
export async function resumeChatStream(
  request: import('../types/hitl').HitlResumeRequest,
  callbacks: StreamCallbacks = {},
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/resume/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Resume request failed: HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processBlock = (block: string) => {
    const lines = block.split('\n');
    let eventName = 'message';
    let dataString = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataString = line.slice(5).trim();
      }
    }

    if (!dataString) return;

    try {
      const parsedData = JSON.parse(dataString);
      switch (eventName) {
        case 'stream_start':
          callbacks.onStart?.(parsedData as StreamStartPayload);
          break;
        case 'token':
          callbacks.onToken?.(parsedData as TokenPayload);
          break;
        case 'tool_call_start':
          callbacks.onToolStart?.(parsedData as ToolCallStartPayload);
          break;
        case 'tool_call_end':
          callbacks.onToolEnd?.(parsedData as ToolCallEndPayload);
          break;
        case 'rag_sources':
          callbacks.onSources?.(parsedData as RagSourcesPayload);
          break;
        case 'hitl_interrupt':
          callbacks.onInterrupt?.(parsedData as import('../types/hitl').HitlInterruptPayload);
          break;
        case 'stream_end':
          callbacks.onEnd?.(parsedData as StreamEndPayload);
          break;
        case 'error':
          callbacks.onError?.(parsedData as StreamErrorPayload);
          break;
        default:
          break;
      }
    } catch {
      // Ignore
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (block.trim()) {
          processBlock(block);
        }
      }
    }

    if (buffer.trim()) {
      processBlock(buffer);
    }
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const message = err instanceof Error ? err.message : 'Resume stream failed';
    callbacks.onError?.({ detail: message, code: 'RESUME_READ_ERROR' });
    throw err;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fetch all conversation threads.
 */
export async function listThreads(): Promise<Thread[]> {
  const response = await fetch(`${API_BASE}/threads`);
  if (!response.ok) {
    throw new Error(`Failed to list threads: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Create a new conversation thread.
 */
export async function createThread(title?: string): Promise<Thread> {
  const response = await fetch(`${API_BASE}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create thread: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Get thread details including past messages.
 */
export async function getThreadDetail(threadId: string): Promise<ThreadDetail> {
  const response = await fetch(`${API_BASE}/threads/${threadId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch thread ${threadId}: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Update a thread's title.
 */
export async function updateThreadTitle(
  threadId: string,
  title: string
): Promise<Thread> {
  const response = await fetch(`${API_BASE}/threads/${threadId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update thread: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Delete a thread.
 */
export async function deleteThread(threadId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/threads/${threadId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete thread: HTTP ${response.status}`);
  }
}

/**
 * Upload a document to the RAG knowledge base.
 */
export async function uploadDocument(file: File): Promise<IngestedDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(err.detail || 'Failed to upload document');
  }

  return response.json();
}

/**
 * List all indexed documents in the knowledge base.
 */
export async function listDocuments(): Promise<IngestedDocument[]> {
  const response = await fetch(`${API_BASE}/documents`);
  if (!response.ok) {
    throw new Error(`Failed to list documents: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * List all active tools registered in the backend registry.
 */
export async function listTools(): Promise<import('../types/tools').ToolDefinition[]> {
  const response = await fetch(`${API_BASE}/tools`);
  if (!response.ok) {
    throw new Error(`Failed to list tools: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * List all configured MCP servers and statuses.
 */
export async function listMCPServers(): Promise<import('../types/mcp').MCPServerConfig[]> {
  const response = await fetch(`${API_BASE}/mcp/servers`);
  if (!response.ok) {
    throw new Error(`Failed to list MCP servers: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Add or update an MCP server configuration.
 */
export async function addOrUpdateMCPServer(
  server: import('../types/mcp').MCPServerConfig
): Promise<import('../types/mcp').MCPServerConfig> {
  const response = await fetch(`${API_BASE}/mcp/servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(server),
  });
  if (!response.ok) {
    throw new Error(`Failed to save MCP server: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Delete an MCP server configuration.
 */
export async function deleteMCPServer(serverId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/mcp/servers/${serverId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete MCP server: HTTP ${response.status}`);
  }
}

/**
 * Reconnect to MCP servers and reload tools.
 */
export async function reloadMCPServers(): Promise<{ success: boolean; tools_discovered: number }> {
  const response = await fetch(`${API_BASE}/mcp/reload`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to reload MCP servers: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * List all stored long-term memories for a user.
 */
export async function listMemories(userId: string = 'default_user'): Promise<import('../types/memory').MemoryEntry[]> {
  const response = await fetch(`${API_BASE}/memory?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Failed to list memories: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Manually add a new long-term memory entry.
 */
export async function createMemory(text: string, userId: string = 'default_user'): Promise<import('../types/memory').MemoryEntry> {
  const response = await fetch(`${API_BASE}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, user_id: userId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create memory: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Delete a specific long-term memory by ID.
 */
export async function deleteMemory(memoryId: string, userId: string = 'default_user'): Promise<void> {
  const response = await fetch(`${API_BASE}/memory/${memoryId}?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete memory: HTTP ${response.status}`);
  }
}

/**
 * Update an existing long-term memory.
 */
export async function updateMemory(
  memoryId: string,
  text: string,
  userId: string = 'default_user'
): Promise<import('../types/memory').MemoryEntry> {
  const response = await fetch(`${API_BASE}/memory/${memoryId}?user_id=${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update memory: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Clear all stored memories for a user.
 */
export async function clearAllMemories(userId: string = 'default_user'): Promise<number> {
  const response = await fetch(`${API_BASE}/memory/clear?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to clear memories: HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.cleared_count || 0;
}

/**
 * Run conflict resolution and memory consolidation.
 */
export async function cleanupMemories(userId: string = 'default_user'): Promise<number> {
  const response = await fetch(`${API_BASE}/memory/cleanup?user_id=${encodeURIComponent(userId)}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to cleanup memories: HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.clean_memories_count || 0;
}

/**
 * Health check endpoint.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
