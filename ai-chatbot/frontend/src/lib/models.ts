import { LLMModel } from "@/types";

export const MODELS: LLMModel[] = [
  // Groq models (free, ultra-fast)
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", maxTokens: 32768 },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", provider: "groq", maxTokens: 8192 },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "groq", maxTokens: 32768 },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", provider: "groq", maxTokens: 8192 },
  // OpenAI models
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", maxTokens: 16384, supportsImages: true },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", maxTokens: 4096, supportsImages: true },
  // Together AI models
  { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Llama 3.3 70B (Together)", provider: "together", maxTokens: 8192 },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B (Together)", provider: "together", maxTokens: 32768 },
];

export const PROVIDERS: Record<string, { name: string; baseUrl: string; keyEnv: string }> = {
  groq: { name: "Groq", baseUrl: "https://api.groq.com/openai/v1", keyEnv: "GROQ_API_KEY" },
  openai: { name: "OpenAI", baseUrl: "https://api.openai.com/v1", keyEnv: "OPENAI_API_KEY" },
  together: { name: "Together AI", baseUrl: "https://api.together.xyz/v1", keyEnv: "TOGETHER_API_KEY" },
};

export function getModelsForProvider(provider: string): LLMModel[] {
  return MODELS.filter((m) => m.provider === provider);
}

export function getAvailableModels(): LLMModel[] {
  return MODELS.filter((m) => {
    const p = PROVIDERS[m.provider];
    return p && process.env[p.keyEnv];
  });
}
