/**
 * API client for communicating with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  model: string;
  provider: string;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  max_tokens: number;
}

export interface HealthStatus {
  status: string;
  provider: string;
  api_connected: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

export async function sendMessage(
  message: string,
  conversationId?: string,
  model?: string
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      model,
    }),
  });
}

export async function getHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("/health");
}

export async function getModels(): Promise<{ models: ModelInfo[]; current_provider: string }> {
  return apiFetch("/models");
}

export async function getStatus() {
  return apiFetch<{
    provider: string;
    model: string;
    total_conversations: number;
    total_messages: number;
    uptime_seconds: number;
  }>("/status");
}
