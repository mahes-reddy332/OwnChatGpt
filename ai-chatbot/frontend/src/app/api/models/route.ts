import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend";
import { getAvailableModels, MODELS } from "@/lib/models";

export async function GET() {
  try {
    const response = await fetch(getBackendApiUrl("/api/models"), { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load backend models");
    }

    const data = await response.json();
    const models = Array.isArray(data.models)
      ? data.models.map((model: any) => ({
          id: model.id,
          name: model.name,
          provider: model.provider,
          maxTokens: model.max_tokens,
        }))
      : [];

    if (models.length > 0) {
      return NextResponse.json(models);
    }
  } catch {
    const available = getAvailableModels();
    return NextResponse.json(available.length > 0 ? available : MODELS);
  }

  const available = getAvailableModels();
  return NextResponse.json(available.length > 0 ? available : MODELS);
}
