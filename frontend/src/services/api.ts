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
import type { User, UserPreferences, SessionInfo } from '../types/auth';

/**
 * Authoritative API base URL:
 * Resolves VITE_API_URL if configured, otherwise defaults to '/api' for same-origin proxy.
 */
const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
const API_BASE = rawApiUrl
  ? rawApiUrl.endsWith('/api')
    ? rawApiUrl
    : `${rawApiUrl.replace(/\/$/, '')}/api`
  : '/api';

/**
 * Helper to retrieve CSRF token from document cookie.
 */
export function getCsrfToken(): string {
  const match = document.cookie.match(new RegExp('(^|;\\s*)nexus_csrf=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}

/**
 * Build headers for API requests including anti-CSRF token on mutating actions.
 */
function buildHeaders(isJson: boolean = true, isMutating: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (isMutating) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }
  return headers;
}

/**
 * Safely parse error messages from server response with developer diagnostics.
 */
async function parseErrorDetail(response: Response, defaultMessage: string): Promise<string> {
  try {
    const text = await response.text();
    if (!text) {
      return `${defaultMessage} (HTTP ${response.status})`;
    }
    try {
      const data = JSON.parse(text);
      return data.detail || data.message || `${defaultMessage} (HTTP ${response.status})`;
    } catch {
      console.error(`[Nexus API Error] HTTP ${response.status}:`, text.slice(0, 300));
      return `${defaultMessage} (HTTP ${response.status}: ${response.statusText || 'Server Error'})`;
    }
  } catch {
    return `${defaultMessage} (HTTP ${response.status})`;
  }
}

/* =========================================================================
   AUTHENTICATION API
   ========================================================================= */

export async function signupApi(
  email: string,
  password: string,
  displayName: string,
  avatarUrl?: string
): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, false), // CSRF exempt bootstrap
    body: JSON.stringify({
      email,
      password,
      display_name: displayName,
      avatar_url: avatarUrl,
    }),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to sign up');
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function loginApi(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, false), // CSRF exempt bootstrap
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Invalid credentials');
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
}

export async function logoutAllApi(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout-all`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
}

export async function getMeApi(): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include',
    headers: buildHeaders(true, false),
  });

  if (!response.ok) {
    throw new Error(`Unauthenticated: HTTP ${response.status}`);
  }

  return response.json();
}

export async function updateProfileApi(
  displayName?: string,
  avatarUrl?: string
): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    credentials: 'include',
    headers: buildHeaders(true, true),
    body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to update profile');
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function getPreferencesApi(): Promise<UserPreferences> {
  const response = await fetch(`${API_BASE}/auth/preferences`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to load preferences: HTTP ${response.status}`);
  }

  return response.json();
}

