export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  files?: { name: string; type: string; size: number }[];
  images?: { url: string; prompt?: string }[];
  createdAt: Date;
}

export interface IChat {
  _id: string;
  userId: string;
  title: string;
  model: string;
  provider: string;
  messages: IMessage[];
  shared: boolean;
  shareId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  settings: {
    defaultModel: string;
    defaultProvider: string;
    apiKeys: Record<string, string>;
  };
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  supportsImages?: boolean;
  supportsFiles?: boolean;
}

export interface ChatRequest {
  message: string;
  chatId?: string;
  model?: string;
  provider?: string;
  files?: { name: string; content: string; type: string }[];
}

export interface ChatResponse {
  response: string;
  chatId: string;
  model: string;
  provider: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}
