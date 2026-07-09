import OpenAI from "openai";
import { PROVIDERS } from "./models";

const SYSTEM_PROMPT = `You are an expert AI coding assistant. You help with:
- Writing, debugging, and optimizing code
- Explaining complex concepts clearly
- Providing best practices and design patterns
- Analyzing errors and suggesting fixes

Format responses with markdown. Use code blocks with language tags. Be concise but thorough.`;

const RESEARCH_PROMPT = `You are a deep research assistant. When given a topic:
1. Break it down into key aspects
2. Provide comprehensive, well-structured analysis
3. Include relevant examples, data points, and references
4. Organize with clear headings and sections
5. Conclude with a summary of key findings

Be thorough, accurate, and cite sources where possible.`;

export function createLLMClient(provider: string, customApiKey?: string): OpenAI {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const apiKey = customApiKey || process.env[config.keyEnv];
  if (!apiKey) throw new Error(`No API key for provider: ${provider}`);

  return new OpenAI({ apiKey, baseURL: config.baseUrl });
}

export async function chatCompletion(opts: {
  provider: string;
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
  researchMode?: boolean;
  customApiKey?: string;
}) {
  const client = createLLMClient(opts.provider, opts.customApiKey);

  const systemPrompt = opts.researchMode ? RESEARCH_PROMPT : SYSTEM_PROMPT;
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...opts.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const response = await client.chat.completions.create({
    model: opts.model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4096,
  });

  const choice = response.choices[0];
  return {
    response: choice.message.content || "",
    model: opts.model,
    provider: opts.provider,
    usage: response.usage
      ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        }
      : undefined,
  };
}

export async function generateImage(opts: {
  prompt: string;
  apiKey?: string;
}) {
  // Use OpenAI for image generation
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key required for image generation");

  const client = new OpenAI({ apiKey });
  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: opts.prompt,
    n: 1,
    size: "1024x1024",
  });

  return { url: response.data?.[0]?.url, revisedPrompt: response.data?.[0]?.revised_prompt };
}
