import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";

// GET /api/chat/[id] — get full chat with messages
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const chat = await Chat.findOne({ _id: params.id, userId: (session.user as any).id }).lean();
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    return NextResponse.json(chat);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/chat/[id] — delete a chat
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const result = await Chat.deleteOne({ _id: params.id, userId: (session.user as any).id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/chat/[id] — update chat title
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await req.json();
    await connectDB();

    const chat = await Chat.findOneAndUpdate(
      { _id: params.id, userId: (session.user as any).id },
      { title },
      { new: true }
    );
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    return NextResponse.json({ success: true, title: chat.title });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