export async function updatePreferencesApi(
  prefs: Partial<UserPreferences>
): Promise<UserPreferences> {
  const response = await fetch(`${API_BASE}/auth/preferences`, {
    method: 'PUT',
    credentials: 'include',
    headers: buildHeaders(true, true),
    body: JSON.stringify(prefs),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to update preferences');
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function listSessionsApi(): Promise<SessionInfo[]> {
  const response = await fetch(`${API_BASE}/auth/sessions`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to list sessions: HTTP ${response.status}`);
  }

  return response.json();
}

export async function touchSessionApi(): Promise<void> {
  await fetch(`${API_BASE}/auth/touch-session`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
}

export async function forgotPasswordApi(email: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, false),
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  return data.message || 'Password reset request submitted.';
}

/* =========================================================================
   CHAT & STREAMING API
   ========================================================================= */

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Chat request failed');
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function streamChatMessage(
  request: ChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const headers = buildHeaders(true, true);
  headers['Accept'] = 'text/event-stream';

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, `Streaming HTTP ${response.status}`);
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
    if (signal?.aborted) {
      return;
    }
    const message = err instanceof Error ? err.message : 'Streaming failed';
    callbacks.onError?.({ detail: message, code: 'STREAM_READ_ERROR' });
    throw err;
  } finally {
    reader.releaseLock();
  }
}

export async function resumeChatStream(
  request: import('../types/hitl').HitlResumeRequest,
  callbacks: StreamCallbacks = {},
  signal?: AbortSignal
): Promise<void> {
  const headers = buildHeaders(true, true);
  headers['Accept'] = 'text/event-stream';

  const response = await fetch(`${API_BASE}/chat/resume/stream`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, `Resume request failed: HTTP ${response.status}`);
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

/* =========================================================================
   THREADS API
   ========================================================================= */

export async function listThreads(): Promise<Thread[]> {
  const response = await fetch(`${API_BASE}/threads`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to list threads: HTTP ${response.status}`);
  }
  return response.json();
}

export async function createThread(title?: string): Promise<Thread> {
  const response = await fetch(`${API_BASE}/threads`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to create thread');
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function getThreadDetail(threadId: string): Promise<ThreadDetail> {
  const response = await fetch(`${API_BASE}/threads/${threadId}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch thread ${threadId}: HTTP ${response.status}`);
  }
  return response.json();
}

export async function updateThreadTitle(
  threadId: string,
  title: string
): Promise<Thread> {
  const response = await fetch(`${API_BASE}/threads/${threadId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: buildHeaders(true, true),
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to update thread');
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function deleteThread(threadId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/threads/${threadId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to delete thread');
    throw new Error(errorMsg);
  }
}

/* =========================================================================
   DOCUMENTS & RAG API
   ========================================================================= */

export async function uploadDocument(file: File): Promise<IngestedDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const headers = buildHeaders(false, true);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await parseErrorDetail(response, 'Failed to upload document');
    throw new Error(err);
  }

  return response.json();
}

export async function listDocuments(): Promise<IngestedDocument[]> {
  const response = await fetch(`${API_BASE}/documents`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to list documents: HTTP ${response.status}`);
  }
  return response.json();
}

/* =========================================================================
   TOOLS & MCP API
   ========================================================================= */

export async function listTools(): Promise<import('../types/tools').ToolDefinition[]> {
  const response = await fetch(`${API_BASE}/tools`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to list tools: HTTP ${response.status}`);
  }
  return response.json();
}

export async function listMCPServers(): Promise<import('../types/mcp').MCPServerConfig[]> {
  const response = await fetch(`${API_BASE}/mcp/servers`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to list MCP servers: HTTP ${response.status}`);
  }
  return response.json();
}

export async function addOrUpdateMCPServer(
  server: import('../types/mcp').MCPServerConfig
): Promise<import('../types/mcp').MCPServerConfig> {
  const response = await fetch(`${API_BASE}/mcp/servers`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
    body: JSON.stringify(server),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to save MCP server');
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function deleteMCPServer(serverId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/mcp/servers/${serverId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to delete MCP server');
    throw new Error(errorMsg);
  }
}

export async function reloadMCPServers(): Promise<{ success: boolean; tools_discovered: number }> {
  const response = await fetch(`${API_BASE}/mcp/reload`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to reload MCP servers');
    throw new Error(errorMsg);
  }
  return response.json();
}

/* =========================================================================
   LONG-TERM MEMORY API
   ========================================================================= */

export async function listMemories(): Promise<import('../types/memory').MemoryEntry[]> {
  const response = await fetch(`${API_BASE}/memory`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to list memories: HTTP ${response.status}`);
  }
  return response.json();
}

export async function createMemory(text: string, category: string = 'fact'): Promise<import('../types/memory').MemoryEntry> {
  const response = await fetch(`${API_BASE}/memory`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
    body: JSON.stringify({ text, category }),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to create memory');
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function deleteMemory(memoryId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/memory/${memoryId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to delete memory');
    throw new Error(errorMsg);
  }
}

export async function updateMemory(
  memoryId: string,
  text: string,
  category?: string
): Promise<import('../types/memory').MemoryEntry> {
  const response = await fetch(`${API_BASE}/memory/${memoryId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: buildHeaders(true, true),
    body: JSON.stringify({ text, category }),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to update memory');
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function clearAllMemories(): Promise<number> {
  const response = await fetch(`${API_BASE}/memory/clear`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to clear memories');
    throw new Error(errorMsg);
  }
  const data = await response.json();
  return data.cleared_count || 0;
}

export async function cleanupMemories(): Promise<number> {
  const response = await fetch(`${API_BASE}/memory/cleanup`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true, true),
  });
  if (!response.ok) {
    const errorMsg = await parseErrorDetail(response, 'Failed to cleanup memories');
    throw new Error(errorMsg);
  }
  const data = await response.json();
  return data.clean_memories_count || 0;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
