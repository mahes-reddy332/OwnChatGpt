import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import { getBackendApiUrl } from "@/lib/backend";

// POST /api/chat — send a message (create chat if needed)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { message, chatId, model, provider, files, researchMode } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectDB();

    const selectedModel = model || process.env.DEFAULT_MODEL || "gemini-2.0-flash";
    const selectedProvider = provider || process.env.DEFAULT_PROVIDER || "gemini";

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    } else {
      chat = await Chat.create({
        userId,
        title: message.slice(0, 60) + (message.length > 60 ? "..." : ""),
        model: selectedModel,
        provider: selectedProvider,
        messages: [],
      });
    }

    chat.messages.push({
      role: "user",
      content: message,
      files: files?.map((f: any) => ({ name: f.name, type: f.type, size: f.size || f.content?.length || 0 })),
    });

    const backendResponse = await fetch(getBackendApiUrl("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation_id: chat.backendConversationId || undefined,
        model: selectedModel,
        files: Array.isArray(files)
          ? files.map((file: any) => ({
              upload_id: file.uploadId,
              name: file.name,
              type: file.type,
              size: file.size,
              content: file.content,
            }))
          : [],
        research_mode: !!researchMode,
      }),
      cache: "no-store",
    });
    const result = await backendResponse.json();
    if (!backendResponse.ok) {
      throw new Error(result.detail || result.error || "Backend chat request failed");
    }

    chat.messages.push({ role: "assistant", content: result.response });
    chat.model = selectedModel;
    chat.provider = result.provider || selectedProvider;
    chat.backendConversationId = result.conversation_id || chat.backendConversationId;
    await chat.save();

    return NextResponse.json({
      response: result.response,
      chatId: chat._id,
      model: result.model || selectedModel,
      provider: result.provider || selectedProvider,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process message" },
      { status: 500 }
    );
  }
}

// GET /api/chat — list all chats for user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = (session.user as any).id;

    const chats = await Chat.find({ userId })
      .select("title model provider createdAt updatedAt messages")
      .sort({ updatedAt: -1 })
      .lean();

    // Return chats with message count instead of full messages
    const result = chats.map((c: any) => ({
      _id: c._id,
      title: c.title,
      model: c.model,
      provider: c.provider,
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages?.[c.messages.length - 1]?.content?.slice(0, 100),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("List chats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
