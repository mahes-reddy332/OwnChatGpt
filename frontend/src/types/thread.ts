import type { ChatMessage } from './chat';

export interface Thread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface ThreadDetail extends Thread {
  messages: ChatMessage[];
}

export interface ThreadCreatePayload {
  title?: string;
}

export interface ThreadUpdatePayload {
  title: string;
}
